import { ArrowLeft, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  ConsoleEmpty,
  ConsolePanel,
  ObservabilityShell,
  consoleToolButtonStyle,
} from '../components/ObservabilityShell';

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
        <button type="button" style={consoleToolButtonStyle()} onClick={() => navigate('/observability')}>
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
