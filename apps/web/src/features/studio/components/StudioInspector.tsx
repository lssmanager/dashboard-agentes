import { CheckCircle, AlertTriangle } from 'lucide-react';
import { DeployPreview } from '../../../lib/types';

interface StudioInspectorProps {
  diagnostics: string[];
  deployPreview: DeployPreview | null;
  sessions: unknown[];
}

type DiffStatus = 'added' | 'updated' | 'deleted' | 'unchanged';

const diffStyles: Record<DiffStatus, { text: string; bg: string; prefix: string }> = {
  added:     { text: 'text-emerald-700', bg: 'bg-emerald-50',  prefix: '+' },
  updated:   { text: 'text-amber-700',   bg: 'bg-amber-50',    prefix: '~' },
  deleted:   { text: 'text-red-700',     bg: 'bg-red-50',      prefix: '-' },
  unchanged: { text: 'text-slate-500',   bg: '',               prefix: '·' },
};

export function StudioInspector({ diagnostics, deployPreview, sessions }: StudioInspectorProps) {
  return (
    <aside className="space-y-4">
      {/* Compiler Diagnostics */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
          {diagnostics.length === 0
            ? <CheckCircle size={13} className="text-emerald-500" />
            : <AlertTriangle size={13} className="text-amber-500" />
          }
          <h3 className="text-xs font-semibold text-slate-900">Compiler Diagnostics</h3>
        </div>
        <div className="px-3 py-2">
          {diagnostics.length === 0 ? (
            <p className="text-xs text-emerald-600">No issues found</p>
          ) : (
            <ul className="space-y-1">
              {diagnostics.map((item) => (
                <li key={item} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Deploy Diff */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
          <h3 className="text-xs font-semibold text-slate-900">Deploy Diff</h3>
        </div>
        <div className="px-3 py-2">
          {!deployPreview ? (
            <p className="text-xs text-slate-400 italic">Run Preview Diff to see changes</p>
          ) : deployPreview.diff.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing to deploy</p>
          ) : (
            <ul className="space-y-1">
              {deployPreview.diff.map((item) => {
                const style = diffStyles[item.status as DiffStatus] ?? diffStyles.unchanged;
                return (
                  <li
                    key={item.path}
                    className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 font-mono ${style.bg} ${style.text}`}
                  >
                    <span className="font-bold w-3 text-center flex-shrink-0">{style.prefix}</span>
                    <span className="truncate">{item.path}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Runtime Sessions */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
          <h3 className="text-xs font-semibold text-slate-900">Runtime Sessions</h3>
        </div>
        <div className="px-3 py-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No active sessions</p>
          ) : (
            <ul className="space-y-1.5">
              {sessions.map((session, index) => {
                const s = session as Record<string, unknown>;
                const sessionId = typeof s?.id === 'string' ? s.id.substring(0, 12) : `sess-${index}`;
                const agentId = typeof s?.agentId === 'string' ? s.agentId : 'Unknown agent';
                return (
                  <li key={index} className="rounded bg-slate-50 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-slate-700">{sessionId}</code>
                      <span className="text-xs text-slate-500 truncate">{agentId}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
