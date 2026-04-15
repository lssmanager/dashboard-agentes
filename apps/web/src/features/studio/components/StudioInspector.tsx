import { DeployPreview } from '../../../lib/types';
import { SessionsPanel } from '../../sessions/components/SessionsPanel';

interface StudioInspectorProps {
  diagnostics: string[];
  deployPreview: DeployPreview | null;
  sessions: unknown[];
}

export function StudioInspector({ diagnostics, deployPreview, sessions }: StudioInspectorProps) {
  return (
    <aside className="space-y-4">
      <div className="rounded border border-slate-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-semibold">Compiler Diagnostics</h3>
        <ul className="space-y-1 text-xs text-slate-700">
          {diagnostics.length === 0 ? <li>No diagnostics</li> : diagnostics.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div className="rounded border border-slate-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-semibold">Deploy Diff</h3>
        <ul className="space-y-1 text-xs text-slate-700">
          {(deployPreview?.diff ?? []).map((item) => (
            <li key={item.path}>
              {item.status}: {item.path}
            </li>
          ))}
          {!deployPreview && <li>No preview generated.</li>}
        </ul>
      </div>

      <SessionsPanel sessions={sessions} />
    </aside>
  );
}
