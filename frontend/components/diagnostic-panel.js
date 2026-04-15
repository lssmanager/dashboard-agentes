/**
 * Diagnostic Panel Component
 * Displays connection status and data loading diagnostics
 */

class DiagnosticPanel {
  constructor() {
    this.element = null;
    this.isVisible = false;
  }

  /**
   * Create or update the diagnostic panel
   */
  render(diagnostics) {
    const statusMsg = diagnostics.getStatusMessage();
    const debugInfo = diagnostics.getDebugInfo();

    // Create or clear container
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.id = 'diagnosticPanel';
      this.element.className = 'diagnostic-panel';
      document.body.appendChild(this.element);
    }

    const severityClass = `diagnostic-${statusMsg.severity}`;
    const detailsHtml = this._formatDebugInfo(debugInfo);

    this.element.innerHTML = `
      <div class="diagnostic-content ${severityClass}">
        <div class="diagnostic-header">
          <h3 class="diagnostic-title">${statusMsg.title}</h3>
          <button class="diagnostic-close" aria-label="Close diagnostics">×</button>
        </div>

        <div class="diagnostic-message">
          <p>${statusMsg.message}</p>
        </div>

        <div class="diagnostic-details">
          <details>
            <summary>📋 Diagnostic Details</summary>
            <pre class="diagnostic-debug">${detailsHtml}</pre>
            <button class="btn-copy-debug" data-copy-text="${btoa(JSON.stringify(debugInfo, null, 2))}">
              Copy Debug Info
            </button>
          </details>
        </div>

        <div class="diagnostic-actions">
          ${statusMsg.status === 'BACKEND_DOWN' ?
            '<button class="btn-reload">🔄 Reload Page</button>' :
            '<button class="btn-diagnose">🔍 Run Diagnostics Again</button>'
          }
        </div>
      </div>
    `;

    // Setup event listeners
    this._setupEventListeners();
    this.isVisible = true;
    this.element.style.display = 'block';
  }

  /**
   * Show the diagnostic panel
   */
  show() {
    if (this.element) {
      this.element.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide the diagnostic panel
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    const closeBtn = this.element.querySelector('.diagnostic-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const reloadBtn = this.element.querySelector('.btn-reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => location.reload());
    }

    const diagnoseBtn = this.element.querySelector('.btn-diagnose');
    if (diagnoseBtn) {
      diagnoseBtn.addEventListener('click', async () => {
        diagnoseBtn.disabled = true;
        diagnoseBtn.textContent = '⏳ Running...';
        await window.diagnosticService.runDiagnostics();
        this.render(window.diagnosticService);
      });
    }

    const copyBtn = this.element.querySelector('.btn-copy-debug');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const encodedText = copyBtn.dataset.copyText;
        const debugText = atob(encodedText);
        navigator.clipboard.writeText(debugText).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => {
            copyBtn.textContent = originalText;
          }, 2000);
        });
      });
    }
  }

  /**
   * Format debug info for display
   */
  _formatDebugInfo(debugInfo) {
    const info = {
      'Status': debugInfo.dataAvailable ? 'READY' : 'DIAGNOSTIC_RUNNING',
      'Backend': debugInfo.backendReachable ? '✅ OK' : '❌ FAIL',
      'Gateway': debugInfo.gatewayReachable ? '✅ OK' : '⚠️ OFFLINE',
      'Data Loading': debugInfo.dataLoading ? '✅ OK' : '❌ FAIL',
      'Workspaces': `${debugInfo.workspacesFound} found`,
      'Agents': `${debugInfo.agentsFound} found`,
      'Gateway URL': debugInfo.gatewayUrl || 'unknown',
      'Backend URL': debugInfo.backendUrl,
      'Attempts': debugInfo.attempts,
      'Last Error': debugInfo.lastError || 'none',
      'Timestamp': debugInfo.timestamp?.toISOString() || 'never',
      'Page URL': debugInfo.url,
      'User Agent': debugInfo.userAgent
    };

    return Object.entries(info)
      .map(([key, value]) => `${key.padEnd(20)}: ${value}`)
      .join('\n');
  }
}

// Export as global
window.diagnosticPanel = new DiagnosticPanel();
