/**
 * Summary Cards Component
 */

class SummaryCardsComponent {
  constructor() {
    this.element = document.getElementById('summaryCards');
  }

  calculateMetrics(workspace, agents) {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const activeAgents = agents.filter(a => {
      const lastActive = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      return lastActive > oneHourAgo && a.status === 'ACTIVE';
    }).length;

    const subagents = agents.filter(a => a.role === 'subagent').length;

    // Count parent-child relationships
    const parentChildMap = workspace.parentChildMap || {};
    let hierarchicalCount = 0;
    for (const [parent, children] of Object.entries(parentChildMap)) {
      hierarchicalCount += (children || []).length;
    }

    // Count non-hierarchical (peer) connections
    const peerConnections = Math.max(0, agents.length - hierarchicalCount - 1);

    // Count external channels
    const channels = new Set();
    agents.forEach(a => {
      (a.channels || []).forEach(ch => channels.add(ch));
    });

    return {
      activeAgents,
      subagents,
      hierarchicalCount,
      peerConnections,
      externalFlows: channels.size
    };
  }

  render(workspace, agents) {
    if (!this.element) return;

    const metrics = this.calculateMetrics(workspace, agents);

    const cards = [
      { label: 'Active Agents', value: metrics.activeAgents },
      { label: 'Total Subagents', value: metrics.subagents },
      { label: 'Hierarchical Links', value: metrics.hierarchicalCount },
      { label: 'Peer Connections', value: metrics.peerConnections },
      { label: 'External Channels', value: metrics.externalFlows }
    ];

    this.element.innerHTML = cards.map(card => `
      <div class="summary-card">
        <div class="card-label">${card.label}</div>
        <div class="card-value">${card.value}</div>
      </div>
    `).join('');
  }
}
