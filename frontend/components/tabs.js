/**
 * Tabs Component
 */

class TabsComponent {
  constructor(onTabSelect) {
    this.onTabSelect = onTabSelect;
    this.element = document.getElementById('tabsList');
  }

  render(workspaces, activeWorkspace) {
    if (!this.element) return;

    this.element.innerHTML = '';

    workspaces.forEach(ws => {
      const tab = document.createElement('button');
      tab.className = 'tab';
      if (ws.id === activeWorkspace) {
        tab.classList.add('active');
      }
      tab.textContent = ws.name || ws.id;
      tab.addEventListener('click', () => {
        this.onTabSelect(ws.id);
        this.render(workspaces, ws.id);
      });
      this.element.appendChild(tab);
    });
  }

  openModal() {
    const modal = document.getElementById('workspaceModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
}
