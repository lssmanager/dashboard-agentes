import type { CSSProperties } from 'react';

import type { DashboardOperationsDto, TopologyRuntimeAction } from '../../../../lib/types';

export function OperationsSurface({
  data,
  busyAction,
  onRuntimeAction,
}: {
  data: DashboardOperationsDto;
  busyAction: TopologyRuntimeAction | null;
  onRuntimeAction: (action: TopologyRuntimeAction) => void;
}) {
  const runtimeActions: TopologyRuntimeAction[] = ['pause', 'reactivate', 'redirect', 'continue'];

  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={titleStyle}>Operations</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {runtimeActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onRuntimeAction(action)}
              disabled={busyAction !== null}
              style={buttonStyle}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {data.pendingActions.map((item) => (
          <div key={item.id} style={itemStyle}>
            <strong>{item.type}</strong>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>{item.message}</div>
          </div>
        ))}
      </div>

      <div style={metaGrid}>
        <Metric label="Recent runs" value={String(data.recentRuns.length)} />
        <Metric label="Recent sessions" value={String(data.recentSessions.length)} />
        <Metric label="Approval queue" value={String(data.approvalQueue.length)} />
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
