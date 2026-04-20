import type { CSSProperties } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { ConsoleEmpty, ConsolePanel, ObservabilityShell } from '../components/ObservabilityShell';

export default function ObservabilityRunPage() {
  const navigate = useNavigate();
  const { runId } = useParams<{ runId: string }>();
  const label = runId ? runId.slice(0, 8) : 'unknown';

  return (
    <ObservabilityShell
      title={`Run ${label}`}
      description="Placeholder drilldown surface reserved for canonical observability run details."
      icon={Eye}
      runtimeOk
      actions={
        <button type="button" style={buttonStyle()} onClick={() => navigate('/observability')}>
          <ArrowLeft size={14} />
          Back to Observability
        </button>
      }
    >
      <ConsolePanel title="Run Detail" description="Run-scoped observability is wired as a placeholder for now.">
        <ConsoleEmpty
          title="Run detail placeholder"
          description={runId ? `Route received runId ${runId}. Detailed trace inspection will land here.` : 'No runId was provided in the route.'}
          actionLabel="Open Observability"
          onAction={() => navigate('/observability')}
        />
      </ConsolePanel>
    </ObservabilityShell>
  );
}

function buttonStyle(): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  };
}
