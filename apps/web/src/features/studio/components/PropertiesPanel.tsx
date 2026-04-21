import { useState, type CSSProperties, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

import type { AgentSpec, DeployPreview, FlowNode, SkillSpec } from '../../../lib/types';
import { NodeFormRegistry } from './NodeFormRegistry';

interface PropertiesPanelProps {
  diagnostics: string[];
  deployPreview: DeployPreview | null;
  sessions: unknown[];
  selectedNodeId: string | null;
  selectedNode: FlowNode | null;
  agents: AgentSpec[];
  skills: SkillSpec[];
}

type InspectorTab = 'properties' | 'test' | 'diff';
type DiffStatus = 'added' | 'updated' | 'deleted' | 'unchanged';

const STATUS_STYLE: Record<DiffStatus, { color: string; bg: string; prefix: string }> = {
  added: { color: 'var(--color-success)', bg: 'rgba(34,197,94,0.08)', prefix: '+' },
  updated: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', prefix: '~' },
  deleted: { color: 'var(--color-error)', bg: 'rgba(239,68,68,0.08)', prefix: '-' },
  unchanged: { color: 'var(--text-muted)', bg: 'transparent', prefix: '.' },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}


function SectionBlock({ title, children, compact = false }: { title: string; children: ReactNode; compact?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--shell-chip-border)',
        background: 'var(--shell-chip-bg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: compact ? '8px 12px' : '10px 14px',
          borderBottom: '1px solid var(--shell-chip-border)',
          background: 'color-mix(in srgb, var(--shell-chip-bg) 78%, transparent)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ padding: compact ? '10px 12px' : '10px 14px' }}>{children}</div>
    </div>
  );
}

function EmptyInspectorState() {
  return (
    <div
      style={{
        border: '1px dashed var(--shell-chip-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 14px',
        color: 'var(--text-muted)',
        fontSize: 12,
      }}
    >
      Select a node on the canvas to inspect it
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
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties');

  function renderPropertiesTab() {
    if (!selectedNodeId || !selectedNode) {
      return <EmptyInspectorState />;
    }

    const nodeTypeLabel = selectedNode.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <SectionBlock title={nodeTypeLabel} compact>
          <NodeFormRegistry node={selectedNode} agents={agents} skills={skills} />
        </SectionBlock>
      </div>
    );
  }

  function renderTestTab() {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <SectionBlock
          title="Compiler Diagnostics"
          compact
        >
          {diagnostics.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-success)' }}>
              <CheckCircle size={13} />
              No issues found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {diagnostics.map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 12,
                    color: '#F59E0B',
                    background: 'rgba(245,158,11,0.08)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={12} />
                  {item}
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        <SectionBlock title="Runtime Sessions" compact>
          {sessions.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No active sessions</p>
          ) : (
            <div style={{ display: 'grid', gap: 4 }}>
              {sessions.map((session, index) => {
                const current = asRecord(session);
                const sid = typeof current?.id === 'string' ? current.id.slice(0, 12) : `sess-${index}`;
                const aid = typeof current?.agentId === 'string' ? current.agentId : 'Unknown';
                return (
                  <div
                    key={`${sid}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--shell-chip-bg)',
                    }}
                  >
                    <code style={{ fontSize: 11, color: 'var(--text-primary)' }}>{sid}</code>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{aid}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionBlock>
      </div>
    );
  }

  function renderDiffTab() {
    return (
      <SectionBlock title="Deploy Diff" compact>
        {!deployPreview ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Run Preview Diff to see changes</p>
        ) : deployPreview.diff.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nothing to deploy</p>
        ) : (
          <div style={{ display: 'grid', gap: 4 }}>
            {deployPreview.diff.map((item) => {
              const style = STATUS_STYLE[item.status as DiffStatus] ?? STATUS_STYLE.unchanged;
              return (
                <div
                  key={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: style.color,
                    background: style.bg,
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                  }}
                >
                  <span style={{ fontWeight: 700, width: 12, textAlign: 'center', flexShrink: 0 }}>{style.prefix}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionBlock>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--shell-panel-bg)',
        borderLeft: '1px solid var(--shell-panel-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--shell-panel-border)', display: 'grid', gap: 10 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          Inspector
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
          {(['properties', 'test', 'diff'] as InspectorTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--shell-chip-border)',
                padding: '6px 8px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                background: activeTab === tab ? 'var(--color-primary-soft)' : 'var(--shell-chip-bg)',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'properties' && renderPropertiesTab()}
        {activeTab === 'test' && renderTestTab()}
        {activeTab === 'diff' && renderDiffTab()}
      </div>
    </div>
  );
}

function actionButtonStyle(): CSSProperties {
  return {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--shell-chip-border)',
    background: 'var(--shell-chip-bg)',
    color: 'var(--text-primary)',
    fontSize: 11,
    fontWeight: 600,
    padding: '6px 8px',
    cursor: 'pointer',
    width: 'fit-content',
  };
}

function selectStyle(): CSSProperties {
  return {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--shell-chip-border)',
    background: 'var(--shell-chip-bg)',
    color: 'var(--input-text)',
    fontSize: 12,
    padding: '6px 8px',
  };
}

