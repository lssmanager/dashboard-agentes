import type { CSSProperties } from 'react';
import type { DashboardOverviewDto } from '../../../../lib/types';

export function OverviewSurface({ data }: { data: DashboardOverviewDto }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Overview</h2>
      <div style={grid4}>
        <Stat label="Departments" value={data.kpis.departments} />
        <Stat label="Workspaces" value={data.kpis.workspaces} />
        <Stat label="Agents" value={data.kpis.agents} />
        <Stat label="Subagents" value={data.kpis.subagents} />
      </div>
      <div style={grid4}>
        <Stat label={`Sessions (${data.sessionsSummary.mode})`} value={data.sessionsSummary.total} />
        <Stat label={`Runs (${data.runsSummary.mode})`} value={data.runsSummary.total} />
        <Stat label="Channels" value={data.channelsSummary.totalBindings} />
        <Stat label="Hooks" value={data.hooksCoverage.enabledHooks} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Runtime: {data.runtimeHealth.ok ? 'healthy' : 'degraded'} · Supported topology actions: {data.runtimeHealth.supportedTopologyActions}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 24, fontWeight: 800 }}>{value}</div>
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

const cardStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 12,
};

const grid4: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
  gap: 10,
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 'var(--text-lg)' };

