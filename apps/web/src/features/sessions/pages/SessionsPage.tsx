import { MessageSquare } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useStudioState } from '../../../lib/StudioStateContext';
import { ConsoleEmpty, ConsolePanel, ObservabilityShell } from '../../operations/components/ObservabilityShell';

export default function SessionsPage() {
  const { state } = useStudioState();
  const sessions = state.runtime?.sessions?.payload ?? [];
  const runtimeOk = state.runtime?.health?.ok ?? false;

  const hasStatusData = sessions.some((session: any) => session?.status !== undefined);
  const activeCount = hasStatusData
    ? sessions.filter((session: any) => session?.status === 'active').length
    : sessions.length;
  const avgMessages = sessions.length > 0
    ? Math.round(
        sessions.reduce((sum: number, session: any) => sum + (session?.messages?.length || 0), 0) / sessions.length,
      )
    : 0;

  return (
    <ObservabilityShell
      title="Sessions"
      description="Runtime sessions view with channel, status, and per-session message activity."
      icon={MessageSquare}
      runtimeOk={runtimeOk}
    >
      <section className="studio-responsive-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <MetricTile label="Total Sessions" value={`${sessions.length}`} />
        <MetricTile label={hasStatusData ? 'Active Now' : 'Sessions'} value={`${activeCount}`} />
        <MetricTile label="Avg Messages / Session" value={sessions.length > 0 ? `${avgMessages}` : '0'} />
      </section>

      <ConsolePanel title="Session Stream" description="Current runtime session table">
        {sessions.length === 0 ? (
          <ConsoleEmpty
            title="No sessions yet"
            description="Sessions appear when agents start processing messages."
          />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={rowStyle(true)}>
              <span>Session</span>
              <span>Status</span>
              <span>Channel</span>
              <span>Agent</span>
              <span>Messages</span>
            </div>
            {sessions.map((session: any, index: number) => {
              const id = typeof session?.id === 'string' ? session.id.slice(0, 20) : `sess-${index + 1}`;
              const status = typeof session?.status === 'string' ? session.status : 'unknown';
              const channel = typeof session?.channel === 'string' ? session.channel : 'n/a';
              const agent = typeof session?.agentId === 'string' ? session.agentId : 'n/a';
              const messages = Array.isArray(session?.messages) ? session.messages.length : 0;

              return (
                <div key={`${id}-${index}`} style={rowStyle(false)}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{id}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{status}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{channel}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{agent}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{messages}</span>
                </div>
              );
            })}
          </div>
        )}
      </ConsolePanel>
    </ObservabilityShell>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        padding: 14,
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <strong style={{ display: 'block', marginTop: 6, fontSize: 'var(--text-2xl)' }}>{value}</strong>
    </div>
  );
}

function rowStyle(header: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) 120px 120px minmax(0, 1fr) 90px',
    gap: 8,
    alignItems: 'center',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: header ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
    padding: '10px 12px',
    fontSize: header ? 11 : 12,
    fontWeight: header ? 700 : 500,
    textTransform: header ? 'uppercase' : 'none',
    letterSpacing: header ? '0.06em' : 'normal',
    color: header ? 'var(--text-muted)' : 'var(--text-primary)',
  };
}
