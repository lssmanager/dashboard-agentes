import type { AgentSpec } from '../../../../lib/types';
import { FieldWrapper } from '../FieldWrapper';
import { RadioGroup } from '../RadioGroup';
import { ToggleRow } from '../ToggleRow';
import { CronTable } from '../CronTable';
import { EditableList } from '../EditableList';

type Props = {
  value: AgentSpec;
  onChange: (next: AgentSpec) => void;
};

const DEFAULT_PROACTIVE_TASKS = [
  'Summarize new messages daily at 9am',
  'Check for urgent deadlines approaching',
  'Remind about pending approvals',
  'Weekly team update summary',
];

export function AgentHooksSection({ value, onChange }: Props) {
  const hooks = value.hooks ?? {
    heartbeatEnabled: true,
    promptSource: 'file',
    quietHoursStart: '',
    quietHoursEnd: '',
    cronTasks: [],
  };

  const updateHooks = (patch: Partial<typeof hooks>) => {
    onChange({ ...value, hooks: { ...hooks, ...patch } });
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

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToggleRow
        label="Enable Heartbeat"
        checked={hooks.heartbeatEnabled !== false}
        onChange={(checked) => updateHooks({ heartbeatEnabled: checked })}
      />

      <div style={hooks.heartbeatEnabled === false ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
        <RadioGroup
          options={[
            { value: 'file', label: 'HEARTBEAT.md file', description: 'Read from workspace HEARTBEAT.md on each cycle.' },
            { value: 'inline', label: 'Inline config', description: 'Use the instructions defined below.' },
            { value: 'disabled', label: 'Disabled', description: 'No prompt — agent skips heartbeat cycles.' },
          ]}
          selected={hooks.promptSource ?? 'file'}
          onChange={(v) => updateHooks({ promptSource: v })}
        />

        {(hooks.promptSource ?? 'file') === 'inline' && (
          <div style={{ marginTop: 20 }}>
            <FieldWrapper label="Heartbeat instructions">
              <textarea
                placeholder="Check email for urgent messages..."
                style={{
                  width: '100%',
                  background: 'var(--builder-bg-secondary)',
                  border: '1px solid var(--builder-border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--builder-text-primary)',
                  outline: 'none',
                  transition: 'var(--transition)',
                  minHeight: 80,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
              />
            </FieldWrapper>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--builder-text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            PERIODIC CHECKS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'email', label: 'Check email for urgent unread messages' },
              { id: 'calendar', label: 'Check calendar for upcoming events (< 48h)' },
              { id: 'weather', label: 'Check weather (if relevant)' },
              { id: 'mentions', label: 'Check social mentions / notifications' },
            ].map((check) => (
              <label key={check.id} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: 'var(--builder-text-primary)' }}>{check.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <FieldWrapper label="Quiet hours" helper="No outgoing messages during these hours (local time).">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input placeholder="23:00" style={{ ...inputStyle, width: 80 }} />
              <span style={{ color: 'var(--builder-text-muted)', fontSize: 13 }}>to</span>
              <input placeholder="08:00" style={{ ...inputStyle, width: 80 }} />
            </div>
          </FieldWrapper>
        </div>

        <div style={{ marginTop: 20 }}>
          <EditableList
            label="Proactive Tasks"
            items={[]}
            onChange={() => {}}
            addLabel="+ Add task"
            defaults={DEFAULT_PROACTIVE_TASKS}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <CronTable
            label="Cron Hooks"
            rows={hooks.cronTasks ?? []}
            onChange={(rows) => updateHooks({ cronTasks: rows })}
          />
        </div>
      </div>
    </section>
  );
}
