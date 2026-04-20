import type { AgentSpec, BuilderAgentFunctionOutput } from '../../../lib/types';
import {
  RuntimeStatusBadge,
  StudioEmptyState,
  StudioInspectorCard,
  StudioMetricRow,
  StudioSectionCard,
} from '../../../components/ui';

interface AgentBuilderModalProps {
  open: boolean;
  agent: AgentSpec | null;
  output: BuilderAgentFunctionOutput | null;
  busy: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

export function AgentBuilderModal({
  open,
  agent,
  output,
  busy,
  onClose,
  onGenerate,
}: AgentBuilderModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 14, 0.62)',
        backdropFilter: 'blur(4px)',
        zIndex: 80,
        padding: 20,
      }}
    >
      <div
        style={{
          height: '100%',
          maxWidth: 1240,
          margin: '0 auto',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--card-border)',
          background: 'var(--card-bg)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            borderBottom: '1px solid var(--border-primary)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'grid', gap: 3 }}>
            <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Builder Agent Function</strong>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Operational profile editor for agent and subagent behavior.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RuntimeStatusBadge
              status={agent?.isEnabled !== false ? 'online' : 'degraded'}
              label={agent?.isEnabled !== false ? 'active profile' : 'disabled profile'}
            />
            <button type="button" onClick={onClose} style={secondaryButton()}>
              Close
            </button>
          </div>
        </header>

        <div
          style={{
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 0.9fr) minmax(0, 1.1fr)',
            gap: 0,
          }}
        >
          <div style={{ borderRight: '1px solid var(--border-primary)', padding: 16, overflowY: 'auto' }}>
            <StudioSectionCard title="Agent Configuration" description="Current setup and builder controls">
              {agent ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <StudioMetricRow label="Name" value={agent.name} />
                  <StudioMetricRow label="Role" value={agent.role || 'Not defined'} />
                  <StudioMetricRow label="Model" value={agent.model || 'Default'} />
                  <StudioMetricRow label="Skills" value={`${agent.skillIds?.length ?? 0}`} />
                  <StudioMetricRow label="Tools" value={`${agent.toolIds?.length ?? 0}`} />
                </div>
              ) : (
                <StudioEmptyState title="No agent selected" description="Select an agent to generate profile output." />
              )}

              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={onGenerate} disabled={!agent || busy} style={primaryButton()}>
                  {busy ? 'Generating...' : 'Generate with AI'}
                </button>
                <button type="button" onClick={onClose} style={secondaryButton()}>
                  Cancel
                </button>
              </div>
            </StudioSectionCard>
          </div>

          <div style={{ padding: 16, overflowY: 'auto' }}>
            {!output ? (
              <StudioSectionCard title="Builder Output" description="Awaiting generated operational profile">
                <StudioEmptyState
                  title="No generated profile yet"
                  description="Run Generate with AI to create tasks, IO, collaborators, and proposed diffs."
                />
              </StudioSectionCard>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <StudioInspectorCard title="What It Does">
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55 }}>{output.whatItDoes}</p>
                </StudioInspectorCard>

                <StudioInspectorCard title="Inputs / Outputs">
                  <StudioMetricRow label="Inputs" value={`${output.inputs.length}`} />
                  <StudioMetricRow label="Outputs" value={`${output.outputs.length}`} />
                  <StudioMetricRow label="Skills" value={`${output.skills.length}`} />
                  <StudioMetricRow label="Tools" value={`${output.tools.length}`} />
                </StudioInspectorCard>

                <StudioSectionCard title="Suggested Collaborators" description="Delegation and handoff relationships">
                  {output.collaborators.length === 0 ? (
                    <StudioEmptyState title="No collaborators suggested" description="Profile can run without explicit collaborators." />
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {output.collaborators.map((collaborator) => (
                        <div
                          key={collaborator}
                          style={{
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-secondary)',
                            padding: '10px 12px',
                            fontSize: 12,
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {collaborator}
                        </div>
                      ))}
                    </div>
                  )}
                </StudioSectionCard>

                <StudioSectionCard title="Proposed Core File Diffs" description="Diff targets inferred from profile generation">
                  {output.proposedCoreFileDiffs.length === 0 ? (
                    <StudioEmptyState title="No diffs proposed" description="Generated profile does not require core-file updates." />
                  ) : (
                    <div style={{ display: 'grid', gap: 8 }}>
                      {output.proposedCoreFileDiffs.map((entry) => (
                        <StudioMetricRow
                          key={`${entry.path}-${entry.status}`}
                          label={entry.path}
                          value={entry.status}
                          hint={entry.status === 'unchanged' ? 'No action needed' : 'Review in Diff / Apply'}
                        />
                      ))}
                    </div>
                  )}
                </StudioSectionCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function primaryButton() {
  return {
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as const;
}

function secondaryButton() {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as const;
}
