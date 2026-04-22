import { useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronRight, Cpu, Zap, Star, Tag, Check, AlertCircle } from 'lucide-react';

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
  const [model, setModel] = useState(profile.overrides.model ?? '');
  const [skills, setSkills] = useState((profile.overrides.skills ?? []).join(', '));
  const [overrideOpen, setOverrideOpen] = useState(false);

  const hasProfile = profile.catalogProfile !== null;
  const hasInheritance = profile.inheritedFrom.length > 0;
  const hasOverrides =
    Boolean(profile.overrides.model) ||
    (profile.overrides.skills?.length ?? 0) > 0 ||
    (profile.overrides.routines?.length ?? 0) > 0 ||
    (profile.overrides.tags?.length ?? 0) > 0;

  return (
    <section style={panelStyle}>
      <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Profile</h2>

      {/* ── Inheritance chain visualization ─────────────────────────── */}
      <div style={{ display: 'grid', gap: 8 }}>

        {/* Step 1: Catalog profile */}
        <ChainStep
          label="Catalog Profile"
          tone={hasProfile ? 'primary' : 'muted'}
          icon={hasProfile ? <Check size={11} /> : <AlertCircle size={11} />}
        >
          {hasProfile ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {profile.catalogProfile!.name}
              </div>
              {profile.catalogProfile!.description && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {profile.catalogProfile!.description}
                </div>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No catalog profile bound to this scope.
            </span>
          )}
        </ChainStep>

        {/* Arrow */}
        {hasProfile && <ChainArrow label={hasInheritance ? 'inherited through' : 'applied at'} />}

        {/* Step 2: Inheritance path */}
        {hasInheritance && (
          <>
            <ChainStep label="Inheritance Chain" tone="default">
              <div style={{ display: 'grid', gap: 4 }}>
                {profile.inheritedFrom.map((item, idx) => (
                  <div key={`${item.level}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ ...levelBadge, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      {item.level}
                    </span>
                    <code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.id}
                    </code>
                  </div>
                ))}
              </div>
            </ChainStep>
            <ChainArrow label={hasOverrides ? 'with local overrides' : 'no overrides'} />
          </>
        )}

        {/* Step 3: Overrides (if any) */}
        {hasOverrides && (
          <>
            <ChainStep label="Local Overrides" tone="warning">
              <div style={{ display: 'grid', gap: 4 }}>
                {profile.overrides.model && (
                  <OverrideRow icon={<Cpu size={10} />} label="Model" value={profile.overrides.model} />
                )}
                {(profile.overrides.skills ?? []).length > 0 && (
                  <OverrideRow icon={<Zap size={10} />} label="Skills" value={(profile.overrides.skills ?? []).join(', ')} />
                )}
                {(profile.overrides.routines ?? []).length > 0 && (
                  <OverrideRow icon={<Star size={10} />} label="Routines" value={(profile.overrides.routines ?? []).join(', ')} />
                )}
                {(profile.overrides.tags ?? []).length > 0 && (
                  <OverrideRow icon={<Tag size={10} />} label="Tags" value={(profile.overrides.tags ?? []).join(', ')} />
                )}
              </div>
            </ChainStep>
            <ChainArrow label="resolves to" />
          </>
        )}

        {!hasOverrides && hasProfile && <ChainArrow label="resolves to" />}

        {/* Step 4: Effective state */}
        <ChainStep label="Effective Configuration" tone="success">
          <div style={{ display: 'grid', gap: 6 }}>
            <EffectiveRow icon={<Cpu size={11} />} label="Model" value={profile.effectiveModel ?? 'None'} />
            <EffectiveRow
              icon={<Zap size={11} />}
              label="Skills"
              value={profile.effectiveSkills.length > 0 ? profile.effectiveSkills.join(', ') : 'None'}
            />
            <EffectiveRow
              icon={<Star size={11} />}
              label="Routines"
              value={profile.effectiveRoutines.length > 0 ? profile.effectiveRoutines.join(', ') : 'None'}
            />
            <EffectiveRow
              icon={<Tag size={11} />}
              label="Tags"
              value={profile.effectiveTags.length > 0 ? profile.effectiveTags.join(', ') : 'None'}
            />
          </div>
        </ChainStep>
      </div>

      {/* ── Bind / Unbind ────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionLabelStyle}>Bind / Unbind Profile</div>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={inputStyle}>
          <option value="">— Select a profile —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.category ? ` (${p.category})` : ''}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={busy || !selectedId}
            onClick={() => onBind(selectedId)}
            style={{
              ...actionBtnStyle,
              background: busy || !selectedId ? 'var(--bg-tertiary)' : 'var(--color-primary)',
              color: busy || !selectedId ? 'var(--text-muted)' : '#fff',
              border: 'none',
              cursor: busy || !selectedId ? 'not-allowed' : 'pointer',
            }}
          >
            Bind
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onUnbind}
            style={{ ...actionBtnStyle, opacity: busy ? 0.6 : 1 }}
          >
            Unbind
          </button>
        </div>
      </div>

      {/* ── Override editor (collapsible) ────────────────────────────── */}
      <div style={sectionCardStyle}>
        <button
          type="button"
          onClick={() => setOverrideOpen((v) => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
        >
          <span style={sectionLabelStyle}>Override Editor</span>
          {overrideOpen ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {overrideOpen && (
          <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
            <div>
              <label style={fieldLabelStyle}>
                <Cpu size={11} /> Model override
              </label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. gpt-4o, claude-opus-4-6"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>
                <Zap size={11} /> Skills override (comma-separated IDs)
              </label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. web-search, summarize"
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onSaveOverride({
                  model: model.trim() || undefined,
                  skills: skills
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              style={{
                ...actionBtnStyle,
                background: busy ? 'var(--bg-tertiary)' : 'var(--color-primary)',
                color: busy ? 'var(--text-muted)' : '#fff',
                border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Saving…' : 'Save overrides'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Chain helpers ─────────────────────────────────────────────────────────────

type Tone = 'primary' | 'success' | 'warning' | 'muted' | 'default';

function toneStyles(tone: Tone): { bg: string; border: string; label: string } {
  switch (tone) {
    case 'primary':
      return { bg: 'var(--color-primary-soft)', border: 'rgba(34,89,242,0.3)', label: 'var(--color-primary)' };
    case 'success':
      return { bg: 'var(--tone-success-bg, rgba(16,185,129,0.08))', border: 'var(--tone-success-border, rgba(16,185,129,0.3))', label: 'var(--tone-success-text, #10b981)' };
    case 'warning':
      return { bg: 'var(--tone-warning-bg, rgba(245,158,11,0.08))', border: 'var(--tone-warning-border, rgba(245,158,11,0.3))', label: 'var(--tone-warning-text, #f59e0b)' };
    case 'muted':
      return { bg: 'var(--bg-secondary)', border: 'var(--border-primary)', label: 'var(--text-muted)' };
    default:
      return { bg: 'var(--bg-secondary)', border: 'var(--border-primary)', label: 'var(--text-muted)' };
  }
}

function ChainStep({ label, tone, icon, children }: { label: string; tone: Tone; icon?: React.ReactNode; children: React.ReactNode }) {
  const t = toneStyles(tone);
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${t.border}`,
        background: t.bg,
        padding: '10px 12px',
        display: 'grid',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon && <span style={{ color: t.label }}>{icon}</span>}
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.label }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function ChainArrow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
      <div style={{ width: 1, height: 12, background: 'var(--border-primary)', marginLeft: 4 }} />
      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>{label}</span>
    </div>
  );
}

function OverrideRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--tone-warning-text, #f59e0b)', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 48, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function EffectiveRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
      <span style={{ color: 'var(--tone-success-text, #10b981)', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 48, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const panelStyle: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  padding: 16,
  display: 'grid',
  gap: 14,
};

const sectionCardStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: '12px 14px',
  display: 'grid',
  gap: 8,
};

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--input-border)',
  background: 'var(--input-bg)',
  color: 'var(--input-text)',
  padding: '8px 10px',
  fontSize: 12,
  boxSizing: 'border-box',
};

const actionBtnStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginBottom: 4,
};

const levelBadge: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 999,
  padding: '2px 6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};
