import type { AgentSpec } from '../../../../lib/types';
import { ToggleRow } from '../ToggleRow';
import { RadioGroup } from '../RadioGroup';
import { FieldWrapper } from '../FieldWrapper';
import { SectionHeader } from '../SectionHeader';

type Props = {
  value: AgentSpec;
  onChange: (next: AgentSpec) => void;
};

export function AgentOperationsSection({ value, onChange }: Props) {
  const operations = value.operations ?? {
    startup: {
      readSoul: true,
      readUser: true,
      readDailyMemory: true,
      readLongTermMemoryInMainSessionOnly: true,
    },
    memoryPolicy: {
      dailyNotesEnabled: true,
      longTermMemoryEnabled: true,
      memoryScope: 'main_session_only',
      compactionPolicy: '',
    },
    safety: {
      destructiveCommandsRequireApproval: true,
      externalActionsRequireApproval: true,
      privateDataProtection: true,
      recoverableDeletePreferred: true,
    },
    retryPolicy: '',
    runtimeHealthNotes: '',
  };

  const update = (patch: Partial<typeof operations>) => onChange({ ...value, operations: { ...operations, ...patch } });
  const updateStartup = (patch: Partial<NonNullable<typeof operations.startup>>) =>
    update({
      startup: {
        ...(operations.startup ?? {}),
        ...patch,
      },
    });
  const updateMemory = (patch: Partial<NonNullable<typeof operations.memoryPolicy>>) =>
    update({
      memoryPolicy: {
        ...(operations.memoryPolicy ?? {}),
        ...patch,
      },
    });
  const updateSafety = (patch: Partial<NonNullable<typeof operations.safety>>) =>
    update({
      safety: {
        ...(operations.safety ?? {}),
        ...patch,
      },
    });

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
      <SectionHeader title="SESSION STARTUP" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { key: 'readSoul', label: 'Read SOUL.md' },
          { key: 'readUser', label: 'Read USER.md' },
          { key: 'readDailyMemory', label: 'Read daily memory' },
          { key: 'readLongTermMemoryInMainSessionOnly', label: 'Long-term memory in main session only' },
        ].map((item) => (
          <label key={item.key} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={Boolean((operations.startup as any)?.[item.key])}
              onChange={(e) => updateStartup({ [item.key]: e.target.checked } as any)}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: 'var(--builder-text-primary)' }}>{item.label}</span>
          </label>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--builder-border-subtle)', margin: '8px 0' }} />

      <SectionHeader title="MEMORY POLICY" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(operations.memoryPolicy?.dailyNotesEnabled)}
            onChange={(e) => updateMemory({ dailyNotesEnabled: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13, color: 'var(--builder-text-primary)' }}>Daily notes enabled</span>
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(operations.memoryPolicy?.longTermMemoryEnabled)}
            onChange={(e) => updateMemory({ longTermMemoryEnabled: e.target.checked })}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13, color: 'var(--builder-text-primary)' }}>Long-term memory enabled</span>
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--builder-text-muted)', marginBottom: 8 }}>Memory scope</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {(['main_session_only', 'shared_safe', 'disabled'] as const).map((opt) => (
            <label key={opt} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`memoryScope-${value.id}`}
                value={opt}
                checked={(operations.memoryPolicy?.memoryScope ?? 'main_session_only') === opt}
                onChange={() => updateMemory({ memoryScope: opt })}
                style={{ width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13, color: 'var(--builder-text-primary)' }}>{opt.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <FieldWrapper label="Compaction policy">
          <textarea
            rows={2}
            value={operations.memoryPolicy?.compactionPolicy ?? ''}
            onChange={(e) => updateMemory({ compactionPolicy: e.target.value })}
            placeholder="Compaction policy notes"
            style={textareaStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
          />
        </FieldWrapper>
      </div>

      <div style={{ height: 1, background: 'var(--builder-border-subtle)', margin: '8px 0' }} />

      <div>
        <div style={{ fontSize: 11, color: 'var(--builder-status-warn)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          ⚠ Safety &amp; Red Lines
        </div>
        <div style={{ background: 'var(--builder-status-warn-dim)', border: '1px solid rgba(246,173,85,0.25)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: 'var(--builder-text-muted)' }}>
          ⚠ These are recommended defaults. Disabling increases risk.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'destructiveCommandsRequireApproval', label: 'Destructive commands require approval' },
            { key: 'externalActionsRequireApproval', label: 'External actions require approval' },
            { key: 'privateDataProtection', label: 'Private data protection' },
            { key: 'recoverableDeletePreferred', label: 'Prefer recoverable delete' },
          ].map((item) => (
            <label key={item.key} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={Boolean((operations.safety as any)?.[item.key])}
                onChange={(e) => updateSafety({ [item.key]: e.target.checked } as any)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: 'var(--builder-text-primary)' }}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--builder-border-subtle)', margin: '8px 0' }} />

      <details style={{ borderRadius: 6, border: '1px solid var(--builder-border-color)', overflow: 'hidden' }}>
        <summary style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', color: 'var(--builder-text-muted)', userSelect: 'none' }}>
          ▶ Runtime
        </summary>
        <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={operations.retryPolicy ?? ''}
            onChange={(e) => update({ retryPolicy: e.target.value })}
            placeholder="Retry policy"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
          />
          <textarea
            rows={3}
            value={operations.runtimeHealthNotes ?? ''}
            onChange={(e) => update({ runtimeHealthNotes: e.target.value })}
            placeholder="Runtime health notes"
            style={textareaStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
          />
        </div>
      </details>
    </section>
  );
}
