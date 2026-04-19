import { useState } from 'react';
import { GitBranch } from 'lucide-react';
import type { FlowSpec, FlowNodeType } from '../../lib/types';

/* Colour per node type (CSS-variable-friendly) */
const NODE_COLOR: Record<FlowNodeType | string, string> = {
  trigger:   'var(--color-primary)',
  agent:     '#8B5CF6',
  tool:      '#0EA5E9',
  condition: '#F59E0B',
  approval:  '#F3B723',
  end:       '#EF4444',
};

function nodeColor(type: string): string {
  return NODE_COLOR[type] ?? 'var(--text-muted)';
}

interface FlowCardProps {
  flow:      FlowSpec;
  selected?: boolean;
  onClick?:  () => void;
}

export function FlowCard({ flow, selected, onClick }: FlowCardProps) {
  const [hovered, setHovered] = useState(false);
  const enabled   = flow.isEnabled !== false;
  const nodeCount = flow.nodes?.length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${selected ? 'var(--color-primary)' : hovered ? 'rgba(34,89,242,0.3)' : 'var(--card-border)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: selected
          ? '0 0 0 3px var(--color-primary-soft)'
          : hovered
            ? 'var(--shadow-md)'
            : 'var(--shadow-sm)',
        padding: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color var(--transition), box-shadow var(--transition)',
        outline: 'none',
      }}
    >
      {/* Dot-grid thumbnail */}
      <div
        style={{
          height: 80,
          backgroundImage:
            'radial-gradient(circle, var(--border-secondary) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
          backgroundPosition: '7px 7px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mini node circles */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '0 16px',
          }}
        >
          {(flow.nodes ?? []).slice(0, 6).map((node, i) => (
            <div
              key={node.id ?? i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 'var(--radius-full)',
                background: nodeColor(node.type),
                opacity: 0.85,
                flexShrink: 0,
              }}
            />
          ))}
          {nodeCount > 6 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              +{nodeCount - 6}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px 14px' }}>
        {/* Flow name + enabled dot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {flow.name}
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 'var(--radius-full)',
              background: enabled ? 'var(--color-success)' : 'var(--text-muted)',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Trigger badge + node count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {flow.trigger && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '60%',
              }}
            >
              {flow.trigger}
            </span>
          )}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            <GitBranch size={11} />
            {nodeCount} node{nodeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
