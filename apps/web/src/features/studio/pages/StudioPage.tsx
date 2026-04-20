import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { applyCoreFiles, previewCoreFiles } from '../../../lib/api';
import { useStudioState } from '../../../lib/StudioStateContext';
import { usePreferences } from '../../../lib/usePreferences';
import { AgentSpec, DeployPreview } from '../../../lib/types';
import { StudioCanvas } from '../components/StudioCanvas';
import { ComponentLibrary } from '../components/ComponentLibrary';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { StudioToolbar } from '../components/StudioToolbar';
import { StudioTabBar, type StudioTab } from '../components/StudioTabBar';
import { EmptySection } from '../../../components/ui/EmptySection';
import { Toast } from '../../../components';
import { Cpu } from 'lucide-react';

export default function StudioPage() {
  const { state, refresh } = useStudioState();
  const { selectedAgentId, setSelectedAgentId } = usePreferences();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<DeployPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>('builder');

  const [agentId, setAgentId] = useState<string | null>(selectedAgentId || state.agents[0]?.id || null);

  useEffect(() => {
    if (agentId) setSelectedAgentId(agentId);
  }, [agentId, setSelectedAgentId]);

  const selectedAgent = state.agents.find((a) => a.id === agentId) || state.agents[0];

  async function load() {
    setBusy(true);
    try { await refresh(); } finally { setBusy(false); }
  }

  async function previewDiff() {
    try { setPreview(await previewCoreFiles()); }
    catch (err) { setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load preview' }); }
  }

  async function deploy() {
    setBusy(true);
    try {
      const result = await applyCoreFiles({ applyRuntime: true });
      if (!result.ok) {
        throw new Error((result.diagnostics ?? []).join(', ') || 'Core files apply failed');
      }
      await refresh();
      setPreview(await previewCoreFiles());
      setToast({ type: 'success', message: 'Deployment applied successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Deployment failed' });
    } finally { setBusy(false); }
  }

  const workspaceId = state.workspace?.id;

  if (!workspaceId) {
    return (
      <EmptySection
        icon={Cpu}
        title="No Workspace"
        description="Create a workspace first to use the Studio."
      />
    );
  }

  if (state.agents.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
        <EmptySection
          icon={Cpu}
          title="No Agents"
          description="Create your first agent in the workspace to start editing."
          ctaLabel="Go to Agents"
          onCta={() => navigate('/agents')}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top toolbar */}
      <StudioToolbar onRefresh={load} onPreview={previewDiff} onApply={deploy} isBusy={busy} />

      {/* Agent selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)',
        }}
      >
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-muted)' }}>
          Agent:
        </span>
        <select
          value={agentId || ''}
          onChange={(e) => setAgentId(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--input-border)',
            background: 'var(--input-bg)',
            color: 'var(--input-text)',
            fontSize: 'var(--text-sm)',
            outline: 'none',
          }}
        >
          {state.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        {selectedAgent?.description && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {selectedAgent.description}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <StudioTabBar active={activeTab} onChange={setActiveTab} />

      {/* 3-column body */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
          minHeight: 0,
        }}
      >
        {/* Left: Component Library */}
        <ComponentLibrary />

        {/* Center: Canvas */}
        <div style={{ position: 'relative', minHeight: 0, overflow: 'hidden' }}>
          {selectedAgent ? (
            <StudioCanvas
              workspaceId={workspaceId}
              agents={[selectedAgent]}
              flows={state.flows}
              skills={state.skills}
              onAgentSaved={(agent: AgentSpec) => { void refresh(); }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Select an agent to edit
            </div>
          )}
        </div>

        {/* Right: Properties Panel */}
        <PropertiesPanel
          diagnostics={state.compile.diagnostics}
          deployPreview={preview}
          sessions={state.runtime.sessions.payload ?? []}
        />
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
