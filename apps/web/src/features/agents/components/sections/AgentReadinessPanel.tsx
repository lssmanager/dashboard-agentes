import type { AgentReadinessState } from '../../../../lib/types';

type Props = {
  state: AgentReadinessState;
  score: number;
  checks: Record<string, boolean>;
  missingFields?: string[];
  publishEnabled: boolean;
  publishing?: boolean;
  onPublish: () => void;
};

export function AgentReadinessPanel({
  state,
  score,
  checks,
  missingFields = [],
  publishEnabled,
  publishing = false,
  onPublish,
}: Props) {
  return (
    <aside className="rounded-lg border p-3 space-y-2">
      <h3 className="text-sm font-semibold">Readiness</h3>
      <p className="text-xs">{state} · {score}%</p>
      <ul className="text-xs space-y-1">
        {Object.entries(checks).map(([name, ok]) => (
          <li key={name}>{ok ? '✓' : '⚠'} {name}</li>
        ))}
      </ul>
      {missingFields.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase opacity-80">Missing</p>
          <ul className="text-xs space-y-1">
            {missingFields.map((field) => <li key={field}>- {field}</li>)}
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        className="w-full rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
        style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
        disabled={!publishEnabled || publishing}
        onClick={onPublish}
      >
        {publishing ? 'Publishing...' : 'Publish Agent'}
      </button>
    </aside>
  );
}
