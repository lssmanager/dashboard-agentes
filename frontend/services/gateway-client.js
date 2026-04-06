/**
 * Frontend Gateway Client
 * Thin wrapper around fetch() for backend API calls
 */

class GatewayClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || window.location.origin;
    this.timeout = 5000;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}/api${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data: await response.json(),
        status: response.status,
        error: null
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        data: null,
        status: 0,
        error: error.message
      };
    }
  }

  async getDashboardState() {
    return this.request('/dashboard/state');
  }

  async getTopology() {
    return this.request('/topology');
  }

  async postTopology(workspaceId, type, parentChildMap, description) {
    return this.request('/topology', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, type, parentChildMap, description })
    });
  }

  async generateYaml(agent) {
    return this.request('/agents/yaml', {
      method: 'POST',
      body: JSON.stringify(agent)
    });
  }

  async getHealth() {
    return this.request('/health');
  }
}

// Export as global
window.gatewayClient = new GatewayClient();
