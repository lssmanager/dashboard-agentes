import type { AgentSpec } from '../../../../lib/types';

type Props = {
  value: AgentSpec;
  availableTargets?: Array<{ id: string; name: string }>;
  onChange: (next: AgentSpec) => void;
};

const DEFAULT_INTERNAL = ['read files', 'explore workspace', 'organize memory', 'search web', 'check git status', 'update docs'];
const DEFAULT_EXTERNAL = ['send email', 'post tweet', 'publish content', 'run destructive commands', 'exfiltrate data'];

function splitCsv(input: string): string[] {
  return input.split(',').map((item) => item.trim()).filter(Boolean);
}

export function AgentHandoffsSection({ value, onChange, availableTargets = [] }: Props) {
  const handoffs = value.handoffs ?? {
    allowedTargets: [],
    fallbackAgent: '',
    escalationPolicy: '',
    approvalLane: '',
    delegationNotes: '',
    internalActionsAllowed: DEFAULT_INTERNAL,
    externalActionsRequireApproval: DEFAULT_EXTERNAL,
    publicPostingRequiresApproval: true,
  };

  const update = (patch: Partial<typeof handoffs>) => {
    onChange({ ...value, handoffs: { ...handoffs, ...patch } });
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Handoffs</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={handoffs.fallbackAgent ?? ''}
          onChange={(e) => update({ fallbackAgent: e.target.value })}
        >
          <option value="">Fallback agent</option>
          {availableTargets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
        </select>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          value={(handoffs.allowedTargets ?? []).join(', ')}
          onChange={(e) => update({ allowedTargets: splitCsv(e.target.value) })}
          placeholder="Allowed targets (comma-separated IDs)"
        />
      </div>

      <textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm" value={handoffs.escalationPolicy ?? ''} onChange={(e) => update({ escalationPolicy: e.target.value })} placeholder="When should this agent escalate?" />
      <textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm" value={handoffs.approvalLane ?? ''} onChange={(e) => update({ approvalLane: e.target.value })} placeholder="Which actions require human approval?" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <textarea rows={4} className="w-full rounded-md border px-3 py-2 text-sm" value={(handoffs.internalActionsAllowed ?? DEFAULT_INTERNAL).join('\n')} onChange={(e) => update({ internalActionsAllowed: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })} placeholder="internal actions (one per line)" />
        <textarea rows={4} className="w-full rounded-md border px-3 py-2 text-sm" value={(handoffs.externalActionsRequireApproval ?? DEFAULT_EXTERNAL).join('\n')} onChange={(e) => update({ externalActionsRequireApproval: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })} placeholder="external actions requiring approval (one per line)" />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={Boolean(handoffs.publicPostingRequiresApproval)} onChange={(e) => update({ publicPostingRequiresApproval: e.target.checked })} />
        Public posting requires approval
      </label>
    </section>
  );
}
