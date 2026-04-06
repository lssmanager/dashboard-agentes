/**
 * Costs Panel Component
 */

class CostsPanelComponent {
  constructor() {
    this.container = document.getElementById('costsPanel');
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(value);
  }

  render(costs) {
    if (!this.container) return;

    if (!costs || !costs.spend) {
      this.container.innerHTML = '<p class="empty-state">No cost data available</p>';
      return;
    }

    const dailyData = costs.daily || [];

    const html = `
      <div class="costs-summary">
        <div class="cost-stat">
          <div class="stat-label">Total Spend</div>
          <div class="stat-value">${this.formatCurrency(costs.spend || 0)}</div>
        </div>
        <div class="cost-stat">
          <div class="stat-label">Total Tokens</div>
          <div class="stat-value">${this.formatNumber(costs.tokens || 0)}</div>
        </div>
        <div class="cost-stat">
          <div class="stat-label">Input Tokens</div>
          <div class="stat-value">${this.formatNumber(costs.input_tokens || 0)}</div>
        </div>
        <div class="cost-stat">
          <div class="stat-label">Output Tokens</div>
          <div class="stat-value">${this.formatNumber(costs.output_tokens || 0)}</div>
        </div>
      </div>

      ${dailyData.length > 0 ? `
        <div class="daily-chart">
          <h3>Daily Spend (7 days)</h3>
          <div class="chart-bars">
            ${dailyData.map((day, idx) => {
              const maxSpend = Math.max(...dailyData.map(d => d.spend || 0), 1);
              const height = ((day.spend || 0) / maxSpend) * 100;
              const date = new Date(day.date);
              return `
                <div class="bar-container">
                  <div class="bar" style="height: ${height}%;" title="${this.formatCurrency(day.spend || 0)}"></div>
                  <div class="bar-label">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;

    this.container.innerHTML = html;
  }
}
