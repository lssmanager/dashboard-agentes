/**
 * Channels Panel Component
 */

class ChannelsPanelComponent {
  constructor() {
    this.container = document.getElementById('channelsPanel');
  }

  render(agents) {
    if (!this.container) return;

    // Collect all unique channels across all agents
    const channelMap = new Map();

    agents.forEach(agent => {
      (agent.channels || []).forEach(channel => {
        if (!channelMap.has(channel)) {
          channelMap.set(channel, []);
        }
        channelMap.get(channel).push(agent.name || agent.id);
      });
    });

    if (channelMap.size === 0) {
      this.container.innerHTML = '<p class="empty-state">No channels configured</p>';
      return;
    }

    const html = `
      <div class="channels-list">
        ${Array.from(channelMap.entries()).map(([channel, agentNames]) => `
          <div class="channel-item">
            <div class="channel-header">
              <span class="channel-icon">📡</span>
              <span class="channel-name">${channel}</span>
              <span class="channel-count">${agentNames.length} agent(s)</span>
            </div>
            <div class="channel-agents">
              ${agentNames.map(name => `<span class="agent-badge">${name}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.container.innerHTML = html;
  }
}

window.ChannelsPanelComponent = ChannelsPanelComponent;
