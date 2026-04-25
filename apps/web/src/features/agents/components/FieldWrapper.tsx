import React from 'react';

interface FieldWrapperProps {
  label: string;
  helper?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, helper, children }: FieldWrapperProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          color: 'var(--builder-text-muted)',
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {label}
      </label>
      {children}
      {helper && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--builder-text-disabled)',
            lineHeight: 1.4,
          }}
        >
          {helper}
        </span>
      )}
    </div>
  );
}
