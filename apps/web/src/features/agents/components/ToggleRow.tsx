import React from 'react';

interface ToggleRowProps {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  defaultChecked?: boolean;
}

export function ToggleRow({ label, helper, checked, onChange, defaultChecked }: ToggleRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          onClick={() => onChange(!checked)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: checked ? 'var(--builder-accent)' : 'var(--builder-bg-tertiary)',
            border: `1px solid ${checked ? 'var(--builder-border-accent)' : 'var(--builder-border-color)'}`,
            cursor: 'pointer',
            position: 'relative',
            transition: 'var(--transition)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'white',
              top: '50%',
              transform: `translateY(-50%) translateX(${checked ? 18 : 2}px)`,
              transition: 'var(--transition)',
            }}
          />
        </div>
        <label
          style={{
            fontSize: 14,
            color: 'var(--builder-text-primary)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {label}
        </label>
      </div>
      {helper && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--builder-text-disabled)',
            lineHeight: 1.4,
            marginLeft: 46,
          }}
        >
          {helper}
        </span>
      )}
    </div>
  );
}
