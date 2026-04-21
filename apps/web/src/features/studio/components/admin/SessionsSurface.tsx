import type { CSSProperties } from 'react';

import type { DashboardOperationsDto, DashboardOverviewDto } from '../../../../lib/types';

export function SessionsSurface({
  overview,
  operations,
}: {
  overview: DashboardOverviewDto;
  operations: DashboardOperationsDto;
}) {
  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={titleStyle}>Sessions</h2>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Mode: <strong>{overview.sessionsSummary.mode}</strong> | total {overview.sessionsSummary.total}
        </div>
      </div>

      <div style={metaGrid}>
        <Metric label="Active" value={String(overview.sessionsSummary.active)} />
        <Metric label="Paused" value={String(overview.sessionsSummary.paused)} />
        <Metric label="Recent items" value={String(operations.recentSessions.length)} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {operations.recentSessions.length === 0 ? (
          <div style={itemStyle}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No sessions in this scope.</div>
          </div>
        ) : (
          operations.recentSessions.map((session) => (
            <div key={session.id} style={itemStyle}>
              <strong>{session.id}</strong>
              <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                status: {session.status} | channel: {session.channel ?? 'n/a'} | last event: {session.lastEventAt ?? 'n/a'}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700 }}>{value}</div>
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

const titleStyle: CSSProperties = { margin: 0, fontSize: 'var(--text-lg)' };

const itemStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
};

const metaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
  gap: 10,
};

const metricStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
};
