import { useState, type CSSProperties } from 'react';

import type { EffectiveProfileDto, ProfileSpec } from '../../../../lib/types';

export function ProfileScopeTab({
  profile,
  profiles,
  busy,
  onBind,
  onUnbind,
  onSaveOverride,
}: {
  profile: EffectiveProfileDto;
  profiles: ProfileSpec[];
  busy: boolean;
  onBind: (profileId: string) => void;
  onUnbind: () => void;
  onSaveOverride: (payload: { model?: string; skills?: string[] }) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [model, setModel] = useState('');
  const [skills, setSkills] = useState('');
  const inheritedChain = profile.inheritedFrom.map((item) => `${item.level}:${item.id}`).join(' -> ') || 'none';
  const overridesLabel = [
    profile.overrides.model ? `model=${profile.overrides.model}` : '',
    profile.overrides.skills?.length ? `skills=${profile.overrides.skills.join(',')}` : '',
    profile.overrides.routines?.length ? `routines=${profile.overrides.routines.join(',')}` : '',
    profile.overrides.tags?.length ? `tags=${profile.overrides.tags.join(',')}` : '',
  ]
    .filter(Boolean)
    .join(' | ') || 'none';

  return (
    <section style={panelStyle}>
      <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Profile</h2>

      <div style={{ display: 'grid', gap: 8 }}>
        <Row label="Catalog" value={profile.catalogProfile?.name ?? 'None'} />
        <Row label="Applied at" value={profile.appliedAtLevel ?? 'None'} />
        <Row label="Inherited from" value={inheritedChain} />
        <Row label="Overrides" value={overridesLabel} />
        <Row label="Model" value={profile.effectiveModel ?? 'None'} />
        <Row label="Skills" value={profile.effectiveSkills.join(', ') || 'None'} />
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
        <label style={captionStyle}>Select profile (bind/unbind)</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={inputStyle}>
          <option value="">Select profile</option>
          {profiles.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => onBind(selectedId)} disabled={busy || !selectedId}>Bind</button>
          <button type="button" style={buttonStyle} onClick={onUnbind} disabled={busy}>Unbind</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        <label style={captionStyle}>Override editor</label>
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model override" style={inputStyle} />
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills override (comma-separated)" style={inputStyle} />
        <button
          type="button"
          style={buttonStyle}
          onClick={() => onSaveOverride({ model: model || undefined, skills: skills.split(',').map((i) => i.trim()).filter(Boolean) })}
          disabled={busy}
        >
          Save override
        </button>
      </div>

      <div style={{ ...cardStyle, marginTop: 4 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Compare effective profile</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Effective routines: {profile.effectiveRoutines.join(', ') || 'None'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Effective tags: {profile.effectiveTags.join(', ') || 'None'}
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{value}</span>
    </div>
  );
}

const panelStyle: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  padding: 16,
  display: 'grid',
  gap: 12,
};

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--input-border)',
  background: 'var(--input-bg)',
  color: 'var(--input-text)',
  padding: '10px 12px',
};

const buttonStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
};

const captionStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const cardStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
  display: 'grid',
  gap: 6,
};
