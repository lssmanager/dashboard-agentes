import { CheckCircle, AlertTriangle } from 'lucide-react';
import { DeployPreview } from '../../../lib/types';

interface PropertiesPanelProps {
  diagnostics: string[];
  deployPreview: DeployPreview | null;
  sessions: unknown[];
}

type DiffStatus = 'added' | 'updated' | 'deleted' | 'unchanged';

const STATUS_STYLE: Record<DiffStatus, { color: string; bg: string; prefix: string }> = {
  added:     { color: 'var(--color-success)',  bg: 'rgba(34,197,94,0.08)',  prefix: '+' },
  updated:   { color: '#F59E0B',              bg: 'rgba(245,158,11,0.08)', prefix: '~' },
  deleted:   { color: 'var(--color-error)',    bg: 'rgba(239,68,68,0.08)',  prefix: '-' },
  unchanged: { color: 'var(--text-muted)',     bg: 'transparent',           prefix: '·' },
};

function SectionBlock({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-secondary)',
        background: 'var(--card-bg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-secondary)',
          background: 'var(--bg-secondary)',
        }}
      >
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ padding: '10px 14px' }}>{children}</div>
    </div>
  );
}

export function PropertiesPanel({ diagnostics, deployPreview, sessions }: PropertiesPanelProps) {
  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-primary)' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          Properties
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 12 }}>
        {/* Diagnostics */}
        <SectionBlock
          title="Compiler Diagnostics"
          icon={
            diagnostics.length === 0
              ? <CheckCircle size={13} style={{ color: 'var(--color-success)' }} />
              : <AlertTriangle size={13} style={{ color: '#F59E0B' }} />
          }
        >
          {diagnostics.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--color-success)' }}>No issues found</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {diagnostics.map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 12,
                    color: '#F59E0B',
                    background: 'rgba(245,158,11,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        {/* Deploy Diff */}
        <SectionBlock title="Deploy Diff">
          {!deployPreview ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Run Preview Diff to see changes
            </p>
          ) : deployPreview.diff.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nothing to deploy</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {deployPreview.diff.map((item) => {
                const s = STATUS_STYLE[item.status as DiffStatus] ?? STATUS_STYLE.unchanged;
                return (
                  <div
                    key={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: s.color,
                      background: s.bg,
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                    }}
                  >
                    <span style={{ fontWeight: 700, width: 12, textAlign: 'center', flexShrink: 0 }}>{s.prefix}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionBlock>

        {/* Sessions */}
        <SectionBlock title="Runtime Sessions">
          {sessions.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No active sessions</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {sessions.map((session, i) => {
                const s = session as Record<string, unknown>;
                const sid = typeof s?.id === 'string' ? s.id.substring(0, 12) : `sess-${i}`;
                const aid = typeof s?.agentId === 'string' ? s.agentId : 'Unknown';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {sid}
                    </code>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {aid}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionBlock>
      </div>
    </div>
  );
}
