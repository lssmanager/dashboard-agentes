import { useState } from 'react';
import type { EditorSkillsToolsDto } from '../../../../lib/types';
import { FieldWrapper } from '../FieldWrapper';
import { SourceBadge } from '../SourceBadge';

type PatchPayload = {
  skills?: { select?: string[]; deselect?: string[]; require?: string[]; disable?: string[] };
  tools?: { select?: string[]; deselect?: string[]; require?: string[]; disable?: string[] };
};

type Props = {
  data: EditorSkillsToolsDto | null;
  localNotes?: string;
  onNotesChange?: (notes: string) => void;
  onPatch: (payload: PatchPayload) => Promise<void>;
};

const SOURCE_LABELS: Record<string, string> = {
  profile: 'Profile',
  profileDefaults: 'Profile',
  agencyEnabled: 'Agency',
  agency: 'Agency',
  inherited: 'Workspace',
  workspace: 'Workspace',
  local: 'Local',
  localOverrides: 'Local',
};

function srcLabel(src: string): string {
  return SOURCE_LABELS[src] ?? src;
}

function canToggle(state: string): boolean {
  return state === 'selected' || state === 'available' || state === 'disabled';
}

export function AgentSkillsToolsSection({ data, localNotes = '', onNotesChange, onPatch }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [busy, setBusy] = useState('');

  if (!data) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--builder-text-muted)' }}>Loading skills and tools…</p>
      </section>
    );
  }

  const filters = ['All', 'Selected', 'Available', 'Blocked'];
  const sources = Array.from(
    new Set([...(data.skills ?? []).map((s) => s.source), ...(data.tools ?? []).map((t) => t.source)]),
  ).filter(Boolean);

  const filteredSkills =
    activeFilter === 'All'
      ? (data.skills ?? [])
      : activeFilter === 'Selected'
        ? (data.skills ?? []).filter((s) => s.state === 'selected')
        : activeFilter === 'Available'
          ? (data.skills ?? []).filter((s) => s.state === 'available')
          : (data.skills ?? []).filter((s) => s.state === 'blocked');

  const filteredTools =
    activeFilter === 'All'
      ? (data.tools ?? [])
      : activeFilter === 'Selected'
        ? (data.tools ?? []).filter((t) => t.state === 'selected')
        : activeFilter === 'Available'
          ? (data.tools ?? []).filter((t) => t.state === 'available')
          : (data.tools ?? []).filter((t) => t.state === 'blocked');

  const handleSkillToggle = async (id: string, state: string) => {
    if (!canToggle(state)) return;
    setBusy(id);
    try {
      await onPatch({ skills: state === 'selected' ? { deselect: [id] } : { select: [id] } });
    } finally {
      setBusy('');
    }
  };

  const handleToolToggle = async (id: string, state: string) => {
    if (!canToggle(state)) return;
    setBusy(id);
    try {
      await onPatch({ tools: state === 'selected' ? { deselect: [id] } : { select: [id] } });
    } finally {
      setBusy('');
    }
  };

  const items = [...filteredSkills, ...filteredTools];

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              border: `1px solid ${activeFilter === f ? 'var(--builder-border-accent)' : 'var(--builder-border-color)'}`,
              background: activeFilter === f ? 'var(--builder-accent-dim)' : 'transparent',
              color: activeFilter === f ? 'var(--builder-text-accent)' : 'var(--builder-text-secondary)',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Skills and Tools list */}
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                opacity: item.state === 'blocked' ? 0.45 : 1,
              }}
            >
              {/* Checkbox */}
              <div
                onClick={() => {
                  if (item.type === 'skill') {
                    handleSkillToggle(item.id, item.state);
                  } else {
                    handleToolToggle(item.id, item.state);
                  }
                }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  flexShrink: 0,
                  marginTop: 2,
                  background: item.state === 'selected' ? 'var(--builder-accent)' : 'transparent',
                  border: `1.5px solid ${
                    item.state === 'selected' ? 'var(--builder-accent)' : 'rgba(255,255,255,0.15)'
                  }`,
                  cursor: canToggle(item.state) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.state === 'selected' && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--builder-text-primary)' }}>
                    {item.name}
                  </span>
                  {item.type && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--builder-text-muted)',
                      }}
                    >
                      {item.type}
                    </span>
                  )}
                  <SourceBadge source={(item.source as 'profile' | 'agency' | 'workspace' | 'global' | 'local') || 'global'} />
                </div>
                {item.description && (
                  <div style={{ fontSize: 12, color: 'var(--builder-text-muted)', marginTop: 3 }}>
                    {item.description}
                  </div>
                )}
                {item.blockedReason && (
                  <div style={{ fontSize: 11, color: 'var(--builder-status-err)', marginTop: 3 }}>
                    Not available: {item.blockedReason}.{' '}
                    <button
                      style={{
                        color: 'var(--builder-text-accent)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: 0,
                      }}
                    >
                      → Open Settings › Skills
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--builder-text-disabled)' }}>
          <div style={{ fontSize: 20, marginBottom: 12 }}>○</div>
          <div style={{ fontSize: 14, color: 'var(--builder-text-muted)', marginBottom: 8 }}>
            No skills or tools enabled for this scope.
          </div>
          <div style={{ fontSize: 12, marginBottom: 16 }}>
            Skills and tools must be enabled at the agency or workspace level first.
          </div>
          {['→ Open Profiles Hub', '→ Settings › Skills', '→ Settings › Tools / Plugins'].map((link) => (
            <div key={link} style={{ marginBottom: 6 }}>
              <button
                style={{
                  color: 'var(--builder-text-accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {link}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Effective skills */}
      {data.effective && data.effective.skills.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--builder-text-muted)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            EFFECTIVE SKILLS
          </div>
          <div style={{ fontSize: 11, color: 'var(--builder-text-disabled)', marginBottom: 10 }}>
            Skills this agent will actually receive after inheritance and overrides.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.effective.skills.map((s) => (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'var(--builder-bg-tertiary)',
                  border: '1px solid var(--builder-border-color)',
                  fontSize: 12,
                  color: 'var(--builder-text-secondary)',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Tool Notes */}
      <FieldWrapper label="LOCAL TOOL NOTES" helper="Environment-specific notes: device names, SSH aliases, TTS voices.">
        <textarea
          style={{
            width: '100%',
            background: 'var(--builder-bg-secondary)',
            border: '1px solid var(--builder-border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--builder-text-primary)',
            outline: 'none',
            transition: 'var(--transition)',
            minHeight: 100,
            resize: 'vertical',
            lineHeight: 1.6,
          }}
          value={localNotes}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder={'### Cameras\n- living-room → Main area\n\n### SSH\n- home-server → 192.168.1.100'}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-accent)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--builder-border-color)'; }}
        />
      </FieldWrapper>
    </section>
  );
}
