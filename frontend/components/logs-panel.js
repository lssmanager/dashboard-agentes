class LogsPanelComponent {
  constructor() {
    this.container = document.getElementById('logsPanel');
    this.autoScroll = true;
  }

  async fetchLogs() {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      return data.logs || [];
    } catch { return []; }
  }

  async fetchDiagnostics() {
    try {
      const res = await fetch('/api/diagnostics');
      return await res.json();
    } catch { return null; }
  }

  async render() {
    if (!this.container) return;
    
    const [logs, diag] = await Promise.all([this.fetchLogs(), this.fetchDiagnostics()]);
    
    const diagHtml = diag ? `
      <div class="logs-diagnostics">
        <h3>Gateway Diagnostics</h3>
        <div class="diag-grid">
          <div class="diag-item">
            <span class="diag-label">Gateway URL</span>
            <span class="diag-value">${diag.config?.GATEWAY_URL || 'N/A'}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">API Key</span>
            <span class="diag-value">${diag.config?.GATEWAY_API_KEY_SET ? `Set (${diag.config.GATEWAY_API_KEY_LENGTH} chars)` : '❌ NOT SET'}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Protocol</span>
            <span class="diag-value">v${diag.config?.PROTOCOL_VERSION || '?'}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">DNS</span>
            <span class="diag-value">${diag.network?.dns?.address || diag.network?.dns?.error || 'N/A'}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">HTTP Health</span>
            <span class="diag-value">${diag.network?.httpHealthCheck?.status === 200 ? '✅ ' + diag.network.httpHealthCheck.body : '❌ ' + JSON.stringify(diag.network?.httpHealthCheck)}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">WS State</span>
            <span class="diag-value">${diag.connection?.wsReadyStateLabel || 'N/A'}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Handshake</span>
            <span class="diag-value">${diag.connection?.handshakeComplete ? '✅ Complete' : '❌ Incomplete'}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Connect Attempts</span>
            <span class="diag-value">${diag.connection?.connectionAttempts || 0}</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Circuit Breaker</span>
            <span class="diag-value">${diag.circuitBreaker?.isOpen ? '🔴 OPEN' : '🟢 Closed'} (failures: ${diag.circuitBreaker?.failureCount || 0})</span>
          </div>
          <div class="diag-item">
            <span class="diag-label">Last Error</span>
            <span class="diag-value diag-error">${diag.errors?.lastError || 'None'}</span>
          </div>
          ${diag.connection?.lastConnectResponse ? `
          <div class="diag-item diag-full">
            <span class="diag-label">Last Connect Response</span>
            <pre class="diag-pre">${JSON.stringify(diag.connection.lastConnectResponse, null, 2)}</pre>
          </div>` : ''}
        </div>
      </div>
    ` : '';

    const logsHtml = logs.length > 0 ? logs.map(log => {
      const levelClass = log.level === 'error' ? 'log-error' : log.level === 'warn' ? 'log-warn' : 'log-info';
      const time = log.time ? new Date(log.time).toLocaleTimeString() : '';
      const dataStr = log.data ? ' ' + JSON.stringify(log.data) : '';
      return `<div class="log-entry ${levelClass}"><span class="log-time">${time}</span> <span class="log-level">[${log.level}]</span> <span class="log-msg">${log.msg}${dataStr}</span></div>`;
    }).join('') : '<div class="log-entry log-info">No logs yet. Waiting for gateway connection attempts...</div>';

    this.container.innerHTML = `
      ${diagHtml}
      <div class="logs-container">
        <div class="logs-header">
          <h3>Gateway Logs</h3>
          <button class="btn-refresh-logs" onclick="window.logsPanel.render()">🔄 Refresh</button>
        </div>
        <div class="logs-output">${logsHtml}</div>
      </div>
    `;
  }
}

window.LogsPanelComponent = LogsPanelComponent;
