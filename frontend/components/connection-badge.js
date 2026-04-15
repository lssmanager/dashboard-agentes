/**
 * Connection Badge Component
 */

class ConnectionBadge {
  constructor() {
    this.element = document.getElementById('connectionBadge');
  }

  setStatus(connected) {
    if (!this.element) return;

    if (connected) {
      this.element.classList.remove('offline');
      this.element.classList.add('connected');
      this.element.querySelector('.badge-text').textContent = 'Connected';
    } else {
      this.element.classList.remove('connected');
      this.element.classList.add('offline');
      this.element.querySelector('.badge-text').textContent = 'Offline';
    }
  }
}

window.ConnectionBadge = ConnectionBadge;
