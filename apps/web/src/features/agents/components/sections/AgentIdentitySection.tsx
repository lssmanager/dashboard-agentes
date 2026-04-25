import type { AgentSpec } from '../../../../lib/types';
import { FieldWrapper } from '../FieldWrapper';
import { ToggleRow } from '../ToggleRow';

type Props = {
  value: AgentSpec;
  profileSource?: 'template' | 'blank' | 'imported';
  onChange: (next: AgentSpec) => void;
};

export function AgentIdentitySection({ value, onChange, profileSource = 'blank' }: Props) {
  const identity = value.identity ?? {
    name: value.name ?? '',
    creature: '',
    role: value.role ?? 'Agent',
    description: value.description ?? '',
    vibe: '',
    emoji: '',
    avatar: '',
  };

  const update = (patch: Partial<typeof identity>) => {
    const nextIdentity = { ...identity, ...patch };
    onChange({
      ...value,
      identity: nextIdentity,
      name: nextIdentity.name,
      role: nextIdentity.role ?? value.role,
      description: nextIdentity.description ?? value.description,
    });
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

  const agentEnabled = value.isEnabled !== false;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FieldWrapper label="Name">
        <input
          value={identity.name ?? ''}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Pick a name for this agent"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Model">
        {/* TODO: Model selector component */}
        <input
          placeholder="Select model"
          disabled
          style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
        />
      </FieldWrapper>

      <FieldWrapper label="Creature" helper="What kind of entity is this agent?">
        <input
          value={identity.creature ?? ''}
          onChange={(e) => update({ creature: e.target.value })}
          placeholder="AI assistant, orchestrator, dev agent, familiar, monitor…"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Role">
        <input
          value={identity.role ?? ''}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="What kind of agent is this?"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Vibe" helper="How does this agent come across?">
        <input
          value={identity.vibe ?? ''}
          onChange={(e) => update({ vibe: e.target.value })}
          placeholder="warm, sharp, calm, direct, playful, chaotic…"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Emoji">
        <input
          value={identity.emoji ?? ''}
          onChange={(e) => update({ emoji: e.target.value })}
          placeholder="Signature emoji"
          style={{ ...inputStyle, maxWidth: 120 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Avatar URL" helper="e.g. avatars/agent.png or https://…">
        <input
          value={identity.avatar ?? ''}
          onChange={(e) => update({ avatar: e.target.value })}
          placeholder="Workspace path or URL"
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Description">
        <textarea
          value={identity.description ?? ''}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="A brief description of this agent's purpose."
          style={{ ...textareaStyle, minHeight: 72 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="Profile source">
        <input
          readOnly
          value={profileSource}
          style={{ ...inputStyle, color: 'var(--builder-text-muted)', cursor: 'default' }}
        />
      </FieldWrapper>

      <ToggleRow
        label="Agent enabled"
        checked={agentEnabled}
        onChange={(checked) => onChange({ ...value, isEnabled: checked })}
      />
    </section>
  );
}
