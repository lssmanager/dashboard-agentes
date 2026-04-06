/**
 * OpenClaw Dashboard Main App
 * State management and core refresh logic
 */

// Global state
let appState = {
  workspaces: [],
  agents: {},
  sessions: [],
  costs: null,
  connected: false,
  lastFetch: 0,
  activeWorkspace: null,
  topology: {},
  agentColors: {}
};

// Component instances
let components = {
  tabs: null,
  summary: null,
  topology: null,
  table: null,
  channels: null,
  costs: null,
  activity: null,
  connection: null
};

// Config
const REFRESH_INTERVAL = parseInt(process.env.REFRESH_INTERVAL || '30000');
let refreshInterval = null;

/**
 * Generate consistent colors for agents
 */
function generateAgentColors() {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316'  // orange
  ];

  const colorMap = {};
  appState.workspaces.forEach(ws => {
    ws.agents.forEach((agent, index) => {
      if (!colorMap[agent.id]) {
        colorMap[agent.id] = colors[index % colors.length];
      }
    });
  });

  appState.agentColors = colorMap;
}

/**
 * Fetch dashboard state from backend
 */
async function fetchDashboardState() {
  const result = await gatewayClient.getDashboardState();

  if (result.error) {
    console.error('[APP] Failed to fetch dashboard state:', result.error);
    return false;
  }

  const newState = result.data;

  // Update connection status
  appState.connected = newState.connected;
  appState.lastFetch = newState.lastFetch;

  // Handle workspace updates
  if (JSON.stringify(appState.workspaces) !== JSON.stringify(newState.workspaces)) {
    appState.workspaces = newState.workspaces;
    appState.agents = newState.agents;

    // Auto-select first workspace if none selected
    if (!appState.activeWorkspace && appState.workspaces.length > 0) {
      appState.activeWorkspace = appState.workspaces[0].id;
    }

    // Generate agent colors
    generateAgentColors();

    // Update tabs
    if (components.tabs) {
      components.tabs.render(appState.workspaces, appState.activeWorkspace);
    }
  }

  // Update sessions
  appState.sessions = newState.sessions || [];

  // Update costs
  appState.costs = newState.costs;

  // Load topology
  const topologyResult = await gatewayClient.getTopology();
  if (topologyResult.data) {
    appState.topology = topologyResult.data.workspaces || {};
  }

  return true;
}

/**
 * Render all components for current workspace
 */
function renderCurrentWorkspace() {
  const ws = appState.workspaces.find(w => w.id === appState.activeWorkspace);

  if (!ws) {
    document.getElementById('workspaceContent').innerHTML = '<p class="error">Workspace not found</p>';
    return;
  }

  // Render summary cards
  if (components.summary) {
    components.summary.render(ws, appState.agents[ws.id] || []);
  }

  // Render topology
  if (components.topology) {
    const topology = appState.topology[ws.id] || {};
    components.topology.render(ws, topology, appState.agentColors);
  }

  // Render agents table
  if (components.table) {
    components.table.render(ws.agents || []);
  }

  // Render channels
  if (components.channels) {
    components.channels.render(ws.agents || []);
  }

  // Render costs
  if (components.costs) {
    components.costs.render(appState.costs);
  }

  // Render activity feed
  if (components.activity) {
    components.activity.render(appState.sessions, appState.agentColors);
  }
}

/**
 * Update connection badge
 */
function updateConnectionStatus() {
  if (components.connection) {
    components.connection.setStatus(appState.connected);
  }
}

/**
 * Update last refresh time
 */
function updateLastRefreshTime() {
  const el = document.getElementById('lastRefresh');
  if (el) {
    const now = new Date(appState.lastFetch);
    el.textContent = `Last refreshed: ${now.toLocaleTimeString()}`;
  }
}

/**
 * Main refresh cycle
 */
async function refresh() {
  console.log('[APP] Refreshing dashboard state...');

  const success = await fetchDashboardState();

  if (success) {
    renderCurrentWorkspace();
    updateConnectionStatus();
    updateLastRefreshTime();
  } else {
    updateConnectionStatus();
  }
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refresh(); // Immediate refresh
  refreshInterval = setInterval(() => {
    if (appState.connected) {
      refresh();
    }
  }, REFRESH_INTERVAL);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Set active workspace
 */
function setActiveWorkspace(wsId) {
  appState.activeWorkspace = wsId;
  renderCurrentWorkspace();
}

/**
 * Initialize components
 */
function initializeComponents() {
  components.connection = new ConnectionBadge();
  components.tabs = new TabsComponent(setActiveWorkspace);
  components.summary = new SummaryCardsComponent();
  components.topology = new TopologyVisualizer();
  components.table = new AgentsTableComponent();
  components.channels = new ChannelsPanelComponent();
  components.costs = new CostsPanelComponent();
  components.activity = new ActivityFeedComponent();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Manual refresh button
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    console.log('[APP] Manual refresh');
    refresh();
  });

  // Add workspace button
  document.getElementById('addWorkspaceBtn')?.addEventListener('click', () => {
    if (components.tabs && components.tabs.openModal) {
      components.tabs.openModal();
    }
  });

  // Topology layout selector
  document.getElementById('layoutSelector')?.addEventListener('change', (e) => {
    if (components.topology) {
      components.topology.setLayout(e.target.value);
    }
  });
}

/**
 * Initialize app
 */
async function initApp() {
  console.log('[APP] Initializing OpenClaw Dashboard...');

  // Initialize components
  initializeComponents();

  // Setup event listeners
  setupEventListeners();

  // Initial fetch and render
  await refresh();

  // Start auto-refresh
  startAutoRefresh();

  console.log('[APP] Dashboard initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Expose to window for debugging
window.appState = appState;
window.refresh = refresh;
window.setActiveWorkspace = setActiveWorkspace;
