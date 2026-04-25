import type { AgentSpec } from '../../../../lib/types';
import { FieldWrapper } from '../FieldWrapper';
import { EditableList } from '../EditableList';
import { SectionHeader } from '../SectionHeader';

type Props = { value: AgentSpec; onChange: (next: AgentSpec) => void };

const DEFAULT_PRINCIPLES = [
  'Be genuinely helpful, not performatively helpful.',
  "Have opinions — don't just reflect back.",
  'Be resourceful before asking.',
  'Earn trust through competence.',
  "Remember you're a guest in the human's space.",
];

const DEFAULT_BOUNDARIES = [
  'Private things stay private.',
  'Ask before external actions.',
  'Never send half-baked replies to messaging surfaces.',
];

export function AgentBehaviorSection({ value, onChange }: Props) {
  const behavior = value.behavior ?? {
    systemPrompt: value.instructions ?? '',
    personalityGuide: '',
    operatingPrinciples: DEFAULT_PRINCIPLES,
    boundaries: DEFAULT_BOUNDARIES,
    privacyRules: [],
    continuityRules: [],
    responseStyle: 'adaptive',
  };
  const human = value.humanContext ?? {};

  const updateBehavior = (patch: Partial<typeof behavior>) => {
    const nextBehavior = { ...behavior, ...patch };
    onChange({
      ...value,
      behavior: nextBehavior,
      instructions: nextBehavior.systemPrompt,
    });
  };

  const updateHuman = (patch: Partial<typeof human>) => {
    onChange({ ...value, humanContext: { ...human, ...patch } });
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
      <FieldWrapper label="System Instructions">
        <textarea
          value={behavior.systemPrompt ?? ''}
          onChange={(e) => updateBehavior({ systemPrompt: e.target.value })}
          placeholder="Describe the agent's core mission and operating mode."
          style={{ ...textareaStyle, minHeight: 100 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
        <div style={{ fontSize: 11, color: 'var(--builder-text-disabled)', marginTop: 4 }}>
          {(behavior.systemPrompt ?? '').length} characters
        </div>
      </FieldWrapper>

      <div style={{ height: 1, background: 'var(--builder-border-subtle)', margin: '8px 0' }} />

      <FieldWrapper label="Personality Guide">
        <textarea
          value={behavior.personalityGuide ?? ''}
          onChange={(e) => updateBehavior({ personalityGuide: e.target.value })}
          placeholder="How should this agent sound and behave?"
          style={{ ...textareaStyle, minHeight: 80 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <EditableList
        label="Operating Principles"
        helper="Core truths this agent operates by."
        items={behavior.operatingPrinciples ?? DEFAULT_PRINCIPLES}
        onChange={(items) => updateBehavior({ operatingPrinciples: items })}
        addLabel="+ Add principle"
        defaults={DEFAULT_PRINCIPLES}
      />

      <EditableList
        label="Boundaries"
        helper="What this agent must always ask before doing."
        items={behavior.boundaries ?? DEFAULT_BOUNDARIES}
        onChange={(items) => updateBehavior({ boundaries: items })}
        addLabel="+ Add boundary"
        defaults={DEFAULT_BOUNDARIES}
      />

      <FieldWrapper label="Response Style">
        <input
          value={behavior.responseStyle ?? 'adaptive'}
          onChange={(e) => updateBehavior({ responseStyle: e.target.value })}
          placeholder="Concise when needed, thorough when it matters..."
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <div style={{ height: 1, background: 'var(--builder-border-subtle)', margin: '8px 0' }} />

      <SectionHeader
        title="HUMAN CONTEXT"
        subtitle="What this agent knows about the person or team it supports."
      />

      <FieldWrapper label="Name">
        <input
          value={human.humanName ?? ''}
          onChange={(e) => updateHuman({ humanName: e.target.value })}
          placeholder="Human name"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Address as">
        <input
          value={human.addressAs ?? ''}
          onChange={(e) => updateHuman({ addressAs: e.target.value })}
          placeholder="How should the agent address you?"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Pronouns (optional)">
        <input
          value={human.pronouns ?? ''}
          onChange={(e) => updateHuman({ pronouns: e.target.value })}
          placeholder="they/them, he/him, she/her..."
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Timezone">
        <input
          value={human.timezone ?? ''}
          onChange={(e) => updateHuman({ timezone: e.target.value })}
          placeholder="e.g. America/New_York"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Notes">
        <textarea
          value={human.notes ?? ''}
          onChange={(e) => updateHuman({ notes: e.target.value })}
          placeholder="Any additional notes..."
          style={{ ...textareaStyle, minHeight: 60 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Context">
        <textarea
          value={human.context ?? ''}
          onChange={(e) => updateHuman({ context: e.target.value })}
          placeholder="What should this agent know about the human/team it supports?"
          style={{ ...textareaStyle, minHeight: 80 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>
    </section>
  );
}
