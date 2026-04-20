import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RuntimeStatusBadge,
  StudioEmptyState,
  StudioHeroSection,
  StudioKpiCard,
  StudioPageShell,
  StudioSectionCard,
} from '../../../components/ui';

const CONSOLE_TABS = [
  { path: '/runs', label: 'Runs', matchPaths: ['/runs'] },
  { path: '/observability', label: 'Operations', matchPaths: ['/operations', '/observability'] },
  { path: '/diagnostics', label: 'Diagnostics', matchPaths: ['/diagnostics'] },
  { path: '/sessions', label: 'Sessions', matchPaths: ['/sessions'] },
  { path: '/hooks', label: 'Hooks', matchPaths: ['/hooks'] },
  { path: '/versions', label: 'Versions', matchPaths: ['/versions'] },
  { path: '/commands', label: 'Commands', matchPaths: ['/commands'] },
];

interface ObservabilityShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  runtimeOk: boolean;
  actions?: ReactNode;
  kpis?: ConsoleKpi[];
  children: ReactNode;
}

export interface ConsoleKpi {
  label: string;
  value: string | number;
  helper?: string;
  tone?: 'default' | 'success' | 'warning';
}

export function ObservabilityShell({
  title,
  description,
  icon: Icon,
  runtimeOk,
  actions,
  kpis,
  children,
}: ObservabilityShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <StudioPageShell maxWidth={1360}>
      <StudioHeroSection
        eyebrow="Operations Console"
        title={title}
        description={description}
        meta={
          <RuntimeStatusBadge
            status={runtimeOk ? 'online' : 'degraded'}
            label={runtimeOk ? 'runtime online' : 'runtime degraded'}
          />
        }
        actions={
          <>
            <button type="button" style={tabButtonStyle(true)}>
              <Icon size={14} />
              {title}
            </button>
            {actions}
          </>
        }
      />

      <StudioSectionCard title="Console Navigation" description="Unified operations surfaces">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CONSOLE_TABS.map((tab) => {
            const active = tab.matchPaths.some((matchPath) =>
              location.pathname === matchPath || location.pathname.startsWith(`${matchPath}/`)
            );
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigate(tab.path)}
                style={tabButtonStyle(active)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </StudioSectionCard>

      {kpis && kpis.length > 0 && (
        <section
          className="studio-responsive-four-col"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {kpis.map((kpi) => (
            <StudioKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              helper={kpi.helper}
              tone={kpi.tone ?? 'default'}
            />
          ))}
        </section>
      )}

      {children}
    </StudioPageShell>
  );
}

interface ConsolePanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ConsolePanel({ title, description, children }: ConsolePanelProps) {
  return (
    <StudioSectionCard title={title} description={description}>
      {children}
    </StudioSectionCard>
  );
}

interface ConsoleEmptyProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ConsoleEmpty({ title, description, actionLabel, onAction }: ConsoleEmptyProps) {
  return (
    <StudioEmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--border-primary)',
    background: active ? 'var(--color-primary-soft)' : 'var(--card-bg)',
    color: active ? 'var(--color-primary)' : 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
    cursor: 'pointer',
  };
}

export function consoleToolButtonStyle(active = false): CSSProperties {
  return {
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    borderColor: active ? 'var(--color-primary)' : 'var(--border-primary)',
    background: active ? 'var(--color-primary-soft)' : 'var(--card-bg)',
    color: active ? 'var(--color-primary)' : 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  };
}
