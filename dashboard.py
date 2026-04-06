import json, os, time, requests
from pathlib import Path
from flask import Flask, jsonify, request, render_template_string
from wsgiref.simple_server import make_server
import psutil

#!/usr/bin/env python3
"""
OpenClaw Multi-Workspace Dashboard
Bind: 0.0.0.0:5055  |  wsgiref server
"""

try:
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

app = Flask(__name__)

GATEWAY_URL   = os.environ.get("OPENCLAW_GATEWAY_URL", "http://openclaw-gateway:18789")
LM_STUDIO_URL = os.environ.get("LM_STUDIO_URL",        "http://192.168.1.5:1234")
GATEWAY_TOKEN = os.environ.get("OPENCLAW_GATEWAY_TOKEN", "")
DATA_FILE     = Path(os.environ.get("DATA_FILE", "/data/workspaces.json"))
PORT          = int(os.environ.get("PORT", 5055))

# ── constants ──────────────────────────────────────────────────────────────────
# Schema keys
KEY_ID = "id"
KEY_NAME = "name"
KEY_AGENTS = "agents"
KEY_WORKSPACES = "workspaces"
KEY_STATUS = "status"
KEY_MODEL = "model"
KEY_PROVIDER = "provider"
KEY_ROLE = "role"
KEY_PARENT = "parent"
KEY_TOPOLOGY = "topology"
KEY_CHANNELS = "channels"
KEY_CUSTOM_NAME = "custom_name"

# Status values
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
STATUS_UNREACHABLE = "UNREACHABLE"

# Default values
DEFAULT_WORKSPACE_ID = "default"
DEFAULT_PROVIDER = "unknown"
DEFAULT_ROLE = "subagent"
DEFAULT_TOPOLOGY = "orchestrator"

# Cache
_DISCOVERY_CACHE = {"data": None, "time": 0}
_CACHE_TTL = 300  # 5 minutes

# ── helpers ──────────────────────────────────────────────────────────────────
def gw_headers():
    h = {"Content-Type": "application/json"}
    if GATEWAY_TOKEN:
        h["Authorization"] = f"Bearer {GATEWAY_TOKEN}"
    return h

def gateway_get(path, timeout=5):
    try:
        r = requests.get(f"{GATEWAY_URL}{path}", headers=gw_headers(), timeout=timeout)
        r.raise_for_status()
        return r.json(), None
    except Exception as e:
        return None, str(e)

# ── agent & workspace discovery ────────────────────────────────────────────────
def normalize_api_response(data, key_name):
    """Extract list from variable API response shapes"""
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and key_name in data:
        return data.get(key_name, [])
    return []

def infer_provider(model_str):
    """Map model string to provider name"""
    if not model_str:
        return DEFAULT_PROVIDER
    model_lower = str(model_str).lower()
    if "gpt" in model_lower or "openai" in model_lower:
        return "openai"
    elif "minimax" in model_lower:
        return "minimax"
    elif "qwen" in model_lower or "lmstudio" in model_lower:
        return "lmstudio"
    elif "grok" in model_lower or "xai" in model_lower:
        return "xai"
    elif "claude" in model_lower or "anthropic" in model_lower:
        return "anthropic"
    return DEFAULT_PROVIDER

def extract_agents_from_status(status):
    """Extract unique agents from session data"""
    if not status or not status.get("sessions"):
        return []
    seen = set()
    agent_list = []
    for session in status.get("sessions", {}).get("recent", []):
        agent_id = session.get("agent", DEFAULT_PROVIDER).lower()
        if agent_id not in seen and agent_id != DEFAULT_PROVIDER:
            seen.add(agent_id)
            agent_list.append({
                KEY_ID: agent_id,
                KEY_NAME: session.get("agent_name", agent_id.title()),
                KEY_MODEL: session.get(KEY_MODEL, DEFAULT_PROVIDER),
                KEY_PROVIDER: infer_provider(session.get(KEY_MODEL)),
                KEY_STATUS: STATUS_ACTIVE
            })
    return agent_list

def discover_agents_from_gateway(status_cache=None):
    """Fetch agents from Gateway API, with fallback logic"""
    agents_data, err = gateway_get("/api/agents")
    if agents_data and not err:
        agents = normalize_api_response(agents_data, KEY_AGENTS)
        if agents:
            return agents

    # Fallback: extract from status
    if status_cache and status_cache.get("sessions"):
        return extract_agents_from_status(status_cache)

    status, _ = gateway_get("/api/status")
    return extract_agents_from_status(status) if status else []

def discover_workspaces_from_gateway(status_cache=None):
    """Fetch workspaces from Gateway API"""
    workspaces, err = gateway_get("/api/workspaces")
    if workspaces and not err:
        ws = normalize_api_response(workspaces, KEY_WORKSPACES)
        if ws:
            return ws

    # Fallback: create default if we have session data
    if status_cache and status_cache.get("sessions", {}).get("recent"):
        return [{KEY_ID: DEFAULT_WORKSPACE_ID, KEY_NAME: "Default Workspace", KEY_TOPOLOGY: DEFAULT_TOPOLOGY}]

    return [{KEY_ID: DEFAULT_WORKSPACE_ID, KEY_NAME: DEFAULT_WORKSPACE_ID.title(), KEY_TOPOLOGY: DEFAULT_TOPOLOGY}]

def load_local_workspaces():
    """Load workspace topology and relationships from local JSON"""
    try:
        data = json.loads(DATA_FILE.read_text())
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {DATA_FILE}: {e}")
        return {}
    except Exception as e:
        print(f"ERROR: Failed to load {DATA_FILE}: {e}")
        return {}

def build_agent_record(agent_id, agent_data, agent_local, status=STATUS_ACTIVE):
    """Unified agent record construction"""
    return {
        KEY_ID: agent_id,
        KEY_NAME: agent_local.get(KEY_CUSTOM_NAME) or agent_data.get(KEY_NAME, agent_id),
        KEY_MODEL: agent_data.get(KEY_MODEL, DEFAULT_PROVIDER),
        KEY_PROVIDER: agent_data.get(KEY_PROVIDER, DEFAULT_PROVIDER),
        KEY_ROLE: agent_local.get(KEY_ROLE, DEFAULT_ROLE),
        KEY_PARENT: agent_local.get(KEY_PARENT),
        KEY_STATUS: status,
        KEY_CHANNELS: agent_data.get(KEY_CHANNELS, [])
    }

def merge_api_with_local(api_agents, api_workspaces, local_data):
    """Merge API-discovered agents/workspaces with local topology data"""
    api_agent_ids = {a.get(KEY_ID) for a in api_agents if isinstance(a, dict)}
    merged_workspaces = []

    for ws in api_workspaces:
        if not isinstance(ws, dict):
            continue

        ws_id = ws.get(KEY_ID, DEFAULT_WORKSPACE_ID)
        local_ws = local_data.get(KEY_WORKSPACES, {}).get(ws_id, {})
        if not isinstance(local_ws, dict):
            local_ws = {}

        merged_agents = []
        agent_local_map = local_ws.get(KEY_AGENTS, {})

        # Add active agents from API
        for agent in api_agents:
            if not isinstance(agent, dict):
                continue
            agent_id = agent.get(KEY_ID)
            if agent_id:
                agent_local = agent_local_map.get(agent_id, {})
                merged_agents.append(build_agent_record(agent_id, agent, agent_local, agent.get(KEY_STATUS, STATUS_ACTIVE)))

        # Add inactive agents from local cache that are not in API
        for agent_id, agent_local in agent_local_map.items():
            if agent_id not in api_agent_ids:
                merged_agents.append(build_agent_record(agent_id, agent_local, agent_local, STATUS_INACTIVE))

        merged_workspaces.append({
            KEY_ID: ws_id,
            KEY_NAME: ws.get(KEY_NAME, ws_id.title()),
            KEY_TOPOLOGY: local_ws.get(KEY_TOPOLOGY, ws.get(KEY_TOPOLOGY, DEFAULT_TOPOLOGY)),
            KEY_AGENTS: merged_agents
        })

    return {KEY_WORKSPACES: merged_workspaces}


# ── workspace persistence ─────────────────────────────────────────────────────
def load_ws():
    """Load workspaces from Gateway API, merge with local topology data, with fallback and caching"""
    # Check cache first
    now = time.time()
    if _DISCOVERY_CACHE["data"] and (now - _DISCOVERY_CACHE["time"]) < _CACHE_TTL:
        return _DISCOVERY_CACHE["data"]

    # Try API discovery (fetch status once, use for both discoveries)
    status, err_status = gateway_get("/api/status")
    if err_status:
        print(f"WARNING: Failed to fetch {GATEWAY_URL}/api/status: {err_status}")

    agents = discover_agents_from_gateway(status_cache=status)
    workspaces = discover_workspaces_from_gateway(status_cache=status)

    if agents or workspaces:
        # Successfully got data from API, merge with local
        local_data = load_local_workspaces()
        result = merge_api_with_local(agents, workspaces, local_data)
        _DISCOVERY_CACHE["data"] = result
        _DISCOVERY_CACHE["time"] = now
        return result

    # Fallback: load local cache and mark everything as UNREACHABLE
    local_data = load_local_workspaces()
    if local_data:
        print("ERROR: All discovery methods failed, using local cache with UNREACHABLE status")
        data = local_data
        for ws in data.get(KEY_WORKSPACES, {}).values():
            for agent in ws.get(KEY_AGENTS, {}).values():
                agent[KEY_STATUS] = STATUS_UNREACHABLE
        # Convert old format if needed
        if isinstance(data.get(KEY_WORKSPACES), dict):
            result = {KEY_WORKSPACES: list(data.get(KEY_WORKSPACES, {}).values())}
        else:
            result = data
        _DISCOVERY_CACHE["data"] = result
        _DISCOVERY_CACHE["time"] = now
        return result

    # Last resort: create empty workspace structure
    result = {KEY_WORKSPACES: [{
        KEY_ID: DEFAULT_WORKSPACE_ID,
        KEY_NAME: "Default",
        KEY_TOPOLOGY: DEFAULT_TOPOLOGY,
        KEY_AGENTS: []
    }]}
    _DISCOVERY_CACHE["data"] = result
    _DISCOVERY_CACHE["time"] = now
    return result

def save_ws(data):
    """Save only workspace topology and agent relationships, not API data"""
    to_save = {}
    to_save[KEY_WORKSPACES] = {}

    for ws in data.get(KEY_WORKSPACES, []):
        ws_id = ws.get(KEY_ID, DEFAULT_WORKSPACE_ID)
        to_save[KEY_WORKSPACES][ws_id] = {
            KEY_TOPOLOGY: ws.get(KEY_TOPOLOGY, DEFAULT_TOPOLOGY),
            KEY_AGENTS: {}
        }

        for agent in ws.get(KEY_AGENTS, []):
            agent_id = agent.get(KEY_ID)
            if agent_id:
                to_save[KEY_WORKSPACES][ws_id][KEY_AGENTS][agent_id] = {
                    KEY_ROLE: agent.get(KEY_ROLE, DEFAULT_ROLE),
                    KEY_PARENT: agent.get(KEY_PARENT),
                    KEY_CUSTOM_NAME: agent.get(KEY_CUSTOM_NAME) if agent.get(KEY_CUSTOM_NAME) != agent.get(KEY_NAME) else None
                }

    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(to_save, indent=2))
    # Invalidate cache after write
    _DISCOVERY_CACHE["data"] = None
    _DISCOVERY_CACHE["time"] = 0



# ── API routes ────────────────────────────────────────────────────────────────
@app.route("/api/workspaces", methods=["GET"])
def api_workspaces():
    return jsonify(load_ws())

@app.route("/api/workspaces", methods=["POST"])
def api_create_ws():
    data = load_ws()
    ws = request.json
    ws[KEY_ID] = ws.get(KEY_ID, f"ws_{int(time.time())}")
    ws.setdefault(KEY_AGENTS, [])
    data[KEY_WORKSPACES].append(ws)
    save_ws(data)
    return jsonify(ws), 201

@app.route("/api/workspaces/<ws_id>", methods=["PUT"])
def api_update_ws(ws_id):
    data = load_ws()
    for i, ws in enumerate(data[KEY_WORKSPACES]):
        if ws[KEY_ID] == ws_id:
            data[KEY_WORKSPACES][i] = {**ws, **request.json, KEY_ID: ws_id}
            save_ws(data)
            return jsonify(data[KEY_WORKSPACES][i])
    return jsonify({"error": "not found"}), 404

@app.route("/api/workspaces/<ws_id>", methods=["DELETE"])
def api_delete_ws(ws_id):
    data = load_ws()
    data[KEY_WORKSPACES] = [w for w in data[KEY_WORKSPACES] if w[KEY_ID] != ws_id]
    save_ws(data)
    return jsonify({"ok": True})

@app.route("/api/workspaces/<ws_id>/agents", methods=["POST"])
def api_add_agent(ws_id):
    data = load_ws()
    for ws in data[KEY_WORKSPACES]:
        if ws[KEY_ID] == ws_id:
            agent = request.json
            agent[KEY_ID] = agent.get(KEY_ID) or agent.get(KEY_NAME, "agent").lower()
            ws[KEY_AGENTS].append(agent)
            save_ws(data)
            return jsonify(agent), 201
    return jsonify({"error": "workspace not found"}), 404

@app.route("/api/workspaces/<ws_id>/agents/<agent_id>", methods=["DELETE"])
def api_delete_agent(ws_id, agent_id):
    data = load_ws()
    for ws in data[KEY_WORKSPACES]:
        if ws[KEY_ID] == ws_id:
            ws[KEY_AGENTS] = [a for a in ws[KEY_AGENTS] if a[KEY_ID] != agent_id]
            save_ws(data)
            return jsonify({"ok": True})
    return jsonify({"error": "not found"}), 404

@app.route("/api/gateway")
def api_gateway():
    t0 = time.time()
    status, err = gateway_get("/api/status")
    latency = round((time.time() - t0) * 1000)
    if status and not status.get("latencyMs"):
        status["latencyMs"] = latency
    return jsonify({"status": status, "error": err})

@app.route("/api/costs")
def api_costs():
    costs, err = gateway_get("/api/usage?days=7")
    return jsonify({"data": costs, "error": err})

@app.route("/api/lmstudio")
def api_lmstudio():
    try:
        r = requests.get(f"{LM_STUDIO_URL}/v1/models", timeout=3)
        d = r.json()
        models = d.get("data", [])
        return jsonify({"reachable": True, "model_count": len(models),
                        "models": [m.get("id","?") for m in models[:8]]})
    except Exception as e:
        return jsonify({"reachable": False, "error": str(e)})

@app.route("/api/system")
def api_system():
    if not HAS_PSUTIL:
        return jsonify({"error": "psutil not installed"})
    return jsonify({
        "cpu":    psutil.cpu_percent(interval=0.3),
        "ram":    dict(psutil.virtual_memory()._asdict()),
        "disk":   dict(psutil.disk_usage("/")._asdict()),
        "uptime": time.time() - psutil.boot_time(),
    })

@app.route("/")
def index():
    return render_template_string(HTML)

if __name__ == "__main__":
    server = make_server("0.0.0.0", PORT, app)
    print(f"Dashboard running on http://0.0.0.0:{PORT}")
    server.serve_forever()

# ── HTML ──────────────────────────────────────────────────────────────────────
HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="60">
<title>OpenClaw Dashboard</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0d14;color:#dde1f0;font-family:'Inter',system-ui,sans-serif}
.btn{padding:8px 16px;border-radius:8px;font-weight:500;cursor:pointer;border:none}
.btn-primary{background:#38bdf8;color:#0b0d14}
.btn-primary:hover{background:#7dd3fc}
.stat-card{background:#12141f;border:1px solid #252840;border-radius:12px;padding:16px}
</style>
</head>
<body>
<div style="max-width:1200px;margin:0 auto;padding:24px">
  <h1 style="font-size:28px;margin-bottom:24px">OpenClaw Dashboard</h1>
  <div id="workspaces" style="display:grid;gap:16px"></div>
</div>
<script>
async function loadDashboard(){const r=await fetch('/api/workspaces');const d=await r.json();document.getElementById('workspaces').innerHTML=d.workspaces.map(w=>`<div class="stat-card"><h2>${w.name}</h2><p>${w.agents.length} agents</p></div>`).join('')}
loadDashboard();setInterval(loadDashboard,30000);
</script>
</body>
</html>"""