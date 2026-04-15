import { AgentSpec } from '../../../lib/types';

interface AgentHandoffEditorProps {
  value: AgentSpec['handoffRules'];
  onChange: (value: AgentSpec['handoffRules']) => void;
}

export function AgentHandoffEditor({ value, onChange }: AgentHandoffEditorProps) {
  function appendRule() {
    onChange([...value, { id: crypto.randomUUID(), targetAgentId: '', when: 'always' }]);
  }

  function patch(index: number, patchValue: Partial<AgentSpec['handoffRules'][number]>) {
    onChange(value.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patchValue } : rule)));
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium">Handoffs</p>
        <button type="button" onClick={appendRule} className="rounded border border-slate-300 px-2 py-1 text-xs">
          Add
        </button>
      </div>
      {value.map((rule, index) => (
        <div key={rule.id} className="grid grid-cols-2 gap-2 rounded border border-slate-300 p-2">
          <input
            value={rule.targetAgentId}
            onChange={(event) => patch(index, { targetAgentId: event.target.value })}
            placeholder="target agent id"
            className="rounded border border-slate-200 px-2 py-1"
          />
          <input
            value={rule.when}
            onChange={(event) => patch(index, { when: event.target.value })}
            placeholder="when"
            className="rounded border border-slate-200 px-2 py-1"
          />
        </div>
      ))}
    </div>
  );
}
