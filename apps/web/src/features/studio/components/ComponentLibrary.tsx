import { type DragEvent, type ReactNode, useState } from 'react';
import { Layers, Package, Workflow } from 'lucide-react';

import { NODE_TEMPLATES } from '../../canvas/lib/canvas-utils';
import type { FlowNodeType } from '../../../lib/types';
import { useStudioState } from '../../../lib/StudioStateContext';

const NODE_DESCRIPTIONS: Partial<Record<FlowNodeType, string>> = {
  trigger: 'Entry point and workflow inputs.',
  agent: 'Model, instructions, and tools.',
  subagent: 'Specialized delegation.',
  skill: 'Reusable capability module.',
  tool: 'External function or API call.',
  condition: 'Branch by condition or score.',
  handoff: 'Transfer to another agent.',
  loop: 'Iterate over a collection.',
  approval: 'Pause for human approval.',
  end: 'Final output and outcome.',
};

const CATEGORY_GROUPS: Array<{ name: string; types: FlowNodeType[] }> = [
  { name: 'Core', types: ['trigger', 'agent', 'subagent', 'end'] },
  { name: 'Catalog', types: ['skill', 'tool'] },
  { name: 'Logic', types: ['condition', 'handoff', 'loop', 'approval'] },
];

type LibraryTab = 'components' | 'agents' | 'flows';

const LIBRARY_TABS: Array<{ id: LibraryTab; label: string; icon: ReactNode }> = [
  { id: 'components', label: 'Components', icon: <Package size={12} /> },
  { id: 'agents', label: 'Agents', icon: <Layers size={12} /> },
  { id: 'flows', label: 'Flows', icon: <Workflow size={12} /> },
];

export function ComponentLibrary() {
  const [activeTab, setActiveTab] = useState<LibraryTab>('components');
  const [search, setSearch] = useState('');
  const { state } = useStudioState();

  function handleDragStart(event: DragEvent<HTMLDivElement>, type: FlowNodeType) {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.effectAllowed = 'move';
  }

  const searchLower = search.toLowerCase();

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--shell-panel-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* pane-head */}
      <div
        style={{
          height: 52,
          padding: '0 14px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: 'var(--shell-chip-bg)',
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)' }}>
          Explorer / Library
        </strong>
      </div>

      {/* pane-body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes, templates..."
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: 12,
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-primary, #fff)',
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
          }}
        />

        {/* segment tab control */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            border: '1px solid var(--border-primary)',
            borderRadius: 12,
            background: 'var(--bg-secondary)',
            flexShrink: 0,
          }}
        >
          {LIBRARY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  border: 'none',
                  borderRadius: 10,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: isActive ? 'var(--shell-chip-bg)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'background 0.14s ease, color 0.14s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Components tab */}
        {activeTab === 'components' && (
          <div style={{ display: 'grid', gap: 14 }}>
            {CATEGORY_GROUPS.map((group) => {
              const items = NODE_TEMPLATES.filter(
                (template) =>
                  group.types.includes(template.type) &&
                  (searchLower === '' ||
                    template.label.toLowerCase().includes(searchLower) ||
                    template.type.toLowerCase().includes(searchLower)),
              );
              if (items.length === 0) return null;

              return (
                <div key={group.name}>
                  {/* group-label */}
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}
                  >
                    {group.name}
                  </div>

                  <div style={{ display: 'grid', gap: 6 }}>
                    {items.map((template) => (
                      <div
                        key={template.type}
                        draggable
                        onDragStart={(event) => handleDragStart(event, template.type)}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          border: '1px solid var(--border-primary)',
                          background: 'linear-gradient(180deg, var(--shell-chip-bg), var(--bg-primary, #fff))',
                          cursor: 'grab',
                          userSelect: 'none',
                          transition: 'border-color 0.14s ease, box-shadow 0.14s ease, transform 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = 'var(--color-primary)';
                          el.style.boxShadow = '0 2px 8px color-mix(in srgb, var(--color-primary) 18%, transparent)';
                          el.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = 'var(--border-primary)';
                          el.style.boxShadow = 'none';
                          el.style.transform = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 9,
                              background: `color-mix(in srgb, ${template.color} 18%, transparent)`,
                              color: template.color,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 13,
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            {template.icon}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <strong
                              style={{
                                display: 'block',
                                fontSize: 13,
                                fontWeight: 900,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {template.label}
                            </strong>
                            <span
                              style={{
                                display: 'block',
                                marginTop: 3,
                                fontSize: 11,
                                lineHeight: 1.45,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {NODE_DESCRIPTIONS[template.type] ?? template.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {search && CATEGORY_GROUPS.every((g) => !NODE_TEMPLATES.some((t) => g.types.includes(t.type) && t.label.toLowerCase().includes(searchLower))) && (
              <div
                style={{
                  padding: '16px 10px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                  borderRadius: 12,
                }}
              >
                No nodes match "{search}"
              </div>
            )}
          </div>
        )}

        {/* Agents tab */}
        {activeTab === 'agents' && (
          <div style={{ display: 'grid', gap: 6 }}>
            {state.agents.length === 0 ? (
              <div
                style={{
                  padding: '16px 10px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                  borderRadius: 12,
                }}
              >
                No agents in workspace
              </div>
            ) : (
              state.agents
                .filter((a) => !search || a.name.toLowerCase().includes(searchLower))
                .map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid var(--border-primary)',
                      background: 'linear-gradient(180deg, var(--shell-chip-bg), var(--bg-primary, #fff))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: agent.isEnabled ? 'var(--color-success)' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {agent.name}
                        </strong>
                        {(agent.role ?? agent.kind) && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                            }}
                          >
                            {agent.role ?? agent.kind ?? 'agent'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Flows tab */}
        {activeTab === 'flows' && (
          <div style={{ display: 'grid', gap: 6 }}>
            {state.flows.length === 0 ? (
              <div
                style={{
                  padding: '16px 10px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-primary)',
                  borderRadius: 12,
                }}
              >
                No flows in workspace
              </div>
            ) : (
              state.flows
                .filter((f) => !search || f.name.toLowerCase().includes(searchLower))
                .map((flow) => (
                  <div
                    key={flow.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid var(--border-primary)',
                      background: 'linear-gradient(180deg, var(--shell-chip-bg), var(--bg-primary, #fff))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: flow.isEnabled ? 'var(--color-success)' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: 12,
                            fontWeight: 900,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {flow.name}
                        </strong>
                        {flow.trigger && (
                          <span
                            style={{
                              display: 'block',
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {flow.trigger}
                          </span>
                        )}
                      </div>
                      {flow.nodes && (
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 999,
                            padding: '2px 6px',
                            flexShrink: 0,
                          }}
                        >
                          {flow.nodes.length}n
                        </span>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* footer hint */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--border-primary)',
          fontSize: 10,
          color: 'var(--text-muted)',
          flexShrink: 0,
          background: 'var(--shell-chip-bg)',
        }}
      >
        {activeTab === 'components' ? 'Drag nodes onto the canvas' : 'Click to inspect'}
      </div>
    </div>
  );
}
