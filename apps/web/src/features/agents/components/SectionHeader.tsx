import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: 16, marginTop: 8 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--builder-text-muted)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--builder-text-disabled)',
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
