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
const REFRESH_INTERVAL = 30000; // 30 seconds
let refreshInterval = null;

/**
 * Check if all required components are available
 */
function validateComponentsReady() {
  const requiredComponents = ['ConnectionBadge', 'TabsComponent', 'SummaryCardsComponent', 'TopologyVisualizer', 'AgentsTableComponent', 'ChannelsPanelComponent', 'CostsPanelComponent', 'ActivityFeedComponent'];
  const missing = requiredComponents.filter(name => typeof window[name] === 'undefined');

  if (missing.length > 0) {
    console.warn('[APP] Missing components:', missing);
    return false;
  }

  return true;
}

/**
 * Wait for components to be loaded (with timeout)
 */
async function waitForComponents(maxWaitMs = 5000) {
  const startTime = Date.now();
  while (!validateComponentsReady()) {
    if (Date.now() - startTime > maxWaitMs) {
      console.error('[APP] Timeout waiting for components to load');
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('[APP] All components loaded successfully');
  return true;
}

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
  try {
    if (!window.gatewayClient) {
      console.error('[APP] ❌ Gateway client not available');
      return false;
    }

    console.log('[APP] 📡 Fetching dashboard state from backend API...');
    const result = await gatewayClient.getDashboardState();

    if (result.error) {
      console.error('[APP] ❌ API Error:', result.error);
      return false;
    }

    const newState = result.data;
    console.log('[APP] ✅ Received data from backend');
    console.log(`[APP]   - Connected: ${newState.connected}`);
    console.log(`[APP]   - Workspaces: ${newState.workspaces?.length || 0}`);
    console.log(`[APP]   - Total Agents: ${Object.values(newState.agents || {}).flat().length}`);

    // Update connection status
    appState.connected = newState.connected;
    appState.lastFetch = newState.lastFetch;

    // Handle workspace updates
    if (JSON.stringify(appState.workspaces) !== JSON.stringify(newState.workspaces)) {
      console.log('[APP] 🔄 Workspace data changed, updating...');
      appState.workspaces = newState.workspaces;
      appState.agents = newState.agents;

      // Auto-select first workspace if none selected
      if (!appState.activeWorkspace && appState.workspaces.length > 0) {
        appState.activeWorkspace = appState.workspaces[0].id;
        console.log(`[APP] 📌 Auto-selected workspace: ${appState.activeWorkspace}`);
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
    console.log(`[APP]   - Sessions: ${appState.sessions.length}`);

    // Update costs
    appState.costs = newState.costs;

    // Load topology
    const topologyResult = await gatewayClient.getTopology();
    if (topologyResult.data) {
      appState.topology = topologyResult.data.workspaces || {};
      console.log(`[APP]   - Topology loaded`);
    }

    return true;
  } catch (error) {
    console.error('[APP] 💥 Error fetching dashboard state:', error);
    return false;
  }
}

/**
 * Render all components for current workspace
 */
function renderCurrentWorkspace() {
  try {
    const ws = appState.workspaces.find(w => w.id === appState.activeWorkspace);

    if (!ws) {
      const contentEl = document.getElementById('workspaceContent');
      if (contentEl) {
        contentEl.innerHTML = '<p class="error">Workspace not found</p>';
      }
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

    // Render logs panel
    if (window.logsPanel) {
      window.logsPanel.render();
    }
  } catch (error) {
    console.error('[APP] Error rendering workspace:', error);
  }
}

/**
 * Update connection badge
 */
function updateConnectionStatus() {
  try {
    if (components.connection) {
      components.connection.setStatus(appState.connected);
    }
  } catch (error) {
    console.error('[APP] Error updating connection status:', error);
  }
}

/**
 * Update last refresh time and status
 */
function updateLastRefreshTime() {
  try {
    const el = document.getElementById('lastRefresh');
    if (el) {
      const now = new Date(appState.lastFetch);
      const timeStr = now.toLocaleTimeString();

      if (appState.connected) {
        el.textContent = `✅ Synced ${timeStr}`;
        el.classList.remove('loading');
      } else {
        el.textContent = `⏳ Loading...`;
        el.classList.add('loading');
      }
    }
  } catch (error) {
    console.error('[APP] Error updating refresh time:', error);
  }
}

/**
 * Main refresh cycle
 */
async function refresh() {
  console.log('[APP] Starting refresh cycle...');
  const startTime = Date.now();

  const success = await fetchDashboardState();

  if (success) {
    renderCurrentWorkspace();
    updateConnectionStatus();
    updateLastRefreshTime();
    console.log(`[APP] ✅ Refresh successful (${Date.now() - startTime}ms)`);
  } else {
    updateConnectionStatus();
    updateLastRefreshTime();
    console.warn(`[APP] ⚠️ Refresh failed, running diagnostics...`);

    // Run diagnostics on failure
    await window.diagnosticService.runDiagnostics();
    const statusMsg = window.diagnosticService.getStatusMessage();

    if (statusMsg.severity === 'critical') {
      console.error(`[APP] 🚨 CRITICAL: ${statusMsg.message}`);
      window.diagnosticPanel.render(window.diagnosticService);
    } else if (statusMsg.severity === 'warning') {
      console.warn(`[APP] ⚠️ WARNING: ${statusMsg.message}`);
    }
  }
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refresh(); // Immediate refresh
  refreshInterval = setInterval(() => {
    refresh();
  }, REFRESH_INTERVAL);
  console.log(`[APP] Auto-refresh started (interval: ${REFRESH_INTERVAL}ms)`);
}

/**
 * Stop auto-refresh timer
 */
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('[APP] Auto-refresh stopped');
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
  try {
    components.connection = new ConnectionBadge();
    components.tabs = new TabsComponent(setActiveWorkspace);
    components.summary = new SummaryCardsComponent();
    components.topology = new TopologyVisualizer();
    components.table = new AgentsTableComponent();
    components.channels = new ChannelsPanelComponent();
    components.costs = new CostsPanelComponent();
    components.activity = new ActivityFeedComponent();
    // Logs panel (optional, doesn't block init)
    if (window.LogsPanelComponent) {
      window.logsPanel = new LogsPanelComponent();
    }
    console.log('[APP] All components initialized');
  } catch (error) {
    console.error('[APP] Error initializing components:', error);
    throw error;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  try {
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
  } catch (error) {
    console.error('[APP] Error setting up event listeners:', error);
  }
}

/**
 * Initialize app
 */
async function initApp() {
  try {
    console.log('[APP] ═══════════════════════════════════════════════════');
    console.log('[APP] 🚀 Starting OpenClaw Dashboard...');
    console.log('[APP] ═══════════════════════════════════════════════════');
    console.log(`[APP] Page URL: ${window.location.href}`);
    console.log(`[APP] API Base: ${window.location.origin}`);

    // Wait for gateway client to be available
    if (!window.gatewayClient) {
      console.error('[APP] ❌ Gateway client not available - check gateway-client.js');
      return;
    }
    console.log('[APP] ✅ Gateway client initialized');

    // Wait for components to load
    console.log('[APP] ⏳ Waiting for components to load...');
    const componentsReady = await waitForComponents();
    if (!componentsReady) {
      console.error('[APP] ❌ Failed to load components, exiting');
      return;
    }
    console.log('[APP] ✅ All components loaded');

    // Initialize components
    console.log('[APP] 🔧 Initializing components...');
    initializeComponents();

    // Setup event listeners
    console.log('[APP] 📌 Setting up event listeners...');
    setupEventListeners();

    // Initial fetch and render
    console.log('[APP] 📥 Running initial data fetch...');
    await refresh();

    // Start auto-refresh
    console.log('[APP] 🔄 Starting auto-refresh...');
    startAutoRefresh();

    console.log('[APP] ═══════════════════════════════════════════════════');
    console.log('[APP] ✅ Dashboard initialized successfully!');
    console.log('[APP] ═══════════════════════════════════════════════════');
  } catch (error) {
    console.error('[APP] 💥 Fatal error during initialization:', error);
    console.error('[APP] Stack:', error.stack);

    // Show diagnostic panel on fatal error
    await window.diagnosticService?.runDiagnostics();
    window.diagnosticPanel?.render(window.diagnosticService);
  }
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
window.stopAutoRefresh = stopAutoRefresh;
window.startAutoRefresh = startAutoRefresh;

