import type { CSSProperties, ReactNode } from 'react';

import type { DashboardInspectorDto } from '../../../../lib/types';

export function RightInspectorPanel({ data }: { data: DashboardInspectorDto | null }) {
  return (
    <aside style={panelStyle}>
      <h3 style={{ margin: 0, fontSize: 'var(--text-md)' }}>Inspector</h3>
      {data ? (
        <>
          <Section title="Entity Metadata">
            <Row label="Name" value={data.entityMeta.name} />
            <Row label="Level" value={data.entityMeta.level} />
            <Row label="Owner" value={data.entityMeta.owner ?? 'n/a'} />
            <Row label="Tags" value={data.entityMeta.tags.join(', ') || 'None'} />
          </Section>

          <Section title="Effective Config Summary">
            <Row label="Model" value={data.effectiveConfigSummary.model ?? 'None'} />
            <Row label="Skills" value={data.effectiveConfigSummary.skills.join(', ') || 'None'} />
            <Row label="Policies" value={data.effectiveConfigSummary.policies.join(', ') || 'None'} />
            <Row label="Routing" value={String(data.effectiveConfigSummary.routingRules)} />
          </Section>

          <Section title="Assigned Profiles">
            {data.assignedProfiles.length === 0 ? (
              <EmptyText text="No profiles assigned in this scope." />
            ) : (
              data.assignedProfiles.map((item) => <BindingRow key={item.id} name={item.name} source={item.source} />)
            )}
          </Section>

          <Section title="Tools Bindings">
            {data.toolBindings.length === 0 ? (
              <EmptyText text="No tools available for this scope." />
            ) : (
              data.toolBindings
                .slice(0, 8)
                .map((item) => <BindingRow key={item.id} name={item.name} source={item.source} enabled={item.enabled} />)
            )}
          </Section>

          <Section title="Skills Bindings">
            {data.skillBindings.length === 0 ? (
              <EmptyText text="No skills available for this scope." />
            ) : (
              data.skillBindings
                .slice(0, 8)
                .map((item) => <BindingRow key={item.id} name={item.name} source={item.source} enabled={item.enabled} />)
            )}
          </Section>

          <Section title="Recent Changes">
            {data.recentChanges.length === 0 ? (
              <EmptyText text="No recent changes." />
            ) : (
              data.recentChanges.slice(0, 6).map((item, index) => (
                <div key={`${item.at}-${index}`} style={changeItemStyle}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.at}</div>
                </div>
              ))
            )}
          </Section>
        </>
      ) : (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Loading inspector...</p>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h4 style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{title}</h4>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 8 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{value}</span>
    </div>
  );
}

function BindingRow({ name, source, enabled }: { name: string; source: string; enabled?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--text-primary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ color: enabled === false ? 'var(--text-muted)' : 'var(--color-primary)', fontSize: 11 }}>
        {source} {enabled === false ? 'disabled' : 'enabled'}
      </span>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{text}</div>;
}

const panelStyle: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  padding: 16,
  display: 'grid',
  gap: 12,
};

const sectionStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
  display: 'grid',
  gap: 8,
};

const changeItemStyle: CSSProperties = {
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-primary)',
  padding: 8,
  display: 'grid',
  gap: 4,
};
