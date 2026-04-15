/**
 * Dashboard API Routes
 * Handles all dashboard endpoints and data merging logic
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  discoverAgents,
  discoverWorkspaces,
  getSessions,
  healthCheck,
  inferProvider,
  normalizeModelString,
  getDiagnostics,
  getLogBuffer
} = require('./gateway-client');

const router = express.Router();

const DATA_FILE = process.env.DATA_FILE || '/app/data/workspaces-topology.json';

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load local topology JSON
 */
function loadLocalTopology() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content || '{}');
    }
  } catch (error) {
    console.error(`[API] Error loading topology: ${error.message}`);
  }
  return { workspaces: {}, last_cache: {} };
}

/**
 * Save local topology JSON
 */
function saveLocalTopology(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`[API] Error saving topology: ${error.message}`);
  }
}

/**
 * Merge API data with local topology
 */
function mergeData(apiAgents, apiWorkspaces, localData) {
  const merged = {
    workspaces: [],
    agents: {}
  };

  const normalizedWorkspaceMap = new Map();
  const sourceWorkspaces = Array.isArray(apiWorkspaces) ? apiWorkspaces : [];

  for (const apiWs of sourceWorkspaces) {
    const wsId = apiWs?.id || 'default';
    normalizedWorkspaceMap.set(wsId, {
      id: wsId,
      name: apiWs?.name || wsId,
      path: apiWs?.path || null,
      type: apiWs?.type || 'workspace'
    });
  }

  for (const apiAgent of apiAgents) {
    const wsId = apiAgent.workspaceId || 'default';
    if (!normalizedWorkspaceMap.has(wsId)) {
      normalizedWorkspaceMap.set(wsId, {
        id: wsId,
        name: apiAgent.workspaceName || wsId,
        path: apiAgent.workspacePath || null,
        type: apiAgent.workspaceType || 'workspace'
      });
    }
  }

  if (normalizedWorkspaceMap.size === 1 && normalizedWorkspaceMap.has('default')) {
    const fallbackGroups = new Map();
    for (const apiAgent of apiAgents) {
      const fallbackKey = apiAgent.workspacePath || apiAgent.workspaceName || apiAgent.id || 'default';
      if (!fallbackGroups.has(fallbackKey)) {
        fallbackGroups.set(fallbackKey, {
          id: apiAgent.workspaceId && apiAgent.workspaceId !== 'default' ? apiAgent.workspaceId : String(fallbackKey),
          name: apiAgent.workspaceName || apiAgent.name || String(fallbackKey),
          path: apiAgent.workspacePath || null,
          type: apiAgent.workspaceType || 'workspace'
        });
      }
    }

    if (fallbackGroups.size > 1) {
      normalizedWorkspaceMap.clear();
      for (const [fallbackKey, workspace] of fallbackGroups.entries()) {
        const normalizedId = workspace.path
          ? String(workspace.path).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          : String(workspace.id || fallbackKey).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
        normalizedWorkspaceMap.set(normalizedId, {
          ...workspace,
          id: normalizedId
        });
      }

      apiAgents = apiAgents.map(agent => {
        const fallbackKey = agent.workspacePath || agent.workspaceName || agent.id || 'default';
        const workspace = fallbackGroups.get(fallbackKey);
        const normalizedId = workspace?.path
          ? String(workspace.path).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          : String(workspace?.id || fallbackKey).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
        return {
          ...agent,
          workspaceId: normalizedId,
          workspaceName: workspace?.name || agent.workspaceName || normalizedId,
          workspacePath: workspace?.path || agent.workspacePath || null
        };
      });
    }
  }

  if (normalizedWorkspaceMap.size === 0 && apiAgents.length > 0) {
    normalizedWorkspaceMap.set('default', { id: 'default', name: 'Default Workspace', type: 'orchestrator', path: null });
  }

  const workspaceList = Array.from(normalizedWorkspaceMap.values());

  for (const apiWs of workspaceList) {
    const wsId = apiWs.id || 'default';
    const localWs = localData.workspaces?.[wsId] || {};
    const workspaceAgents = apiAgents.filter(agent => (agent.workspaceId || 'default') === wsId);

    const workspace = {
      id: wsId,
      name: apiWs.name || wsId,
      path: apiWs.path || null,
      type: localWs.type || apiWs.type || 'orchestrator',
      description: localWs.description || apiWs.description || '',
      parentChildMap: localWs.parentChildMap || {},
      agents: []
    };

    for (const apiAgent of workspaceAgents) {
      const agentId = apiAgent.id || apiAgent.name;
      const localAgent = localWs.agents?.[agentId] || {};

      const normalizedModel = normalizeModelString(apiAgent.model) || 'unknown';
      const normalizedChannels = Array.isArray(apiAgent.channels) ? apiAgent.channels : [];
      const normalizedStatus = typeof apiAgent.status === 'string'
        ? apiAgent.status
        : apiAgent.status != null
          ? String(apiAgent.status?.label || apiAgent.status)
          : 'ACTIVE';

      const agent = {
        id: agentId,
        name: apiAgent.name || agentId,
        model: normalizedModel,
        provider: apiAgent.provider || inferProvider(normalizedModel),
        role: localAgent.role || apiAgent.role || 'subagent',
        parent: localAgent.parent || apiAgent.parent || null,
        status: normalizedStatus,
        channels: normalizedChannels,
        lastActive: apiAgent.lastActive || null,
        workspaceId: wsId,
        workspaceName: apiWs.name || wsId,
        workspacePath: apiWs.path || null
      };

      workspace.agents.push(agent);
    }

    merged.workspaces.push(workspace);
    merged.agents[wsId] = workspace.agents;
  }

  merged.workspaces.sort((a, b) => a.name.localeCompare(b.name));

  // Update last_cache with API data
  merged.last_cache = {
    agents: apiAgents,
    workspaces: apiWorkspaces,
    timestamp: Date.now()
  };

  return merged;
}

/**
 * GET /api/dashboard/state
 * Main endpoint that fetches and merges all data
 */
router.get('/dashboard/state', async (req, res) => {
  try {
    const isHealthy = await healthCheck();

    // Fetch all data from Gateway
    const agentsResult = await discoverAgents();
    const workspacesResult = await discoverWorkspaces();
    const sessionsResult = await getSessions(50);

    // Load local topology
    const localData = loadLocalTopology();

    // Merge API + local data
    const merged = mergeData(
      agentsResult.agents,
      workspacesResult.workspaces,
      localData
    );

    // Update cache in local JSON
    localData.last_cache = merged.last_cache;
    saveLocalTopology(localData);

    // Process sessions - deduplicate and limit to last 10
    const uniqueSessions = new Map();
    for (const session of sessionsResult.sessions) {
      const key = `${session.agent}-${session.type || 'default'}`;
      uniqueSessions.set(key, session);
    }
    const sessions = Array.from(uniqueSessions.values()).slice(0, 10);

    const offline = !!(agentsResult.offline || workspacesResult.offline);

    // Response
    res.json({
      connected: isHealthy && !offline,
      offline,
      gatewayUrl: process.env.GATEWAY_URL || 'ws://openclaw:18789',
      workspaces: merged.workspaces,
      agents: merged.agents,
      sessions,
      lastFetch: Date.now()
    });
  } catch (error) {
    console.error(`[API] Error in /dashboard/state: ${error.message}`);
    res.status(500).json({
      error: error.message,
      code: 'DASHBOARD_STATE_ERROR'
    });
  }
});

/**
 * GET /api/topology
 * Get current topology configuration
 */
router.get('/topology', (req, res) => {
  try {
    const data = loadLocalTopology();
    res.json(data);
  } catch (error) {
    console.error(`[API] Error in /topology GET: ${error.message}`);
    res.status(500).json({
      error: error.message,
      code: 'TOPOLOGY_LOAD_ERROR'
    });
  }
});

/**
 * POST /api/topology
 * Update topology configuration
 */
router.post('/topology', (req, res) => {
  try {
    const { workspaceId, type, parentChildMap, description } = req.body;

    if (!workspaceId || !type) {
      return res.status(400).json({
        error: 'Missing required fields: workspaceId, type',
        code: 'MISSING_FIELDS'
      });
    }

    const data = loadLocalTopology();

    // Ensure workspaces object exists
    if (!data.workspaces) {
      data.workspaces = {};
    }

    // Create or update workspace topology
    data.workspaces[workspaceId] = {
      type,
      description: description || '',
      parentChildMap: parentChildMap || {}
    };

    saveLocalTopology(data);

    res.json({
      success: true,
      workspace: data.workspaces[workspaceId]
    });
  } catch (error) {
    console.error(`[API] Error in /topology POST: ${error.message}`);
    res.status(500).json({
      error: error.message,
      code: 'TOPOLOGY_SAVE_ERROR'
    });
  }
});

/**
 * POST /api/agents/yaml
 * Generate YAML snippet for a new agent
 */
router.post('/agents/yaml', (req, res) => {
  try {
    const { id, name, model, provider, role, parentId, channels } = req.body;

    if (!id || !name || !model || !provider) {
      return res.status(400).json({
        error: 'Missing required fields: id, name, model, provider',
        code: 'MISSING_FIELDS'
      });
    }

    let yaml = `agents:\n  ${id}:\n    name: "${name}"\n    model: "${model}"\n    provider: ${provider}\n    role: ${role || 'subagent'}\n`;

    if (parentId) {
      yaml += `    parent: "${parentId}"\n`;
    }

    if (channels && channels.length > 0) {
      yaml += `    channels:\n`;
      const channelList = Array.isArray(channels) ? channels : channels.split(',').map(c => c.trim());
      for (const channel of channelList) {
        yaml += `      - ${channel}\n`;
      }
    }

    res.json({ yaml });
  } catch (error) {
    console.error(`[API] Error in /agents/yaml: ${error.message}`);
    res.status(500).json({
      error: error.message,
      code: 'YAML_GENERATION_ERROR'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    res.json({
      status: isHealthy ? 'ok' : 'gateway_unreachable',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/diagnostics
 * Deep diagnostic: shows GATEWAY_URL, connection state, last errors
 */
router.get('/diagnostics', async (req, res) => {
  try {
    const diag = await getDiagnostics();
    res.json(diag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/logs
 * Returns the gateway log buffer
 */
router.get('/logs', (req, res) => {
  const logs = getLogBuffer ? getLogBuffer() : [];
  res.json({ logs });
});

module.exports = router;
