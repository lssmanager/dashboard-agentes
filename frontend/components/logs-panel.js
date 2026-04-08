/**
 * Logs Panel Component — Live Gateway Logs + Scope/Connection Banner
 * Auto-refreshes every 5 seconds, shows granted vs rejected scopes,
 * connection status, and streaming backend logs.
 */
class LogsPanelComponent {
  constructor() {
    this.container = document.getElementById('logsPanel');
    this.autoRefreshInterval = null;
    this.isStreaming = false;
    this.lastLogCount = 0;
  }

  startStreaming() {
    if (this.isStreaming) return;
    this.isStreaming = true;
    this.render();
    this.autoRefreshInterval = setInterval(() => this.render(), 5000);
  }

  stopStreaming() {
    this.isStreaming = false;
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  async fetchDiagnostics() {
    try {
      const res = await fetch('/api/diagnostics');
      return await res.json();
    } catch { return null; }
  }

  async fetchLogs() {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      return data.logs || [];
    } catch { return []; }
  }

  renderConnectionBanner(diag) {
    if (!diag) return '<div class="scope-banner banner-unknown">⏳ Loading diagnostics...</div>';

    const conn = diag.connection || {};
    const config = diag.config || {};
    const net = diag.network || {};
    const cb = diag.circuitBreaker || {};

    // Connection status
    const wsState = conn.wsReadyStateLabel || 'unknown';
    const handshake = conn.handshakeComplete;
    const isConnected = wsState === 'OPEN' && handshake;
    const statusClass = isConnected ? 'banner-ok' : 'banner-error';
    const statusIcon = isConnected ? '🟢' : '🔴';
    const statusText = isConnected ? 'Connected' : handshake === false && wsState === 'OPEN' ? 'WS Open, Handshake Failed' : wsState === 'no_socket' ? 'Not Connected' : `WS: ${wsState}`;

    // DNS + HTTP
    const dnsOk = net.dns?.address ? true : false;
    const httpOk = net.httpHealthCheck?.status === 200;

    // Scopes
    const requested = conn.requestedScopes || [];
    const granted = conn.grantedScopes || [];
    const grantedSet = new Set(granted);
    const rejected = requested.filter(s => !grantedSet.has(s));

    // Last error from connect response
    const connectErr = conn.lastConnectResponse?.ok === false ? conn.lastConnectResponse.error : null;

    // Circuit breaker
    const cbOpen = cb.isOpen;

    return `
      <div class="scope-banner ${statusClass}">
        <div class="banner-row banner-status-row">
          <span class="banner-status">${statusIcon} <strong>${statusText}</strong></span>
          <span class="banner-meta">${config.GATEWAY_URL || 'N/A'} · Protocol v${config.PROTOCOL_VERSION || '?'} · Key: ${config.GATEWAY_API_KEY_SET ? config.GATEWAY_API_KEY_LENGTH + ' chars' : '❌ MISSING'}</span>
        </div>

        <div class="banner-row banner-checks">
          <span class="${dnsOk ? 'check-ok' : 'check-fail'}">DNS ${dnsOk ? '✅ ' + net.dns.address : '❌ ' + (net.dns?.error || 'fail')}</span>
          <span class="${httpOk ? 'check-ok' : 'check-fail'}">HTTP ${httpOk ? '✅ live' : '❌ ' + (net.httpHealthCheck?.error || net.httpHealthCheck?.status || 'fail')}</span>
          <span class="${handshake ? 'check-ok' : 'check-fail'}">Handshake ${handshake ? '✅' : '❌'}</span>
          <span class="${!cbOpen ? 'check-ok' : 'check-fail'}">Circuit ${cbOpen ? '🔴 OPEN (' + cb.failureCount + ' failures)' : '🟢 Closed'}</span>
          <span>Attempts: ${conn.connectionAttempts || 0}</span>
        </div>

        ${granted.length > 0 || rejected.length > 0 ? `
        <div class="banner-row banner-scopes">
          <span class="scope-label">Scopes:</span>
          ${requested.map(s => {
            const isGranted = grantedSet.has(s);
            return `<span class="scope-chip ${isGranted ? 'scope-granted' : 'scope-rejected'}">${isGranted ? '✅' : '❌'} ${s.replace('operator.', '')}</span>`;
          }).join('')}
          ${granted.length === 0 && requested.length > 0 ? '<span class="scope-note">⚠️ No scopes confirmed yet — Gateway may not return granted scopes in connect response</span>' : ''}
        </div>` : ''}

        ${connectErr ? `
        <div class="banner-row banner-error-detail">
          <span class="banner-error-code">${connectErr.code || 'ERROR'}</span>
          <span class="banner-error-msg">${connectErr.message || JSON.stringify(connectErr)}</span>
        </div>` : ''}

        ${conn.connectPayload && !connectErr ? `
        <div class="banner-row banner-session">
          <span>Session: ${conn.sessionId || 'N/A'}</span>
        </div>` : ''}
      </div>
    `;
  }

  renderLogs(logs) {
    if (!logs || logs.length === 0) {
      return '<div class="log-entry log-info"><span class="log-msg">No logs yet. Waiting for gateway activity...</span></div>';
    }

    return logs.map(log => {
      const levelClass = log.level === 'error' ? 'log-error' : log.level === 'warn' ? 'log-warn' : 'log-info';
      const time = log.time ? new Date(log.time).toLocaleTimeString() : '';
      let dataStr = '';
      if (log.data) {
        if (log.data.error) {
          dataStr = ` → ${log.data.error.code || ''}: ${log.data.error.message || JSON.stringify(log.data.error)}`;
        } else if (log.data.ok === true) {
          dataStr = ' → ✅ ok';
        } else {
          dataStr = ' → ' + JSON.stringify(log.data);
        }
      }
      return `<div class="log-entry ${levelClass}"><span class="log-time">${time}</span><span class="log-level">[${log.level}]</span> <span class="log-msg">${log.msg}${dataStr}</span></div>`;
    }).join('');
  }

  async render() {
    if (!this.container) return;

    const [diag, logs] = await Promise.all([this.fetchDiagnostics(), this.fetchLogs()]);

    const bannerHtml = this.renderConnectionBanner(diag);
    const logsHtml = this.renderLogs(logs);
    const isLive = this.isStreaming;

    this.container.innerHTML = `
      ${bannerHtml}
      <div class="logs-container">
        <div class="logs-header">
          <h3>Gateway Logs (${logs.length} entries)</h3>
          <div class="logs-controls">
            <button class="btn-log-action ${isLive ? 'btn-active' : ''}" id="toggleStreamBtn">
              ${isLive ? '⏸ Pause' : '▶ Live'}
            </button>
            <button class="btn-log-action" id="refreshLogsBtn">🔄 Refresh</button>
            <button class="btn-log-action" id="copyLogsBtn">📋 Copy</button>
          </div>
        </div>
        <div class="logs-output" id="logsOutput">${logsHtml}</div>
      </div>
    `;

    // Auto-scroll to bottom if new logs appeared
    const output = document.getElementById('logsOutput');
    if (output && logs.length > this.lastLogCount) {
      output.scrollTop = output.scrollHeight;
    }
    this.lastLogCount = logs.length;

    // Bind buttons
    document.getElementById('toggleStreamBtn')?.addEventListener('click', () => {
      if (this.isStreaming) this.stopStreaming(); else this.startStreaming();
      this.render();
    });
    document.getElementById('refreshLogsBtn')?.addEventListener('click', () => this.render());
    document.getElementById('copyLogsBtn')?.addEventListener('click', () => {
      const text = logs.map(l => `${l.time} [${l.level}] ${l.msg}${l.data ? ' ' + JSON.stringify(l.data) : ''}`).join('\n');
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyLogsBtn');
        if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📋 Copy', 2000); }
      });
    });
  }
}

window.LogsPanelComponent = LogsPanelComponent;
