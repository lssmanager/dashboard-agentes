/**
 * Agents Table Component
 */

class AgentsTableComponent {
  constructor() {
    this.container = document.getElementById('agentsTable');
  }

  getStatusColor(agent) {
    const now = Date.now();
    const lastActive = agent.lastActive ? new Date(agent.lastActive).getTime() : 0;
    const diffMs = now - lastActive;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (agent.status !== 'ACTIVE') return 'gray';
    if (diffHours < 1) return 'green';
    if (diffHours < 24) return 'yellow';
    return 'gray';
  }

  formatTime(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  render(agents) {
    if (!this.container) return;

    if (agents.length === 0) {
      this.container.innerHTML = '<p class="empty-state">No agents available</p>';
      return;
    }

    // Sort by most recently active
    const sorted = [...agents].sort((a, b) => {
      const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
      return bTime - aTime;
    });

    const table = document.createElement('table');
    table.className = 'agents-table-view';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name/ID</th>
          <th>Status</th>
          <th>Last Active</th>
          <th>Model</th>
          <th>Provider</th>
          <th>Channels</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(agent => `
          <tr class="status-${this.getStatusColor(agent)}">
            <td><strong>${agent.name}</strong><br><code>${agent.id}</code></td>
            <td>
              <span class="status-badge status-${agent.status.toLowerCase()}">
                ${agent.status}
              </span>
            </td>
            <td>${this.formatTime(agent.lastActive)}</td>
            <td><code>${agent.model}</code></td>
            <td>${agent.provider || 'unknown'}</td>
            <td>${(agent.channels || []).join(', ') || 'none'}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(table);
  }
}
