import type { AgentSpec } from '../../../../lib/types';

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

function splitLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

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

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Prompts / Behavior</h3>

      <textarea
        rows={5}
        value={behavior.systemPrompt ?? ''}
        onChange={(event) => updateBehavior({ systemPrompt: event.target.value })}
        placeholder="Describe the agent's core mission and operating mode."
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      <textarea
        rows={3}
        value={behavior.personalityGuide ?? ''}
        onChange={(event) => updateBehavior({ personalityGuide: event.target.value })}
        placeholder="How should this agent sound and behave?"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase opacity-80">Operating Principles</p>
          <textarea
            rows={6}
            value={(behavior.operatingPrinciples ?? DEFAULT_PRINCIPLES).join('\n')}
            onChange={(e) => updateBehavior({ operatingPrinciples: splitLines(e.target.value) })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase opacity-80">Boundaries</p>
          <textarea
            rows={6}
            value={(behavior.boundaries ?? DEFAULT_BOUNDARIES).join('\n')}
            onChange={(e) => updateBehavior({ boundaries: splitLines(e.target.value) })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <details className="rounded-md border p-3" open>
        <summary className="cursor-pointer text-sm font-medium">Human Context</summary>
        <p className="text-xs opacity-75 mt-1">Keep this useful and respectful, not invasive.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <input value={human.humanName ?? ''} onChange={(e) => updateHuman({ humanName: e.target.value })} placeholder="Human name" className="rounded-md border px-3 py-2 text-sm" />
          <input value={human.addressAs ?? ''} onChange={(e) => updateHuman({ addressAs: e.target.value })} placeholder="Address as" className="rounded-md border px-3 py-2 text-sm" />
          <input value={human.pronouns ?? ''} onChange={(e) => updateHuman({ pronouns: e.target.value })} placeholder="Pronouns" className="rounded-md border px-3 py-2 text-sm" />
          <input value={human.timezone ?? ''} onChange={(e) => updateHuman({ timezone: e.target.value })} placeholder="Timezone" className="rounded-md border px-3 py-2 text-sm" />
          <textarea rows={2} value={human.notes ?? ''} onChange={(e) => updateHuman({ notes: e.target.value })} placeholder="Notes" className="md:col-span-2 rounded-md border px-3 py-2 text-sm" />
          <textarea rows={3} value={human.context ?? ''} onChange={(e) => updateHuman({ context: e.target.value })} placeholder="What should this agent know about the human/team it supports?" className="md:col-span-2 rounded-md border px-3 py-2 text-sm" />
        </div>
      </details>
    </section>
  );
}
