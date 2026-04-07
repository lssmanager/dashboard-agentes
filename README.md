# OpenClaw Dashboard

Real-time monitoring dashboard for OpenClaw AI agents. Connects to the OpenClaw Gateway via WebSocket Protocol v3, with zero hardcoded agent data.

**Live:** https://cost.socialstudies.cloud  
**Gateway:** https://open.socialstudies.cloud (Cloudflare Access protected)

---

## Architecture

```
Browser (user on internet)
    │
    │ HTTPS
    ▼
Cloudflare → Traefik → Express (port 3000)
                          │
                          │  serves frontend/ as static files
                          │  serves /api/* routes
                          │
                          │  WebSocket (internal Docker network)
                          ▼
                     OpenClaw Gateway (ws://openclaw:18789)
```

**Key design decision:** The browser NEVER connects directly to the Gateway. The Express backend acts as a proxy — it maintains a persistent WebSocket connection to the Gateway over the internal Docker network, and the frontend only talks to its own backend via REST (`/api/dashboard/state`, `/api/topology`, etc.).

This solves the network problem: the Gateway runs on a private Docker network (`openclawnet`) and is not directly reachable from the internet. The dashboard backend, running in the same Docker network, bridges the gap.

### Backend: Node.js + Express

- **Gateway client** (`backend/routes/gateway-client.js`): Persistent WebSocket connection with OpenClaw Protocol v3 handshake, circuit breaker, retry logic, response caching, and diagnostic logging
- **API routes** (`backend/routes/api.js`): Dashboard state, topology, YAML generation, health check, diagnostics, and gateway log endpoints
- **Persistent storage**: Topology configuration only (not agent data) in `/app/data/workspaces-topology.json`

### Frontend: Vanilla JavaScript + D3.js

- State-driven rendering with in-memory state management
- No frameworks, no build step — just static HTML/JS/CSS served by Express
- Component architecture with `window.*` registration for lazy validation
- D3.js force-directed graph for topology visualization
- Auto-refresh every 30 seconds (configurable)
- Dark theme with custom CSS

### Deployment: Nixpacks (Coolify)

- No Dockerfile needed — Nixpacks auto-detects Node.js
- Start command: `node backend/server.js`
- Network: must be on the same Docker network as OpenClaw (`openclawnet`)
- Persistent volume for `/app/data`

---

## OpenClaw Gateway Protocol v3

The dashboard implements the official OpenClaw WebSocket protocol, based on the source code at:
- [`scripts/dev/gateway-ws-client.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/dev/gateway-ws-client.ts) — reference client
- [`scripts/dev/gateway-smoke.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/dev/gateway-smoke.ts) — handshake example
- [`src/gateway/client.ts`](https://github.com/openclaw/openclaw/blob/main/src/gateway/client.ts) — official GatewayClient
- [`src/gateway/protocol/client-info.ts`](https://github.com/openclaw/openclaw/blob/main/src/gateway/protocol/client-info.ts) — valid client IDs
- [`src/gateway/method-scopes.ts`](https://github.com/openclaw/openclaw/blob/main/src/gateway/method-scopes.ts) — available RPC methods

### Connection Flow

```
1. Client opens WebSocket to ws://openclaw:18789
2. Gateway sends:  { type: "event", event: "connect.challenge", payload: { nonce: "..." } }
3. Client sends:   { type: "req", id: "...", method: "connect", params: {
                       minProtocol: 3, maxProtocol: 3,
                       client: { id: "gateway-client", mode: "backend", ... },
                       auth: { token: "<GATEWAY_API_KEY>" },
                       role: "operator",
                       scopes: ["operator.read", "operator.admin"]
                     }}
4. Gateway responds: { type: "res", id: "...", ok: true, payload: { ... } }
5. Client can now send RPC requests (health, agents.list, sessions.list, etc.)
```

### Critical: Valid Client IDs

The Gateway validates `client.id` against a strict allowlist. Only these values are accepted:

| ID | Use Case |
|---|---|
| `gateway-client` | Backend clients (this dashboard) |
| `cli` | CLI tools |
| `openclaw-control-ui` | Control UI (browser) |
| `webchat-ui` | Webchat interface |
| `openclaw-ios` | iOS app |
| `openclaw-android` | Android app |
| `openclaw-macos` | macOS app |
| `node-host` | Node host |
| `test` | Testing |

Using any other value (e.g., `"openclaw-dashboard"`) results in:
```
INVALID_REQUEST: at /client/id: must be equal to constant; must match a schema in anyOf
```

### RPC Methods Used

| Method | Scope | Purpose |
|---|---|---|
| `health` | `operator.read` | Gateway health check |
| `agents.list` | `operator.read` | Discover all configured agents |
| `sessions.list` | `operator.read` | Recent chat sessions |
| `usage.cost` | `operator.read` | Token usage and costs |
| `status` | `operator.read` | Full gateway status |

---

## Features

- **Auto-Discovery**: Agents and workspaces discovered dynamically from Gateway API
- **Real-Time Monitoring**: Live agent status, sessions, and costs
- **Interactive Topology**: D3.js visualization with 3 layout modes (orchestrator, peer-to-peer, hierarchical)
- **Gateway Logs Panel**: Real-time diagnostic logs showing connection state, errors, and handshake details
- **Graceful Disconnection**: Circuit breaker + cached data fallback when Gateway is unreachable
- **Dark Theme**: Modern, responsive UI

---

## Environment Variables

Configure in Coolify (or `.env` for local dev):

| Variable | Required | Default | Description |
|---|---|---|---|
| `GATEWAY_URL` | Yes | `ws://openclaw:18789` | Gateway WebSocket URL (internal Docker network) |
| `GATEWAY_API_KEY` | Yes | — | Gateway auth token (`gateway.auth.token` from `openclaw.json`) |
| `PORT` | No | `3000` | Express server port |
| `TIMEOUT` | No | `10000` | WebSocket request timeout (ms) |
| `DATA_FILE` | No | `/app/data/workspaces-topology.json` | Topology storage path |
| `NODE_ENV` | No | `production` | Environment |

### Finding Your Gateway API Key

The `GATEWAY_API_KEY` must match the token configured in OpenClaw:

```bash
# On the machine running OpenClaw:
openclaw config get gateway.auth.token

# Or check the config file directly:
cat ~/.openclaw/openclaw.json | grep token
```

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/dashboard/state` | GET | Full dashboard state (agents, workspaces, sessions, costs) |
| `/api/topology` | GET | Local topology configuration |
| `/api/topology` | POST | Update topology (type, parentChildMap) |
| `/api/agents/yaml` | POST | Generate YAML snippet for a new agent |
| `/api/health` | GET | Gateway connection health check |
| `/api/diagnostics` | GET | Deep diagnostics (DNS, HTTP, WebSocket state, errors, last connect response) |
| `/api/logs` | GET | Gateway log buffer (last 100 entries) |

---

## Diagnostics

The `/api/diagnostics` endpoint provides deep visibility into the Gateway connection:

```json
{
  "config": {
    "GATEWAY_URL": "ws://openclaw:18789",
    "GATEWAY_API_KEY_SET": true,
    "GATEWAY_API_KEY_LENGTH": 48,
    "PROTOCOL_VERSION": 3
  },
  "connection": {
    "wsReadyState": "OPEN",
    "handshakeComplete": true,
    "connectionAttempts": 1,
    "lastConnectResponse": { "ok": true, "payload": { "..." } }
  },
  "network": {
    "dns": { "address": "10.0.8.4", "family": 4 },
    "httpHealthCheck": { "status": 200, "body": "{\"ok\":true,\"status\":\"live\"}" }
  }
}
```

The Logs panel at the bottom of the dashboard displays this information visually, along with a scrollable log of all Gateway connection events.

---

## Troubleshooting

### Components not loading (timeout)
Each component JS file must register its class on `window`:
```js
// At the end of each component file:
window.ConnectionBadge = ConnectionBadge;
```

### D3.js blocked by CSP
Use jsDelivr CDN (passes most CSP configs) or serve locally:
```html
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
```

### Gateway unreachable
1. Check `/api/diagnostics` — DNS must resolve, HTTP health must return 200
2. Verify the dashboard container is on the `openclawnet` Docker network
3. Verify `GATEWAY_API_KEY` matches `openclaw config get gateway.auth.token`

### Connect rejected (INVALID_REQUEST)
The `client.id` must be one of the official values (see table above). This dashboard uses `gateway-client`.

### Connect rejected (AUTH_TOKEN_MISMATCH)
The `GATEWAY_API_KEY` doesn't match. Regenerate with:
```bash
openclaw doctor --generate-gateway-token
```
Then update the variable in Coolify and redeploy.

---

## File Structure

```
├── backend/
│   ├── server.js                  # Express entry point
│   └── routes/
│       ├── api.js                 # REST API routes
│       └── gateway-client.js      # OpenClaw WebSocket client (Protocol v3)
├── frontend/
│   ├── index.html                 # Main HTML
│   ├── app.js                     # App state + refresh logic
│   ├── styles.css                 # Dark theme CSS
│   ├── components/
│   │   ├── connection-badge.js    # Connection status indicator
│   │   ├── tabs.js                # Workspace tabs
│   │   ├── summary-cards.js       # Metric cards
│   │   ├── topology-visualizer.js # D3.js force graph
│   │   ├── agents-table.js        # Agent list table
│   │   ├── channels-panel.js      # Channel overview
│   │   ├── costs-panel.js         # Usage costs
│   │   ├── activity-feed.js       # Recent sessions
│   │   ├── logs-panel.js          # Gateway logs & diagnostics
│   │   ├── diagnostic-panel.js    # Error diagnostic overlay
│   │   ├── modals.js              # Create workspace/agent modals
│   │   └── theme-toggle.js        # Dark/light mode
│   └── services/
│       ├── gateway-client.js      # Frontend REST client (fetch wrapper)
│       └── diagnostic-service.js  # Frontend diagnostic checks
├── package.json
├── nixpacks.toml
└── .env.example
```

---

## Agents (Current Configuration)

| Agent | Model | Provider | Role |
|---|---|---|---|
| Clawdia | minimax/minimax-m2.7 | Minimax | Default |
| Atlas | gpt-5.4 | OpenAI | Orchestrator |
| Nova | unsloth/qwen3.5-27b | LM Studio | Subagent |
| Intel | grok-4-1-fast | XAI | Subagent |

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# For local development, create .env:
cp .env.example .env
# Edit .env with your Gateway URL and API key
```

For local development without a Gateway, the dashboard gracefully shows "Gateway Unreachable" and the diagnostic panel.
