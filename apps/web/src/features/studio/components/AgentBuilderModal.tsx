import { type CSSProperties } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { AgentSpec, BuilderAgentFunctionOutput } from '../../../lib/types';

interface AgentBuilderModalProps {
  open: boolean;
  agent: AgentSpec | null;
  output: BuilderAgentFunctionOutput | null;
  busy?: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

export function AgentBuilderModal({ open, agent, output, busy = false, onClose, onGenerate }: AgentBuilderModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={iconWrapStyle}>
                <Sparkles size={16} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Builder Agent Function</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  What the selected agent does, what it consumes, and which collaborators it needs.
                </p>
              </div>
            </div>
          </div>

          <button type="button" aria-label="Close builder modal" onClick={onClose} style={iconButtonStyle}>
            <X size={16} />
          </button>
        </div>

        <div style={bodyStyle}>
          <section style={panelStyle}>
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={eyebrowRowStyle}>
                <span style={eyebrowStyle}>Selected agent</span>
                <span style={chipStyle}>{agent?.model ?? 'No model'}</span>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{agent?.name ?? 'No agent selected'}</h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {agent?.description || 'Choose an agent to generate a Builder Agent Function summary.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onGenerate} disabled={!agent || busy} style={primaryButtonStyle(!agent || busy)}>
                {busy ? 'Generating...' : 'Generate Builder Output'}
              </button>
            </div>
          </section>

          {!output ? (
            <section style={emptyStateStyle}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>No builder output yet</h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Run generation to inspect suggested responsibilities, inputs, outputs, skills, tools, and core-file diffs for the active agent.
              </p>
            </section>
          ) : (
            <section style={{ display: 'grid', gap: 14 }}>
              <section style={panelStyle}>
                <div style={sectionTitleRowStyle}>
                  <h3 style={sectionTitleStyle}>What it does</h3>
                  <span style={chipStyle}>{output.entityLevel}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{output.whatItDoes}</p>
              </section>

              <div style={gridStyle}>
                <MetadataCard title="Inputs" items={output.inputs} emptyLabel="No inputs generated" />
                <MetadataCard title="Outputs" items={output.outputs} emptyLabel="No outputs generated" />
                <MetadataCard title="Skills" items={output.skills} emptyLabel="No skills mapped" />
                <MetadataCard title="Tools" items={output.tools} emptyLabel="No tools mapped" />
              </div>

              <section style={panelStyle}>
                <h3 style={sectionTitleStyle}>Collaborators</h3>
                <TagList items={output.collaborators} emptyLabel="No collaborators mapped" />
              </section>

              <section style={panelStyle}>
                <h3 style={sectionTitleStyle}>Proposed core-file diffs</h3>
                {output.proposedCoreFileDiffs.length === 0 ? (
                  <p style={emptyTextStyle}>No diff targets proposed.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {output.proposedCoreFileDiffs.map((entry) => (
                      <div key={`${entry.path}-${entry.status}`} style={listRowStyle}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{entry.path}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {entry.status === 'unchanged' ? 'No update required' : 'Ready for preview/apply'}
                          </div>
                        </div>
                        <span style={statusChipStyle(entry.status)}>{entry.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataCard({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <section style={panelStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      <TagList items={items} emptyLabel={emptyLabel} />
    </section>
  );
}

function TagList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p style={emptyTextStyle}>{emptyLabel}</p>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item) => (
        <span key={item} style={tagStyle}>
          {item}
        </span>
      ))}
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(15, 23, 42, 0.62)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
};

const modalStyle: CSSProperties = {
  width: 'min(980px, 100%)',
  maxHeight: 'min(88vh, 1000px)',
  overflow: 'auto',
  borderRadius: 'var(--radius-xl)',
  border: '1px solid var(--shell-panel-border)',
  background: 'var(--shell-panel-bg)',
  boxShadow: '0 28px 80px rgba(15, 23, 42, 0.3)',
  display: 'grid',
  gap: 16,
  padding: 20,
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
};

const iconWrapStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--color-primary-soft)',
  color: 'var(--color-primary)',
  border: '1px solid color-mix(in srgb, var(--color-primary) 32%, transparent)',
};

const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--shell-chip-border)',
  background: 'var(--shell-chip-bg)',
  color: 'var(--text-muted)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
};

const bodyStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const panelStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--shell-panel-border)',
  background: 'var(--bg-primary)',
  padding: 16,
};

const emptyStateStyle: CSSProperties = {
  ...panelStyle,
  minHeight: 180,
  placeContent: 'center',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
};

const sectionTitleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const eyebrowRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  flexWrap: 'wrap',
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
};

const chipStyle: CSSProperties = {
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--shell-chip-border)',
  background: 'var(--shell-chip-bg)',
  color: 'var(--text-muted)',
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const tagStyle: CSSProperties = {
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--shell-chip-border)',
  background: 'var(--shell-chip-bg)',
  color: 'var(--text-primary)',
  padding: '6px 10px',
  fontSize: 12,
  lineHeight: 1.2,
};

const listRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--shell-panel-border)',
  background: 'var(--bg-secondary)',
  padding: '10px 12px',
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--text-muted)',
};

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

function statusChipStyle(status: BuilderAgentFunctionOutput['proposedCoreFileDiffs'][number]['status']): CSSProperties {
  const tone = status === 'added'
    ? ['var(--tone-success-bg)', 'var(--tone-success-border)', 'var(--tone-success-text)']
    : status === 'updated'
      ? ['var(--tone-warning-bg)', 'var(--tone-warning-border)', 'var(--tone-warning-text)']
      : status === 'deleted'
        ? ['color-mix(in srgb, var(--color-error) 12%, transparent)', 'color-mix(in srgb, var(--color-error) 35%, transparent)', 'var(--color-error)']
        : ['var(--shell-chip-bg)', 'var(--shell-chip-border)', 'var(--text-muted)'];

  return {
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${tone[1]}`,
    background: tone[0],
    color: tone[2],
    padding: '5px 10px',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };
}