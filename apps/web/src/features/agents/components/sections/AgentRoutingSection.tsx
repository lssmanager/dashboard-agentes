import type { AgentSpec } from '../../../../lib/types';

type Props = {
  value: AgentSpec;
  availableChannels?: string[];
  onChange: (next: AgentSpec) => void;
};

function splitCsv(input: string): string[] {
  return input.split(',').map((item) => item.trim()).filter(Boolean);
}

export function AgentRoutingSection({ value, onChange, availableChannels = [] }: Props) {
  const routing = value.routingChannels ?? {
    allowedChannels: [],
    defaultChannel: '',
    fallbackChannel: '',
    groupChatMode: 'respond_when_mentioned',
    reactionPolicy: 'limited',
    maxReactionsPerMessage: 1,
    avoidTripleTap: true,
    platformFormattingRules: 'Discord: no markdown tables, wrap links in <>\nWhatsApp: no headers, use bold or CAPS',
    responseTriggerPolicy: "Stay silent when: casual banter, someone already answered, response would just be 'yeah'",
  };

  const update = (patch: Partial<typeof routing>) => {
    onChange({ ...value, routingChannels: { ...routing, ...patch } });
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Routing & Channels</h3>

      <input
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={(routing.allowedChannels ?? []).join(', ')}
        onChange={(e) => update({ allowedChannels: splitCsv(e.target.value) })}
        placeholder="Where is this agent allowed to speak?"
      />

      {availableChannels.length > 0 ? (
        <div className="text-xs opacity-80">Available: {availableChannels.join(', ')}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input className="rounded-md border px-3 py-2 text-sm" value={routing.defaultChannel ?? ''} onChange={(e) => update({ defaultChannel: e.target.value })} placeholder="Default channel" />
        <input className="rounded-md border px-3 py-2 text-sm" value={routing.fallbackChannel ?? ''} onChange={(e) => update({ fallbackChannel: e.target.value })} placeholder="Fallback channel" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <select className="rounded-md border px-3 py-2 text-sm" value={routing.groupChatMode ?? 'respond_when_mentioned'} onChange={(e) => update({ groupChatMode: e.target.value as 'silent_by_default' | 'respond_when_mentioned' | 'active' })}>
          <option value="silent_by_default">silent_by_default</option>
          <option value="respond_when_mentioned">respond_when_mentioned</option>
          <option value="active">active</option>
        </select>

        <select className="rounded-md border px-3 py-2 text-sm" value={routing.reactionPolicy ?? 'limited'} onChange={(e) => update({ reactionPolicy: e.target.value as 'enabled' | 'disabled' | 'limited' })}>
          <option value="enabled">enabled</option>
          <option value="disabled">disabled</option>
          <option value="limited">limited</option>
        </select>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={Boolean(routing.avoidTripleTap)} onChange={(e) => update({ avoidTripleTap: e.target.checked })} /> Avoid triple tap</label>
        <label className="inline-flex items-center gap-2">Max reactions <input type="number" min={0} max={3} className="w-16 rounded-md border px-2 py-1 text-sm" value={routing.maxReactionsPerMessage ?? 1} onChange={(e) => update({ maxReactionsPerMessage: Number(e.target.value) || 1 })} /></label>
      </div>

      <textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm" value={routing.platformFormattingRules ?? ''} onChange={(e) => update({ platformFormattingRules: e.target.value })} placeholder="What channel-specific formatting rules apply?" />
      <textarea rows={3} className="w-full rounded-md border px-3 py-2 text-sm" value={routing.responseTriggerPolicy ?? ''} onChange={(e) => update({ responseTriggerPolicy: e.target.value })} placeholder="When should this agent stay silent?" />
    </section>
  );
}
