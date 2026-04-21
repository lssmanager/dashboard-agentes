import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { BookOpen, Hammer, Layers3, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { createWorkspace } from '../../../lib/api';
import { useStudioState } from '../../../lib/StudioStateContext';
import { PageHeader, Toast } from '../../../components';

type HubTab = 'profiles' | 'skills' | 'tools' | 'templates';

const HUB_TABS: Array<{ id: HubTab; label: string }> = [
  { id: 'profiles', label: 'Profiles' },
  { id: 'skills', label: 'Skills' },
  { id: 'tools', label: 'Tools' },
  { id: 'templates', label: 'Templates / Presets' },
];

export default function ProfilesPage() {
  const { state, refresh } = useStudioState();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<HubTab>('profiles');
  const [selectedProfileId, setSelectedProfileId] = useState(state.profiles[0]?.id ?? '');
  const [workspaceName, setWorkspaceName] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedProfile = useMemo(
    () => state.profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [state.profiles, selectedProfileId],
  );

  async function handleCreateWorkspaceFromProfile() {
    if (!selectedProfile || !workspaceName.trim()) return;

    setBusy(true);
    try {
      await createWorkspace({ name: workspaceName.trim(), profileId: selectedProfile.id });
      await refresh();
      setToast({ type: 'success', message: 'Workspace created from selected profile' });
      navigate('/administration?tab=overview');
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create workspace',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gap: 14 }}>
      <PageHeader
        title="Profiles Hub"
        description="Global reusable catalog for profiles, skills, tools and templates."
        icon={BookOpen}
      />

      <section style={panelStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HUB_TABS.length}, minmax(0,1fr))`, gap: 8 }}>
          {HUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-primary)',
                background: activeTab === tab.id ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 700,
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'profiles' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 14 }} className="studio-responsive-two-col">
          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Profile Catalog</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              {state.profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedProfileId(profile.id)}
                  style={{
                    textAlign: 'left',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    background: selectedProfileId === profile.id ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                    padding: 12,
                    cursor: 'pointer',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>{profile.name}</strong>
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{profile.description}</div>
                </button>
              ))}
            </div>
          </div>

          <aside style={panelStyle}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-md)' }}>Selected Profile</h3>
            {selectedProfile ? (
              <>
                <MetaRow label="Name" value={selectedProfile.name} />
                <MetaRow label="Default model" value={selectedProfile.defaultModel ?? 'None'} />
                <MetaRow label="Skills" value={(selectedProfile.defaultSkills ?? []).join(', ') || 'None'} />
                <MetaRow label="Routines" value={(selectedProfile.routines ?? []).join(', ') || 'None'} />

                <label style={labelStyle}>Create workspace from this profile</label>
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="Workspace name"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => void handleCreateWorkspaceFromProfile()}
                  disabled={busy || !workspaceName.trim()}
                  style={actionBtnStyle('var(--btn-primary-bg)', 'var(--btn-primary-text)')}
                >
                  {busy ? 'Creating...' : 'Use profile'}
                </button>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>No profile selected.</p>
            )}
          </aside>
        </section>
      )}

      {activeTab === 'skills' && (
        <section style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Skills</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {state.skills.map((skill) => (
              <div key={skill.id} style={itemCardStyle}>
                <strong>{skill.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{skill.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'tools' && (
        <section style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Tools</h2>
          <div style={{ ...itemCardStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hammer size={14} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Tools catalog is managed centrally through canonical studio state and surfaced in Administration inspector.
            </span>
          </div>
        </section>
      )}

      {activeTab === 'templates' && (
        <section style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Templates / Presets</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            <div style={itemCardStyle}><Layers3 size={14} /> Runtime defaults</div>
            <div style={itemCardStyle}><Sparkles size={14} /> Profile starter kits</div>
            <div style={itemCardStyle}><BookOpen size={14} /> Scoped behavior templates</div>
          </div>
        </section>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
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

const itemCardStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 12,
  display: 'grid',
  gap: 6,
};

function actionBtnStyle(bg = 'var(--bg-secondary)', color = 'var(--text-primary)'): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-primary)',
    background: bg,
    color,
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
  };
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--input-border)',
  background: 'var(--input-bg)',
  color: 'var(--input-text)',
  padding: '10px 12px',
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--text-secondary)',
};

