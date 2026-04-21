import type { CSSProperties } from 'react';

import type { DashboardConnectionsDto } from '../../../../lib/types';

export function ConnectionsSurface({ data }: { data: DashboardConnectionsDto }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Connections</h2>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Nodes: {data.nodes.length} · Edges: {data.dependencySummary.totalEdges} · Connected: {data.dependencySummary.connectedEdges}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {data.edges.map((edge) => (
          <div key={edge.id} style={edgeStyle}>
            <strong>{edge.from.level}:{edge.from.id}</strong> → <strong>{edge.to.level}:{edge.to.id}</strong>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              state: {edge.state} · direction: {edge.direction}
            </div>
          </div>
        ))}
      </div>

      <div style={metaGrid}>
        <Mini label="Routing rules" value={String(data.routingRules.length)} />
        <Mini label="Channel bindings" value={String(data.channelBindings.length)} />
        <Mini label="Hook bindings" value={String(data.hookBindings.length)} />
      </div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniStyle}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>{value}</div>
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

const edgeStyle: CSSProperties = {
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

const miniStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 'var(--text-lg)' };
