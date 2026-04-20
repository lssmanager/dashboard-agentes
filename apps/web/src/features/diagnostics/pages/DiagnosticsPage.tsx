import { Activity, MessageSquare } from 'lucide-react';
import { useStudioState } from '../../../lib/StudioStateContext';
import { DiagnosticsPanel } from '../../../components/ui/DiagnosticsPanel';
import { GatewayLogsPanel } from '../components/GatewayLogsPanel';
import { ConsoleEmpty, ConsolePanel, ObservabilityShell } from '../../operations/components/ObservabilityShell';

export default function DiagnosticsPage() {
  const { state } = useStudioState();
  const runtimeOk = state.runtime?.health?.ok ?? false;
  const compileDiagnostics = state.compile?.diagnostics ?? [];
  const sessions = state.runtime?.sessions?.payload ?? [];
  const runtimeDiagnostics = state.runtime?.diagnostics ?? {};

  return (
    <ObservabilityShell
      title="Diagnostics"
      description="Runtime health, compile diagnostics, and gateway payload inspection in one diagnostics console."
      icon={Activity}
      runtimeOk={runtimeOk}
      kpis={[
        {
          label: 'Runtime',
          value: runtimeOk ? 'Online' : 'Offline',
          helper: 'Gateway heartbeat',
          tone: runtimeOk ? 'success' : 'warning',
        },
        {
          label: 'Compile',
          value: compileDiagnostics.length === 0 ? 'Clean' : `${compileDiagnostics.length} issues`,
          helper: 'Latest static checks',
          tone: compileDiagnostics.length === 0 ? 'success' : 'warning',
        },
        {
          label: 'Workspace',
          value: state.workspace ? state.workspace.name : 'None',
          helper: 'Current target',
          tone: state.workspace ? 'default' : 'warning',
        },
        {
          label: 'Sessions',
          value: sessions.length,
          helper: 'Observed now',
        },
      ]}
    >
      <ConsolePanel title="Compile Diagnostics" description="Latest compile and validation results">
        <DiagnosticsPanel diagnostics={compileDiagnostics} title="Compile Diagnostics" />
      </ConsolePanel>

      <ConsolePanel title="Active Sessions" description="Current runtime session slice">
        {sessions.length === 0 ? (
          <ConsoleEmpty
            title="No active sessions"
            description="Sessions appear when agents receive or emit runtime traffic."
          />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {sessions.slice(0, 12).map((session, index) => {
              const current = session as Record<string, unknown>;
              const id = typeof current.id === 'string' ? current.id.slice(0, 16) : `session-${index + 1}`;
              const status = typeof current.status === 'string' ? current.status : 'unknown';
              const channel = typeof current.channel === 'string' ? current.channel : 'n/a';
              const agentId = typeof current.agentId === 'string' ? current.agentId : 'n/a';

              return (
                <div
                  key={`${id}-${index}`}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-secondary)',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 100px 120px 1fr',
                    gap: 8,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{id}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{status}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{channel}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {agentId}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </ConsolePanel>

      {Object.keys(runtimeDiagnostics).length > 0 && (
        <ConsolePanel title="Gateway Diagnostics Payload" description="Raw runtime diagnostics details">
          <GatewayLogsPanel diagnostics={runtimeDiagnostics} />
        </ConsolePanel>
      )}

      {compileDiagnostics.length > 0 && (
        <ConsolePanel title="Diagnostic Alerts" description="Actionable warnings from latest compile run">
          <div style={{ display: 'grid', gap: 8 }}>
            {compileDiagnostics.map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--tone-warning-border)',
                  background: 'var(--tone-warning-bg)',
                  color: 'var(--tone-warning-text)',
                  padding: '10px 12px',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MessageSquare size={13} />
                {item}
              </div>
            ))}
          </div>
        </ConsolePanel>
      )}
    </ObservabilityShell>
  );
}
