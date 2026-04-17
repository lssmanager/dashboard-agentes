import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { applyDeploy, getDeployPreview } from '../../../lib/api';
import { useStudioState } from '../../../lib/StudioStateContext';
import { AgentSpec, DeployPreview } from '../../../lib/types';
import { StudioCanvas } from '../components/StudioCanvas';
import { StudioInspector } from '../components/StudioInspector';
import { StudioSidebar } from '../components/StudioSidebar';
import { StudioToolbar } from '../components/StudioToolbar';

export default function StudioPage() {
  const { state, refresh } = useStudioState();
  const [preview, setPreview] = useState<DeployPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(state.agents[0]?.id ?? null);

  const selectedAgent = state.agents.find((a) => a.id === selectedAgentId) || state.agents[0];

  async function load() {
    setBusy(true);
    try {
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function previewDiff() {
    setPreview(await getDeployPreview());
  }

  async function deploy() {
    setBusy(true);
    try {
      await applyDeploy({ applyRuntime: true });
      await refresh();
      setPreview(await getDeployPreview());
    } finally {
      setBusy(false);
    }
  }

  const workspaceId = state.workspace?.id ?? 'workspace-missing';

  if (state.agents.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center max-w-md">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Agents</h3>
          <p className="text-sm text-slate-600 mb-6">
            Create your first agent in the workspace to start editing.
          </p>
          <a
            href="/agents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Go to Agents
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <StudioToolbar onRefresh={load} onPreview={previewDiff} onApply={deploy} isBusy={busy} />

      {/* Agent Selector */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Current Agent:</span>
            <select
              value={selectedAgentId || ''}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {state.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.id})
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              {selectedAgent?.description}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[250px_1fr_360px] gap-4 p-4">
        <StudioSidebar
          workspaceName={state.workspace?.name}
          agentsCount={state.agents.length}
          flowsCount={state.flows.length}
          skillsCount={state.skills.length}
        />
        {selectedAgent ? (
          <StudioCanvas
            workspaceId={workspaceId}
            agents={[selectedAgent]}
            flows={state.flows}
            skills={state.skills}
            onAgentSaved={(agent: AgentSpec) => {
              void refresh();
            }}
          />
        ) : (
          <div className="rounded border border-slate-200 bg-white p-4 flex items-center justify-center">
            <p className="text-slate-600">Select an agent to edit</p>
          </div>
        )}
        <StudioInspector
          diagnostics={state.compile.diagnostics}
          deployPreview={preview}
          sessions={state.runtime.sessions.payload ?? []}
        />
      </div>
    </div>
  );
}
