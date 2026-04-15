/**
 * Modals Component
 * Handles workspace and agent creation modals
 */

class ModalsComponent {
  constructor() {
    this.workspaceModal = document.getElementById('workspaceModal');
    this.agentModal = document.getElementById('agentModal');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Workspace modal close buttons
    const wsCloseBtn = this.workspaceModal?.querySelector('.modal-close');
    const wsCancelBtn = this.workspaceModal?.querySelector('.modal-cancel');
    wsCloseBtn?.addEventListener('click', () => this.closeWorkspaceModal());
    wsCancelBtn?.addEventListener('click', () => this.closeWorkspaceModal());

    // Save workspace button
    document.getElementById('saveWorkspaceBtn')?.addEventListener('click', () => this.saveWorkspace());

    // Agent modal close buttons
    const agentCloseBtn = this.agentModal?.querySelector('.modal-close');
    const agentCancelBtn = this.agentModal?.querySelector('.modal-cancel');
    agentCloseBtn?.addEventListener('click', () => this.closeAgentModal());
    agentCancelBtn?.addEventListener('click', () => this.closeAgentModal());

    // Copy YAML button
    document.getElementById('copyYamlBtn')?.addEventListener('click', () => this.copyYaml());

    // Agent form inputs to update YAML preview
    ['agentName', 'agentId', 'agentModel', 'agentProvider', 'agentRole', 'agentParent', 'agentChannels']
      .forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => this.updateYamlPreview());
      });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
      if (e.target === this.workspaceModal) {
        this.closeWorkspaceModal();
      }
      if (e.target === this.agentModal) {
        this.closeAgentModal();
      }
    });
  }

  openWorkspaceModal() {
    if (this.workspaceModal) {
      this.workspaceModal.style.display = 'flex';
      document.getElementById('wsName')?.focus();
    }
  }

  closeWorkspaceModal() {
    if (this.workspaceModal) {
      this.workspaceModal.style.display = 'none';
      document.getElementById('wsName').value = '';
      document.getElementById('wsType').value = 'orchestrator';
    }
  }

  async saveWorkspace() {
    const name = document.getElementById('wsName').value.trim();
    const type = document.getElementById('wsType').value;

    if (!name) {
      alert('Please enter a workspace name');
      return;
    }

    const wsId = name.toLowerCase().replace(/\s+/g, '_');

    const result = await gatewayClient.postTopology(wsId, type, {}, name);

    if (result.error) {
      alert(`Failed to create workspace: ${result.error}`);
      return;
    }

    alert('Workspace created! Refresh to see it in the list.');
    this.closeWorkspaceModal();
    window.refresh?.();
  }

  openAgentModal() {
    if (this.agentModal) {
      this.agentModal.style.display = 'flex';
      document.getElementById('agentName')?.focus();
    }
  }

  closeAgentModal() {
    if (this.agentModal) {
      this.agentModal.style.display = 'none';
      document.getElementById('agentName').value = '';
      document.getElementById('agentId').value = '';
      document.getElementById('agentModel').value = '';
      document.getElementById('agentProvider').value = 'openai';
      document.getElementById('agentRole').value = 'subagent';
      document.getElementById('agentParent').value = '';
      document.getElementById('agentChannels').value = '';
      document.getElementById('yamlPreview').textContent = '';
    }
  }

  updateYamlPreview() {
    const name = document.getElementById('agentName').value;
    const id = document.getElementById('agentId').value;
    const model = document.getElementById('agentModel').value;
    const provider = document.getElementById('agentProvider').value;
    const role = document.getElementById('agentRole').value;
    const parent = document.getElementById('agentParent').value;
    const channels = document.getElementById('agentChannels').value;

    let yaml = '';

    if (id) {
      yaml = `agents:\n  ${id}:\n`;
      if (name) yaml += `    name: "${name}"\n`;
      if (model) yaml += `    model: "${model}"\n`;
      yaml += `    provider: ${provider}\n`;
      yaml += `    role: ${role}\n`;
      if (parent) yaml += `    parent: "${parent}"\n`;

      if (channels) {
        yaml += `    channels:\n`;
        channels.split(',').map(c => c.trim()).filter(c => c).forEach(channel => {
          yaml += `      - ${channel}\n`;
        });
      }
    }

    const preview = document.getElementById('yamlPreview');
    if (preview) {
      preview.textContent = yaml || '(fill in agent details above)';
    }
  }

  copyYaml() {
    const yaml = document.getElementById('yamlPreview').textContent;

    if (!yaml || yaml === '(fill in agent details above)') {
      alert('Please fill in agent details first');
      return;
    }

    navigator.clipboard.writeText(yaml).then(() => {
      alert('YAML copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  }
}

// Initialize modals when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.modals = new ModalsComponent();
  });
} else {
  window.modals = new ModalsComponent();
}
