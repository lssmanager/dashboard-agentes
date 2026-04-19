import { DragEvent } from 'react';
import { NODE_TEMPLATES } from '../../canvas/lib/canvas-utils';
import type { FlowNodeType } from '../../../lib/types';

export function ComponentLibrary() {
  function handleDragStart(e: DragEvent<HTMLDivElement>, type: FlowNodeType) {
    e.dataTransfer.setData('application/reactflow-type', type);
    e.dataTransfer.effectAllowed = 'move';
  }

  const categories: Record<string, typeof NODE_TEMPLATES> = {};
  for (const tmpl of NODE_TEMPLATES) {
    const cat =
      tmpl.type === 'trigger' ? 'Triggers' :
      tmpl.type === 'agent' ? 'Agents' :
      tmpl.type === 'condition' ? 'Logic' :
      tmpl.type === 'tool' ? 'Tools' :
      'End';
    (categories[cat] ??= []).push(tmpl);
  }

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border-primary)' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}
        >
          Components
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          Drag nodes onto the canvas
        </p>
      </div>

      {/* Categories */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 16 }}>
        {Object.entries(categories).map(([cat, items]) => (
          <div key={cat}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              {cat}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {items.map((tmpl) => (
                <div
                  key={tmpl.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tmpl.type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-secondary)',
                    cursor: 'grab',
                    transition: 'border-color var(--transition), box-shadow var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-secondary)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-md)',
                      background: tmpl.color + '18',
                      color: tmpl.color,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {tmpl.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {tmpl.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
