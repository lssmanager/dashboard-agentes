import { type CSSProperties } from 'react';
import { Eye, Rocket, RefreshCw, X } from 'lucide-react';
import type { DeployPreview } from '../../../lib/types';

interface CorefilesDiffPreviewModalProps {
  open: boolean;
  preview: DeployPreview | null;
  busy?: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onApply: () => void;
}

export function CorefilesDiffPreviewModal({
  open,
  preview,
  busy = false,
  onClose,
  onRefresh,
  onApply,
}: CorefilesDiffPreviewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={iconWrapStyle}>
              <Eye size={16} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Core Files Diff Preview</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                Inspect generated file changes and deployment diagnostics before apply.
              </p>
            </div>
          </div>

          <button type="button" aria-label="Close diff modal" onClick={onClose} style={iconButtonStyle}>
            <X size={16} />
          </button>
        </div>

        <div style={actionRowStyle}>
          <button type="button" onClick={onRefresh} disabled={busy} style={secondaryButtonStyle(busy)}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button type="button" onClick={onApply} disabled={busy} style={primaryButtonStyle(busy)}>
            <Rocket size={14} />
            Apply Changes
          </button>
        </div>

        <div style={summaryGridStyle}>
          <SummaryCard label="Diagnostics" value={`${preview?.diagnostics.length ?? 0}`} />
          <SummaryCard label="Artifacts" value={`${preview?.artifacts.length ?? 0}`} />
          <SummaryCard label="Diff entries" value={`${preview?.diff.length ?? 0}`} />
        </div>

        {!preview ? (
          <section style={emptyStateStyle}>
            <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>No preview loaded</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Run Preview Diff to populate diagnostics, artifacts, and generated file changes.
            </p>
          </section>
        ) : (
          <div style={contentGridStyle}>
            <section style={panelStyle}>
              <h3 style={sectionTitleStyle}>Diagnostics</h3>
              {preview.diagnostics.length === 0 ? (
                <p style={emptyTextStyle}>No diagnostics reported.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {preview.diagnostics.map((item, index) => (
                    <div key={`${item}-${index}`} style={warningRowStyle}>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={panelStyle}>
              <h3 style={sectionTitleStyle}>Diff entries</h3>
              {preview.diff.length === 0 ? (
                <p style={emptyTextStyle}>No file changes generated.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {preview.diff.map((entry) => (
                    <div key={`${entry.path}-${entry.status}`} style={listRowStyle}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{entry.path}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {entry.status === 'unchanged' ? 'Current file already matches preview' : 'Generated from current studio state'}
                        </div>
                      </div>
                      <span style={statusChipStyle(entry.status)}>{entry.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section style={panelStyle}>
              <h3 style={sectionTitleStyle}>Artifacts</h3>
              {preview.artifacts.length === 0 ? (
                <p style={emptyTextStyle}>No generated artifacts.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {preview.artifacts.map((artifact) => (
                    <div key={artifact.id} style={artifactRowStyle}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{artifact.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{artifact.path}</div>
                      </div>
                      <span style={artifactTypeStyle}>{artifact.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
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
  width: 'min(1040px, 100%)',
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

const actionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 10,
  flexWrap: 'wrap',
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const contentGridStyle: CSSProperties = {
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
  minHeight: 220,
  placeContent: 'center',
};

const summaryCardStyle: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--shell-panel-border)',
  background: 'var(--bg-primary)',
  padding: 16,
  display: 'grid',
  gap: 8,
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

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--text-primary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
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

const artifactRowStyle: CSSProperties = {
  ...listRowStyle,
  alignItems: 'flex-start',
};

const warningRowStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--tone-warning-border)',
  background: 'var(--tone-warning-bg)',
  color: 'var(--tone-warning-text)',
  padding: '10px 12px',
  fontSize: 12,
  lineHeight: 1.5,
};

const artifactTypeStyle: CSSProperties = {
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

const emptyTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--text-muted)',
};

function secondaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--shell-chip-border)',
    background: 'var(--shell-chip-bg)',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

function statusChipStyle(status: DeployPreview['diff'][number]['status']): CSSProperties {
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