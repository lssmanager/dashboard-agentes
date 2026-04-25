import type { AgentSpec } from '../../../../lib/types';
import { FieldWrapper } from '../FieldWrapper';
import { RadioGroup } from '../RadioGroup';
import { ToggleRow } from '../ToggleRow';
import { MultiSelectChips } from '../MultiSelectChips';

type Props = {
  value: AgentSpec;
  availableChannels?: string[];
  onChange: (next: AgentSpec) => void;
};

const CHANNEL_OPTIONS = [
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
  { id: 'discord', label: 'Discord' },
  { id: 'matrix', label: 'Matrix' },
];

export function AgentRoutingSection({ value, availableChannels = [], onChange }: Props) {
  const routing = value.routing ?? {
    allowedChannels: [],
    defaultChannel: '',
    fallbackChannel: '',
    groupChatBehavior: 'mention',
    emojiReactions: true,
    avoidTripleTap: true,
  };

  const updateRouting = (patch: Partial<typeof routing>) => {
    onChange({ ...value, routing: { ...routing, ...patch } });
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

  const channelOptions = availableChannels.length > 0
    ? availableChannels.map((c) => ({ id: c, label: c }))
    : CHANNEL_OPTIONS;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MultiSelectChips
        label="Allowed Channels"
        selected={routing.allowedChannels ?? []}
        onAdd={(id) => updateRouting({ allowedChannels: [...(routing.allowedChannels ?? []), id] })}
        onRemove={(id) => updateRouting({ allowedChannels: (routing.allowedChannels ?? []).filter((c) => c !== id) })}
        searchPlaceholder="Search channels…"
        options={channelOptions}
      />

      <FieldWrapper label="Default Channel">
        <select
          value={routing.defaultChannel ?? ''}
          onChange={(e) => updateRouting({ defaultChannel: e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        >
          <option value="">Select default channel</option>
          {channelOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </FieldWrapper>

      <FieldWrapper label="Fallback Channel">
        <select
          value={routing.fallbackChannel ?? ''}
          onChange={(e) => updateRouting({ fallbackChannel: e.target.value })}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        >
          <option value="">Select fallback channel</option>
          {channelOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </FieldWrapper>

      <RadioGroup
        options={[
          { value: 'silent', label: 'Silent by default', description: 'Never speaks unless explicitly mentioned.' },
          { value: 'mention', label: 'Respond when mentioned', description: 'Participates only when directly addressed or asked.' },
          { value: 'active', label: 'Active participant', description: 'Contributes freely when it has genuine value to add.' },
        ]}
        selected={routing.groupChatBehavior ?? 'mention'}
        onChange={(v) => updateRouting({ groupChatBehavior: v })}
      />

      <div>
        <ToggleRow
          label="Emoji Reactions"
          checked={routing.emojiReactions !== false}
          onChange={(checked) => updateRouting({ emojiReactions: checked })}
        />
        {routing.emojiReactions !== false && (
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', paddingLeft: 46 }}>
            <span style={{ fontSize: 12, color: 'var(--builder-text-muted)' }}>
              Max reactions per message:
            </span>
            <input
              type="number"
              min={1}
              max={5}
              defaultValue={1}
              style={{ ...inputStyle, width: 60, padding: '6px 10px' }}
            />
            <span style={{ fontSize: 11, color: 'var(--builder-text-disabled)' }}>Keep it at 1.</span>
          </div>
        )}
      </div>

      <ToggleRow
        label="Avoid Triple-Tap"
        checked={routing.avoidTripleTap !== false}
        onChange={(checked) => updateRouting({ avoidTripleTap: checked })}
        defaultChecked={true}
      />

      <FieldWrapper label="Platform Formatting Rules">
        <textarea
          placeholder="Markdown, HTML escaping, emoji support, etc."
          style={{ ...textareaStyle, minHeight: 60, fontFamily: 'var(--font-mono)', fontSize: 12 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>

      <FieldWrapper label="When to Stay Silent">
        <textarea
          placeholder="Conditions where the agent should not respond…"
          style={{ ...textareaStyle, minHeight: 80 }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>
    </section>
  );
}
