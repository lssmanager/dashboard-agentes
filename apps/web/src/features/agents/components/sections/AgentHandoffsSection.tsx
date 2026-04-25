import type { AgentSpec } from '../../../../lib/types';
import { FieldWrapper } from '../FieldWrapper';
import { EditableList } from '../EditableList';
import { ToggleRow } from '../ToggleRow';
import { MultiSelectChips } from '../MultiSelectChips';

type Props = {
  value: AgentSpec;
  availableTargets?: Array<{ id: string; name: string }>;
  onChange: (next: AgentSpec) => void;
};

const DEFAULT_INTERNAL = [
  'Read files and explore workspace',
  'Organize memory and daily notes',
  'Search the web',
  'Check git status',
  'Update documentation',
];

const DEFAULT_EXTERNAL = [
  'Send emails',
  'Post tweets or public content',
  'Run destructive commands',
  'Publish to group channels',
  'Exfiltrate or transfer data',
];

export function AgentHandoffsSection({ value, availableTargets = [], onChange }: Props) {
  const handoffs = value.handoffs ?? {
    allowedTargets: [],
    fallbackAgent: '',
    escalationPolicy: '',
  };

  const updateHandoffs = (patch: Partial<typeof handoffs>) => {
    onChange({ ...value, handoffs: { ...handoffs, ...patch } });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--builder-bg-secondary)',
    border: '1px solid var(--builder-border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    fontSize: 14,
    color: 'var(--builder-text-primary)',
    outline: 'none',
    transition: 'var(--transition)',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MultiSelectChips
        label="Allowed Handoff Targets"
        selected={handoffs.allowedTargets ?? []}
        onAdd={(id) => updateHandoffs({ allowedTargets: [...(handoffs.allowedTargets ?? []), id] })}
        onRemove={(id) => updateHandoffs({ allowedTargets: (handoffs.allowedTargets ?? []).filter((t) => t !== id) })}
        searchPlaceholder="Search agents in this workspace…"
        options={availableTargets}
      />

      <FieldWrapper label="Fallback Agent" helper="Used when no other target is available.">
        <select
          value={handoffs.fallbackAgent ?? ''}
          onChange={(e) => updateHandoffs({ fallbackAgent: e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        >
          <option value="">Select a fallback agent (optional)</option>
          {availableTargets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </FieldWrapper>

      <FieldWrapper label="Escalation Policy">
        <textarea
          value={handoffs.escalationPolicy ?? ''}
          onChange={(e) => updateHandoffs({ escalationPolicy: e.target.value })}
          placeholder="When should this agent escalate?..."
          style={{ ...textareaStyle, minHeight: 60 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Approval Lane">
        <textarea
          placeholder="Which actions require explicit human approval..."
          style={{ ...textareaStyle, minHeight: 60 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <EditableList
        label="Internal Actions — Allowed freely"
        helper="The agent can do these without asking."
        items={[]}
        onChange={() => {}}
        addLabel="+ Add action"
        defaults={DEFAULT_INTERNAL}
      />

      <EditableList
        label="External Actions — Require approval"
        helper="The agent must ask before doing any of these."
        items={[]}
        onChange={() => {}}
        addLabel="+ Add action"
        defaults={DEFAULT_EXTERNAL}
      />

      <ToggleRow
        label="Public posting requires approval"
        helper="Always ask before sending anything to a public or group channel."
        checked={true}
        onChange={() => {}}
        defaultChecked={true}
      />

      <FieldWrapper label="Delegation Notes (optional)">
        <textarea
          placeholder="Any additional notes about how and when this agent should delegate."
          style={{ ...textareaStyle, minHeight: 48 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>
    </section>
  );
}
