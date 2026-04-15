/**
 * Diagnostic Service
 * Identifies connection issues and data loading problems
 */

class DiagnosticService {
  constructor() {
    this.diagnostics = {
      backendReachable: null,
      gatewayReachable: null,
      dataLoading: null,
      dataAvailable: null,
      agentsFound: 0,
      workspacesFound: 0,
      lastError: null,
      attempts: 0,
      timestamp: null,
      gatewayUrl: null,
      backendUrl: null
    };
  }

  /**
   * Run full diagnostic check
   */
  async runDiagnostics() {
    this.diagnostics.attempts++;
    this.diagnostics.timestamp = new Date();

    const backendUrl = window.location.origin;
    this.diagnostics.backendUrl = backendUrl;

    // 1. Check if backend is reachable
    console.log('[DIAG] Testing backend connectivity...');
    this.diagnostics.backendReachable = await this._testBackendHealth(backendUrl);

    if (!this.diagnostics.backendReachable) {
      this.diagnostics.lastError = 'Backend server is not responding';
      return this.diagnostics;
    }

    // 2. Check if we can fetch dashboard state
    console.log('[DIAG] Testing data endpoint...');
    const stateResult = await this._testDashboardState();

    if (!stateResult.data) {
      this.diagnostics.dataLoading = false;
      this.diagnostics.lastError = stateResult.error || 'Failed to fetch dashboard state';
      return this.diagnostics;
    }

    this.diagnostics.dataLoading = true;

    // 3. Extract gateway info from response
    const gatewayUrl = stateResult.data.gatewayUrl || stateResult.data.diagnostics?.config?.GATEWAY_URL || 'unknown';
    this.diagnostics.gatewayUrl = gatewayUrl;
    this.diagnostics.gatewayReachable = !!stateResult.data.connected;
    this.diagnostics.offline = !!stateResult.data.offline;

    // 4. Check data availability
    const workspaces = stateResult.data.workspaces || [];
    const agents = Object.values(stateResult.data.agents || {}).flat();

    this.diagnostics.workspacesFound = workspaces.length;
    this.diagnostics.agentsFound = agents.length;
    this.diagnostics.dataAvailable = workspaces.length > 0 && agents.length > 0;

    if (!this.diagnostics.dataAvailable) {
      if (stateResult.data.connected) {
        this.diagnostics.lastError = 'Connected to Gateway but no workspaces or agents found. Check openclaw.yaml configuration.';
      } else if (stateResult.data.offline) {
        this.diagnostics.lastError = 'Gateway is unreachable. Dashboard backend is up, but live data is unavailable.';
      } else {
        this.diagnostics.lastError = 'Gateway is unreachable. Check GATEWAY_URL and network connectivity.';
      }
    }

    return this.diagnostics;
  }

  /**
   * Test if backend /health is responding
   */
  async _testBackendHealth(baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/api/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('[DIAG] Backend health check failed:', error.message);
      return false;
    }
  }

  /**
   * Test if dashboard state endpoint is working
   */
  async _testDashboardState() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${window.location.origin}/api/dashboard/state`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          data: null,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error.name === 'AbortError' ? 'Request timeout (5s)' : error.message
      };
    }
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage() {
    if (!this.diagnostics.backendReachable) {
      return {
        status: 'BACKEND_DOWN',
        title: '❌ Backend Server Unreachable',
        message: 'The Express server is not responding. Check if it\'s running on port 3000.',
        severity: 'critical'
      };
    }

    if (!this.diagnostics.dataLoading) {
      return {
        status: 'DATA_ENDPOINT_FAIL',
        title: '❌ Cannot Fetch Dashboard Data',
        message: `Error: ${this.diagnostics.lastError}`,
        severity: 'critical'
      };
    }

    if (!this.diagnostics.gatewayReachable) {
      return {
        status: 'GATEWAY_UNREACHABLE',
        title: '⚠️ Gateway Offline',
        message: `OpenClaw Gateway (${this.diagnostics.gatewayUrl}) is not responding. Using cached data if available.`,
        severity: this.diagnostics.dataAvailable ? 'warning' : 'critical'
      };
    }

    if (!this.diagnostics.dataAvailable) {
      return {
        status: 'NO_DATA',
        title: '⚠️ No Data Available',
        message: 'Connected to Gateway but found 0 workspaces and 0 agents. Check your openclaw.yaml configuration.',
        severity: 'warning'
      };
    }

    return {
      status: 'OK',
      title: '✅ All Systems Operational',
      message: `Found ${this.diagnostics.workspacesFound} workspace(s) and ${this.diagnostics.agentsFound} agent(s)`,
      severity: 'success'
    };
  }

  /**
   * Get detailed debug info
   */
  getDebugInfo() {
    return {
      ...this.diagnostics,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: this.diagnostics.timestamp?.toISOString() || null
    };
  }
}

// Export as global
window.diagnosticService = new DiagnosticService();
