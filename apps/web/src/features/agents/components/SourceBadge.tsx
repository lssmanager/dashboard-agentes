import React from 'react';

type SourceType = 'profile' | 'agency' | 'workspace' | 'global' | 'local';

interface SourceBadgeProps {
  source: SourceType;
}

const sourceStyles: Record<SourceType, { bg: string; border: string; text: string }> = {
  profile: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  agency: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
  workspace: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' },
  global: { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', text: '#94a3b8' },
  local: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const style = sourceStyles[source];
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
      }}
    >
      {source}
    </span>
  );
}
