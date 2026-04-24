import type { EditorSkillsToolsDto } from '../../../../lib/types';

type PatchPayload = {
  skills?: { select?: string[]; deselect?: string[]; require?: string[]; disable?: string[] };
  tools?: { select?: string[]; deselect?: string[]; require?: string[]; disable?: string[] };
};

type Props = {
  data: EditorSkillsToolsDto | null;
  onPatch: (payload: PatchPayload) => Promise<void>;
};

export function AgentSkillsToolsSection({ data, onPatch }: Props) {
  const stateTone = (state: string) => {
    switch (state) {
      case 'selected':
      case 'required':
        return { background: 'var(--color-primary-soft)', color: 'var(--color-primary)' };
      case 'blocked':
        return { background: 'rgba(239,68,68,0.16)', color: 'var(--tone-danger-text)' };
      case 'disabled':
        return { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
      default:
        return { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
    }
  };

  const sourceCards = data?.sources ?? {
    profileDefaults: [],
    agencyEnabled: [],
    inherited: [],
    localOverrides: [],
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Skills / Tools</h3>
      <p className="text-xs opacity-80">Catalog and inheritance assignment only. No ad-hoc installs here.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="rounded-md border p-2 text-xs"><p className="font-semibold">Profile defaults</p><p>{sourceCards.profileDefaults.length}</p></div>
        <div className="rounded-md border p-2 text-xs"><p className="font-semibold">Agency enabled</p><p>{sourceCards.agencyEnabled.length}</p></div>
        <div className="rounded-md border p-2 text-xs"><p className="font-semibold">Workspace inherited</p><p>{sourceCards.inherited.length}</p></div>
        <div className="rounded-md border p-2 text-xs"><p className="font-semibold">Local overrides</p><p>{sourceCards.localOverrides.length}</p></div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase opacity-80">Skills</p>
        {(data?.skills ?? []).map((item) => (
          <div key={item.id} className="rounded-md border p-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{item.name}</p>
              <span className="px-2 py-0.5 rounded" style={stateTone(item.state)}>{item.state}</span>
            </div>
            <p className="opacity-80">{item.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded border">{item.source}</span>
              {item.blockedReason ? <span className="opacity-80">{item.blockedReason}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ skills: { select: [item.id] } })}>Select</button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ skills: { deselect: [item.id] } })}>Deselect</button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ skills: { require: [item.id] } })}>Require</button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ skills: { disable: [item.id] } })}>Disable</button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase opacity-80">Tools</p>
        {(data?.tools ?? []).map((item) => (
          <div key={item.id} className="rounded-md border p-2 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{item.name}</p>
              <span className="px-2 py-0.5 rounded" style={stateTone(item.state)}>{item.state}</span>
            </div>
            <p className="opacity-80">{item.description}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded border">{item.type}</span>
              <span className="px-2 py-0.5 rounded border">{item.source}</span>
              {item.blockedReason ? <span className="opacity-80">{item.blockedReason}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ tools: { select: [item.id] } })}>Select</button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ tools: { deselect: [item.id] } })}>Deselect</button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ tools: { require: [item.id] } })}>Require</button>
              <button type="button" className="rounded border px-2 py-0.5" onClick={() => void onPatch({ tools: { disable: [item.id] } })}>Disable</button>
            </div>
          </div>
        ))}
      </div>

      {((data?.skills.length ?? 0) + (data?.tools.length ?? 0) === 0) && (
        <div className="rounded-md border p-3 text-xs space-y-2">
          <p>No skills/tools enabled for this scope</p>
          <div className="flex items-center gap-2">
            <a className="underline" href="/profiles">Open Profiles Hub</a>
            <a className="underline" href="/settings">Open Settings</a>
          </div>
        </div>
      )}

      <div className="rounded-md border p-2 text-xs">
        <p className="font-semibold mb-1">Effective Assignment</p>
        <pre className="overflow-auto">{JSON.stringify(data?.effective ?? { skills: [], tools: [] }, null, 2)}</pre>
      </div>
    </section>
  );
}
