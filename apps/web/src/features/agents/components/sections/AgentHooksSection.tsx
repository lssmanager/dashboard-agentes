import type { AgentSpec } from '../../../../lib/types';

type Props = {
  value: AgentSpec;
  onChange: (next: AgentSpec) => void;
};

export function AgentHooksSection({ value, onChange }: Props) {
  const hooks = value.hooks ?? {
    heartbeat: {
      enabled: false,
      promptSource: 'disabled',
      checkEmail: true,
      checkCalendar: true,
      checkWeather: false,
      checkMentions: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
    },
    lifecycleHooks: [],
    cronHooks: [],
    proactiveChecks: ['organize memory', 'check git status', 'update docs', 'commit changes'],
  };

  const update = (patch: Partial<typeof hooks>) => onChange({ ...value, hooks: { ...hooks, ...patch } });
  const updateHeartbeat = (patch: Partial<NonNullable<typeof hooks.heartbeat>>) => update({ heartbeat: { ...(hooks.heartbeat ?? { enabled: false, promptSource: 'disabled' }), ...patch } });

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Hooks</h3>

      <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(hooks.heartbeat?.enabled)} onChange={(e) => updateHeartbeat({ enabled: e.target.checked })} /> Enable Heartbeat</label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select className="rounded-md border px-3 py-2 text-sm" value={hooks.heartbeat?.promptSource ?? 'disabled'} onChange={(e) => updateHeartbeat({ promptSource: e.target.value as 'HEARTBEAT.md' | 'inline' | 'disabled' })}>
          <option value="HEARTBEAT.md">HEARTBEAT.md file</option>
          <option value="inline">inline config</option>
          <option value="disabled">disabled</option>
        </select>
        <input className="rounded-md border px-3 py-2 text-sm" value={hooks.heartbeat?.quietHoursStart ?? ''} onChange={(e) => updateHeartbeat({ quietHoursStart: e.target.value })} placeholder="23:00" />
        <input className="rounded-md border px-3 py-2 text-sm" value={hooks.heartbeat?.quietHoursEnd ?? ''} onChange={(e) => updateHeartbeat({ quietHoursEnd: e.target.value })} placeholder="08:00" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(hooks.heartbeat?.checkEmail)} onChange={(e) => updateHeartbeat({ checkEmail: e.target.checked })} /> email</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(hooks.heartbeat?.checkCalendar)} onChange={(e) => updateHeartbeat({ checkCalendar: e.target.checked })} /> calendar</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(hooks.heartbeat?.checkWeather)} onChange={(e) => updateHeartbeat({ checkWeather: e.target.checked })} /> weather</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(hooks.heartbeat?.checkMentions)} onChange={(e) => updateHeartbeat({ checkMentions: e.target.checked })} /> mentions</label>
      </div>

      <textarea
        rows={4}
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={(hooks.proactiveChecks ?? []).join('\n')}
        onChange={(e) => update({ proactiveChecks: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })}
        placeholder="What should this agent check periodically?"
      />

      <textarea
        rows={4}
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={(hooks.cronHooks ?? []).map((row) => `${row.schedule} :: ${row.task}`).join('\n')}
        onChange={(e) =>
          update({
            cronHooks: e.target.value
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [schedule, ...taskParts] = line.split('::');
                return { schedule: schedule.trim(), task: taskParts.join('::').trim() };
              })
              .filter((row) => row.schedule && row.task),
          })
        }
        placeholder="cron expression :: task"
      />
    </section>
  );
}
