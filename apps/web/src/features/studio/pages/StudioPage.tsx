import { useEffect, useState } from 'react';

import { applyDeploy, getDeployPreview, getStudioState } from '../../../lib/api';
import { AgentSpec, DeployPreview, StudioStateResponse } from '../../../lib/types';
import { StudioCanvas } from '../components/StudioCanvas';
import { StudioInspector } from '../components/StudioInspector';
import { StudioSidebar } from '../components/StudioSidebar';
import { StudioToolbar } from '../components/StudioToolbar';

export default function StudioPage() {
  const [state, setState] = useState<StudioStateResponse | null>(null);
  const [preview, setPreview] = useState<DeployPreview | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      setState(await getStudioState());
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function previewDiff() {
    setPreview(await getDeployPreview());
  }

  async function deploy() {
    setBusy(true);
    try {
      await applyDeploy({ applyRuntime: true });
      await load();
      setPreview(await getDeployPreview());
    } finally {
      setBusy(false);
    }
  }

  const workspaceId = state?.workspace?.id ?? 'workspace-missing';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <StudioToolbar onRefresh={load} onPreview={previewDiff} onApply={deploy} isBusy={busy} />
      <div className="grid grid-cols-[250px_1fr_360px] gap-4 p-4">
        <StudioSidebar
          workspaceName={state?.workspace?.name}
          agentsCount={state?.agents.length ?? 0}
          flowsCount={state?.flows.length ?? 0}
          skillsCount={state?.skills.length ?? 0}
        />
        <StudioCanvas
          workspaceId={workspaceId}
          agents={state?.agents ?? []}
          flows={state?.flows ?? []}
          skills={state?.skills ?? []}
          onAgentSaved={(agent: AgentSpec) => {
            setState((current) =>
              current
                ? {
                    ...current,
                    agents: [
                      agent,
                      ...current.agents.filter((item) => item.id !== agent.id),
                    ],
                  }
                : current,
            );
          }}
        />
        <StudioInspector
          diagnostics={state?.compile.diagnostics ?? []}
          deployPreview={preview}
          sessions={state?.runtime.sessions.payload ?? []}
        />
      </div>
    </div>
  );
}
