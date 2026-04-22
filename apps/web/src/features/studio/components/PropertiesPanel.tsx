import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, FlaskConical, GitCompare, Lock, RadioTower, SquareMousePointer } from 'lucide-react';

import type { AgentSpec, DeployPreview, FlowNode, SkillSpec } from '../../../lib/types';

interface PropertiesPanelProps {
  diagnostics: string[];
  deployPreview: DeployPreview | null;
  sessions: unknown[];
  selectedNodeId: string | null;
  selectedNode: FlowNode | null;
  agents: AgentSpec[];
  skills: SkillSpec[];
  runtimeOk: boolean;
}

type InspectorTab = 'properties' | 'test' | 'diff';
type DiffStatus = 'added' | 'updated' | 'deleted' | 'unchanged';

const STATUS_STYLE: Record<DiffStatus, { color: string; bg: string; prefix: string }> = {
  added: { color: 'var(--tone-success-text)', bg: 'var(--tone-success-bg)', prefix: '+' },
  updated: { color: 'var(--tone-warning-text)', bg: 'var(--tone-warning-bg)', prefix: '~' },
  deleted: { color: 'var(--tone-danger-text)', bg: 'var(--tone-danger-bg)', prefix: '-' },
  unchanged: { color: 'var(--text-muted)', bg: 'var(--bg-secondary)', prefix: '.' },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

function inferNodeLabel(node: FlowNode | null): string | null {
  if (!node) return null;
  const config = asRecord(node.config);
  const fromConfig = config && typeof config.name === 'string' ? config.name : null;
  return fromConfig ?? node.id;
}

function SummaryCard({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {icon}
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 900, color: 'var(--text-primary)' }}>{title}</h4>
      </div>
      {children}
    </section>
  );
}

function KvRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={kvRowStyle}>
      <span style={kvLabelStyle}>{label}</span>
      <span style={{ color: 'var(--text-primary)', textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function ReadOnlyState({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ display: 'grid', gap: 10, padding: '20px 14px', textAlign: 'center' }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'var(--color-primary-soft)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 26%, transparent)',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto',
          color: 'var(--color-primary)',
        }}
      >
        <SquareMousePointer size={18} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>{description}</div>
      </div>
    </div>
  );
}

export function PropertiesPanel({
  diagnostics,
  deployPreview,
  sessions,
  selectedNodeId,
  selectedNode,
  agents,
  skills,
  runtimeOk,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties');

  const config = useMemo(() => asRecord(selectedNode?.config), [selectedNode]);
  const selectedNodeLabel = inferNodeLabel(selectedNode);

  const configuredAgentId = config && typeof config.agentId === 'string' ? config.agentId : null;
  const linkedAgent = useMemo(() => {
    if (!selectedNode) return null;
    if (configuredAgentId) return agents.find((agent) => agent.id === configuredAgentId) ?? null;
    if (selectedNode.type === 'agent' || selectedNode.type === 'subagent') {
      const matchingKind = selectedNode.type === 'subagent' ? 'subagent' : 'agent';
      return agents.find((agent) => agent.kind === matchingKind) ?? null;
    }
    return null;
  }, [agents, configuredAgentId, selectedNode]);

  const declaredSkills = useMemo(() => {
    const refs = toStringArray(config?.skills).concat(toStringArray(config?.skillRefs));
    if (refs.length > 0) return refs;
    if (linkedAgent?.skillRefs?.length) return linkedAgent.skillRefs;
    return [];
  }, [config, linkedAgent]);

  const knownSkillSet = useMemo(() => new Set(skills.map((skill) => skill.name)), [skills]);
  const skillCoverage = declaredSkills.filter((skill) => knownSkillSet.has(skill));

  const declaredTools = useMemo(() => {
    const refs = toStringArray(config?.tools).concat(toStringArray(config?.toolRefs));
    if (refs.length > 0) return refs;
    return linkedAgent?.permissions?.tools ?? [];
  }, [config, linkedAgent]);

  const runtimeSessions = useMemo(
    () =>
      sessions.map((session) => asRecord(session)).filter((session): session is Record<string, unknown> => Boolean(session)),
    [sessions],
  );

  const nodeSessionMatches = useMemo(() => {
    if (!selectedNode) return [];
    const nodeLower = selectedNode.id.toLowerCase();
    const linkedAgentId = linkedAgent?.id;

    return runtimeSessions.filter((session) => {
      const nodeId = typeof session.nodeId === 'string' ? session.nodeId.toLowerCase() : '';
      const activeAgentId = typeof session.agentId === 'string' ? session.agentId : null;
      return nodeId === nodeLower || (linkedAgentId ? activeAgentId === linkedAgentId : false);
    });
  }, [linkedAgent?.id, runtimeSessions, selectedNode]);

  const diffStats = useMemo(() => {
    const source = deployPreview?.diff ?? [];
    return {
      total: source.length,
      added: source.filter((entry) => entry.status === 'added').length,
      updated: source.filter((entry) => entry.status === 'updated').length,
      deleted: source.filter((entry) => entry.status === 'deleted').length,
      unchanged: source.filter((entry) => entry.status === 'unchanged').length,
    };
  }, [deployPreview]);

  const selectedNodeDiffEntries = useMemo(() => {
    if (!deployPreview || !selectedNode) return [];
    const candidates = [selectedNode.id, selectedNodeLabel].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase());
    if (candidates.length === 0) return [];
    return deployPreview.diff.filter((entry) => candidates.some((candidate) => entry.path.toLowerCase().includes(candidate)));
  }, [deployPreview, selectedNode, selectedNodeLabel]);

  function renderPropertiesTab() {
    if (!selectedNodeId || !selectedNode) {
      return <ReadOnlyState title="No node selected" description="Select a canvas node to inspect identity, bindings, and runtime-ready configuration." />;
    }

    const purpose =
      (config && typeof config.purpose === 'string' ? config.purpose : undefined) ??
      (config && typeof config.description === 'string' ? config.description : undefined) ??
      linkedAgent?.description ??
      'No description declared.';

    const outputSummary = toStringArray(config?.outputs);
    const inputSummary = toStringArray(config?.inputs);

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <SummaryCard title="Selected Node" icon={<SquareMousePointer size={13} style={{ color: 'var(--color-primary)' }} />}>
          <KvRow label="Name" value={selectedNodeLabel ?? selectedNode.id} />
          <KvRow label="Type" value={String(selectedNode.type)} />
          <KvRow label="Node ID" value={<code style={monoTextStyle}>{selectedNode.id}</code>} />
        </SummaryCard>

        <SummaryCard title="Bindings" icon={<RadioTower size={13} style={{ color: 'var(--color-primary)' }} />}>
          <KvRow label="Linked Agent" value={linkedAgent ? linkedAgent.name : 'None'} />
          <KvRow label="Agent ID" value={linkedAgent ? <code style={monoTextStyle}>{linkedAgent.id}</code> : 'n/a'} />
          <KvRow label="Model" value={linkedAgent?.model ?? 'Inherited / none'} />
          <KvRow label="Workspace" value={linkedAgent?.workspaceId ?? 'n/a'} />
        </SummaryCard>

        <SummaryCard title="Node Contract" icon={<Lock size={13} style={{ color: 'var(--color-primary)' }} />}>
          <KvRow label="Purpose" value={purpose} />
          <KvRow label="Inputs" value={inputSummary.length > 0 ? inputSummary.join(', ') : 'None declared'} />
          <KvRow label="Outputs" value={outputSummary.length > 0 ? outputSummary.join(', ') : 'None declared'} />
          <KvRow label="Skills" value={declaredSkills.length > 0 ? `${declaredSkills.length} (${skillCoverage.length} in catalog)` : 'None'} />
          <KvRow label="Tools" value={declaredTools.length > 0 ? declaredTools.join(', ') : 'None'} />
        </SummaryCard>

        <SummaryCard title="Raw Config Snapshot">
          <pre style={rawBlockStyle}>{JSON.stringify(selectedNode.config ?? {}, null, 2)}</pre>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            Inspector content is read-only in this pass.
          </div>
        </SummaryCard>
      </div>
    );
  }

  function renderTestTab() {
    if (!selectedNode || !selectedNodeId) {
      return <ReadOnlyState title="Test context unavailable" description="Select a node to see diagnostics, runtime session matching, and execution readiness." />;
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <SummaryCard title="Execution Readiness" icon={<FlaskConical size={13} style={{ color: 'var(--color-primary)' }} />}>
          <KvRow label="Runtime" value={runtimeOk ? 'Online' : 'Offline'} />
          <KvRow label="Diagnostics" value={diagnostics.length === 0 ? 'Clean' : `${diagnostics.length} issue${diagnostics.length === 1 ? '' : 's'}`} />
          <KvRow label="Matched Sessions" value={String(nodeSessionMatches.length)} />
        </SummaryCard>

        <SummaryCard title="Compiler Diagnostics">
          {diagnostics.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tone-success-text)' }}>
              <CheckCircle2 size={13} />
              No compile diagnostics for current workspace.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {diagnostics.map((item) => (
                <div key={item} style={warnRowStyle}>
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>

        <SummaryCard title="Runtime Sessions (Node/Agent Match)">
          {!runtimeOk ? (
            <div style={{ fontSize: 12, color: 'var(--tone-warning-text)' }}>
              Runtime is offline. Session checks are read-only until runtime reconnects.
            </div>
          ) : nodeSessionMatches.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No active session matched this node or its linked agent.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {nodeSessionMatches.slice(0, 6).map((session, index) => {
                const sessionId = typeof session.id === 'string' ? session.id : `session-${index + 1}`;
                const status = typeof session.status === 'string' ? session.status : 'unknown';
                const channel = typeof session.channel === 'string' ? session.channel : 'n/a';
                return (
                  <div key={`${sessionId}-${index}`} style={sessionRowStyle}>
                    <code style={monoTextStyle}>{sessionId.slice(0, 18)}</code>
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                    <span style={{ fontWeight: 700 }}>{status}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>ch:{channel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SummaryCard>
      </div>
    );
  }

  function renderDiffTab() {
    if (!deployPreview) {
      return <ReadOnlyState title="Diff preview not loaded" description="Run Preview in Studio top actions to load deploy diff and node impact details." />;
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <SummaryCard title="Deploy Summary" icon={<GitCompare size={13} style={{ color: 'var(--color-primary)' }} />}>
          <KvRow label="Total files" value={diffStats.total} />
          <KvRow label="Added" value={diffStats.added} />
          <KvRow label="Updated" value={diffStats.updated} />
          <KvRow label="Deleted" value={diffStats.deleted} />
          <KvRow label="Unchanged" value={diffStats.unchanged} />
        </SummaryCard>

        <SummaryCard title="Node Impact">
          {!selectedNode ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a node to narrow diff impact.</div>
          ) : selectedNodeDiffEntries.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No diff entries directly reference node "{selectedNodeLabel ?? selectedNode.id}".
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {selectedNodeDiffEntries.map((entry) => {
                const style = STATUS_STYLE[entry.status as DiffStatus] ?? STATUS_STYLE.unchanged;
                return (
                  <div key={entry.path} style={{ ...diffRowStyle, color: style.color, background: style.bg }}>
                    <span style={{ width: 12, textAlign: 'center', fontWeight: 800, flexShrink: 0 }}>{style.prefix}</span>
                    <code style={{ ...monoTextStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.path}</code>
                  </div>
                );
              })}
            </div>
          )}
        </SummaryCard>

        <SummaryCard title="Preview Diagnostics">
          {deployPreview.diagnostics.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--tone-success-text)' }}>Preview diagnostics are clean.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {deployPreview.diagnostics.map((item) => (
                <div key={item} style={warnRowStyle}>
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>
      </div>
    );
  }

  const tabs: Array<{ id: InspectorTab; label: string; icon: ReactNode }> = [
    { id: 'properties', label: 'Properties', icon: <SquareMousePointer size={12} /> },
    { id: 'test', label: 'Test', icon: <FlaskConical size={12} /> },
    { id: 'diff', label: 'Diff', icon: <GitCompare size={12} /> },
  ];

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--shell-panel-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={headerStyle}>
        <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-muted)' }}>
          Inspector
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: selectedNodeLabel ? 'var(--text-primary)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {selectedNodeLabel ?? 'No node selected'}
          </div>
          {selectedNode && (
            <span style={{ ...typeBadgeStyle, textTransform: 'capitalize' }}>{String(selectedNode.type)}</span>
          )}
        </div>
      </div>

      <div style={tabShellStyle}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                border: 'none',
                borderRadius: 10,
                padding: '6px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                background: isActive ? 'var(--shell-chip-bg)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {activeTab === 'properties' && renderPropertiesTab()}
        {activeTab === 'test' && renderTestTab()}
        {activeTab === 'diff' && renderDiffTab()}
      </div>
    </div>
  );
}

const cardStyle: CSSProperties = {
  border: '1px solid var(--border-primary)',
  background: 'linear-gradient(180deg, var(--shell-chip-bg), var(--bg-primary, #fff))',
  borderRadius: 14,
  padding: 12,
};

const kvRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  padding: '7px 0',
  borderBottom: '1px solid var(--border-secondary)',
  fontSize: 12,
};

const kvLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  flexShrink: 0,
};

const monoTextStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--text-primary)',
};

const rawBlockStyle: CSSProperties = {
  margin: 0,
  borderRadius: 10,
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  padding: 10,
  maxHeight: 220,
  overflow: 'auto',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
};

const warnRowStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--tone-warning-text)',
  background: 'var(--tone-warning-bg)',
  borderRadius: 8,
  border: '1px solid var(--tone-warning-border)',
  padding: '6px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const sessionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 8px',
  borderRadius: 8,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  fontSize: 11,
  color: 'var(--text-primary)',
};

const diffRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 11,
};

const headerStyle: CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--border-primary)',
  display: 'grid',
  gap: 4,
  background: 'var(--shell-chip-bg)',
  flexShrink: 0,
};

const tabShellStyle: CSSProperties = {
  padding: '8px 14px',
  borderBottom: '1px solid var(--border-secondary)',
  background: 'var(--shell-chip-bg)',
  display: 'flex',
  gap: 4,
};

const typeBadgeStyle: CSSProperties = {
  borderRadius: 999,
  border: '1px solid var(--border-primary)',
  fontSize: 10,
  padding: '2px 8px',
  color: 'var(--text-primary)',
  background: 'var(--bg-secondary)',
  fontWeight: 700,
};
