/**
 * Activity Feed Component
 */

class ActivityFeedComponent {
  constructor() {
    this.container = document.getElementById('activityFeed');
  }

  formatTime(timestamp) {
    if (!timestamp) return 'unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  render(sessions, agentColors) {
    if (!this.container) return;

    if (!sessions || sessions.length === 0) {
      this.container.innerHTML = '<p class="empty-state">No recent activity</p>';
      return;
    }

    const uniqueSessions = new Map();
    for (const session of sessions) {
      const key = `${session.agent}-${session.type || 'default'}`;
      if (!uniqueSessions.has(key)) {
        uniqueSessions.set(key, session);
      }
    }

    const html = `
      <div class="activity-list">
        ${Array.from(uniqueSessions.values()).slice(0, 10).map(session => `
          <div class="activity-item">
            <div class="activity-time">${this.formatTime(session.timestamp)}</div>
            <div class="activity-agent" style="border-left: 4px solid ${agentColors[session.agent] || 'var(--color-primary)'}">
              <strong>${session.agent}</strong><br>
              <code>${session.id || 'N/A'}</code>
            </div>
            <div class="activity-model">${session.model || 'unknown'}</div>
            <div class="activity-type">
              <span class="badge badge-${session.type || 'default'}">${session.type || 'default'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.container.innerHTML = html;
  }
}

window.ActivityFeedComponent = ActivityFeedComponent;
