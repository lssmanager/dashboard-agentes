import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import {
  bindProfile,
  getDashboardConnections,
  getDashboardInspector,
  getDashboardOperations,
  getDashboardOverview,
  getEffectiveProfile,
  saveProfileOverride,
  sendRuntimeCommand,
  unbindProfile,
} from '../../../lib/api';
import { useHierarchy } from '../../../lib/HierarchyContext';
import { SCOPE_VIEW_REGISTRY } from '../../../lib/ScopeViewRegistry';
import { buildStudioHref } from '../../../lib/studioRouting';
import type {
  AgencyBuilderTab,
  CanonicalNodeLevel,
  DashboardConnectionsDto,
  DashboardInspectorDto,
  DashboardOperationsDto,
  DashboardOverviewDto,
  EffectiveProfileDto,
  TopologyActionResult,
  TopologyRuntimeAction,
} from '../../../lib/types';
import { useStudioState } from '../../../lib/StudioStateContext';
import { AdminSettingsPanel } from '../../studio/components/admin/AdminSettingsPanel';
import { ConnectionsSurface } from '../../studio/components/admin/ConnectionsSurface';
import { OperationsSurface } from '../../studio/components/admin/OperationsSurface';
import { OverviewSurface } from '../../studio/components/admin/OverviewSurface';
import { ProfileScopeTab } from '../../studio/components/admin/ProfileScopeTab';
import { RightInspectorPanel } from '../../studio/components/admin/RightInspectorPanel';
import { SessionsSurface } from '../../studio/components/admin/SessionsSurface';

const TAB_LABEL: Record<AgencyBuilderTab, string> = {
  overview: 'Overview',
  connections: 'Connections',
  operations: 'Operations',
  sessions: 'Sessions',
  settings: 'Settings',
  profile: 'Profile',
  topology: 'Topology',
  structure: 'Structure',
  routing: 'Routing',
  hooks: 'Hooks',
  versions: 'Versions',
};

function parseTab(value: string | null): AgencyBuilderTab | null {
  if (
    value === 'overview' ||
    value === 'connections' ||
    value === 'operations' ||
    value === 'sessions' ||
    value === 'settings' ||
    value === 'profile' ||
    value === 'topology' ||
    value === 'structure' ||
    value === 'routing' ||
    value === 'hooks' ||
    value === 'versions'
  ) {
    return value;
  }
  return null;
}

function getEntityLevel(level?: string): CanonicalNodeLevel {
  if (level === 'agency' || level === 'department' || level === 'workspace' || level === 'agent' || level === 'subagent') {
    return level;
  }
  return 'agency';
}

export default function AdministrationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useStudioState();
  const { selectedNode, selectedLineage, setBuilderTab } = useHierarchy();

  const entityLevel = getEntityLevel(selectedNode?.level);
  const entityId = selectedNode?.id ?? selectedLineage[0]?.id ?? 'agency-default';
  const viewConfig = SCOPE_VIEW_REGISTRY[entityLevel];

  const tabs = viewConfig.adminTabs;
  const activeFromQuery = parseTab(searchParams.get('tab'));
  const activeTab = activeFromQuery && tabs.includes(activeFromQuery) ? activeFromQuery : tabs[0];

  const [overview, setOverview] = useState<DashboardOverviewDto | null>(null);
  const [connections, setConnections] = useState<DashboardConnectionsDto | null>(null);
  const [operations, setOperations] = useState<DashboardOperationsDto | null>(null);
  const [inspector, setInspector] = useState<DashboardInspectorDto | null>(null);
  const [profile, setProfile] = useState<EffectiveProfileDto | null>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [runtimeActionBusy, setRuntimeActionBusy] = useState<TopologyRuntimeAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<Pick<TopologyActionResult, 'status' | 'message' | 'action'> | null>(null);

  const contextLabel = selectedLineage.map((item) => item.label).join(' / ');
  const profileCatalog = useMemo(() => state.profiles ?? [], [state.profiles]);

  useEffect(() => {
    if (activeTab !== activeFromQuery) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('tab', activeTab);
          return next;
        },
        { replace: true },
      );
    }

    setBuilderTab(activeTab);
  }, [activeTab, activeFromQuery, setBuilderTab, setSearchParams]);

  async function loadProjections() {
    setLoading(true);
    setError(null);

    try {
      const [nextOverview, nextConnections, nextOperations, nextInspector] = await Promise.all([
        getDashboardOverview(entityLevel, entityId),
        getDashboardConnections(entityLevel, entityId),
        getDashboardOperations(entityLevel, entityId),
        getDashboardInspector(entityLevel, entityId),
      ]);

      setOverview(nextOverview);
      setConnections(nextConnections);
      setOperations(nextOperations);
      setInspector(nextInspector);

      if (viewConfig.showProfileTab) {
        setProfile(await getEffectiveProfile(entityLevel, entityId));
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard projections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjections();
  }, [entityLevel, entityId]);

  async function refreshInspectorAndProfile() {
    setInspector(await getDashboardInspector(entityLevel, entityId));
    if (viewConfig.showProfileTab) {
      setProfile(await getEffectiveProfile(entityLevel, entityId));
    }
  }

  async function handleBindProfile(profileId: string) {
    if (!profileId) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await bindProfile(entityLevel, entityId, profileId);
      await refreshInspectorAndProfile();
      setNotice('Profile bound successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bind profile');
    } finally {
      setBusy(false);
    }
  }

  async function handleUnbindProfile() {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await unbindProfile(entityLevel, entityId);
      await refreshInspectorAndProfile();
      setNotice('Profile unbound successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unbind profile');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveOverride(payload: { model?: string; skills?: string[] }) {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await saveProfileOverride(entityLevel, entityId, payload);
      await refreshInspectorAndProfile();
      setNotice('Profile override saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save override');
    } finally {
      setBusy(false);
    }
  }

  async function handleRuntimeAction(action: TopologyRuntimeAction) {
    setRuntimeActionBusy(action);
    setError(null);
    setNotice(null);
    setActionResult(null);

    try {
      const response = await sendRuntimeCommand(entityLevel, entityId, action);
      setActionResult({ status: response.result.status, message: response.result.message, action });
      setOperations(await getDashboardOperations(entityLevel, entityId));
      setOverview(await getDashboardOverview(entityLevel, entityId));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed runtime action: ${action}`);
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  return (
    <div style={{ maxWidth: 1520, margin: '0 auto', display: 'grid', gap: 14 }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Administration Environment
            </div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>Administration</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
              Scope: {contextLabel || `${entityLevel}:${entityId}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() =>
                navigate(
                  buildStudioHref({
                    surface: 'workspace-studio',
                    nodeKey: selectedNode?.key ?? selectedLineage[selectedLineage.length - 1]?.key ?? null,
                  }),
                )
              }
              disabled={!viewConfig.canEnterStudio}
              style={{
                ...buttonStyle,
                opacity: viewConfig.canEnterStudio ? 1 : 0.6,
                cursor: viewConfig.canEnterStudio ? 'pointer' : 'not-allowed',
              }}
            >
              Open Studio
            </button>
            <button type="button" onClick={() => void loadProjections()} style={buttonStyle} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))`, gap: 8 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setSearchParams(
                  (current) => {
                    const next = new URLSearchParams(current);
                    next.set('tab', tab);
                    return next;
                  },
                  { replace: true },
                );
              }}
              style={{
                ...buttonStyle,
                background: activeTab === tab ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-primary)',
              }}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 14 }} className="studio-responsive-two-col">
        <div style={{ display: 'grid', gap: 14 }}>
          {activeTab === 'overview' && overview && <OverviewSurface data={overview} />}
          {activeTab === 'connections' && connections && <ConnectionsSurface data={connections} />}
          {activeTab === 'operations' && operations && (
            <OperationsSurface
              data={operations}
              busyAction={runtimeActionBusy}
              capabilities={overview?.capabilities}
              onRuntimeAction={(action) => void handleRuntimeAction(action)}
            />
          )}
          {activeTab === 'sessions' && overview && operations && <SessionsSurface overview={overview} operations={operations} />}

          {activeTab === 'settings' && (
            <section style={panelStyle}>
              <AdminSettingsPanel settingsScope={viewConfig.settingsScope} />
            </section>
          )}

          {activeTab === 'profile' && profile && (
            <ProfileScopeTab
              profile={profile}
              profiles={profileCatalog}
              busy={busy}
              onBind={(profileId) => void handleBindProfile(profileId)}
              onUnbind={() => void handleUnbindProfile()}
              onSaveOverride={(payload) => void handleSaveOverride(payload)}
            />
          )}
        </div>

        <RightInspectorPanel data={inspector} />
      </section>

      {notice && <div style={noticeStyle}>{notice}</div>}
      {actionResult && (
        <div
          style={{
            ...noticeStyle,
            background:
              actionResult.status === 'applied'
                ? 'rgba(16,185,129,0.15)'
                : actionResult.status === 'unsupported_by_runtime'
                  ? 'rgba(245,158,11,0.15)'
                  : 'rgba(239,68,68,0.15)',
            borderLeft: `3px solid ${
              actionResult.status === 'applied'
                ? 'var(--tone-success-text)'
                : actionResult.status === 'unsupported_by_runtime'
                  ? 'var(--tone-warning-text)'
                  : 'var(--tone-danger-text)'
            }`,
          }}
        >
          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>
            {actionResult.status === 'applied' ? 'Applied' : actionResult.status === 'unsupported_by_runtime' ? 'Unsupported' : 'Rejected'}
          </span>
          {' — '}
          {actionResult.action}: {actionResult.message}
        </div>
      )}
      {error && (
        <div style={{ ...noticeStyle, background: 'rgba(239,68,68,0.15)' }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}
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

const noticeStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  background: 'rgba(16,185,129,0.15)',
  padding: 10,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};
