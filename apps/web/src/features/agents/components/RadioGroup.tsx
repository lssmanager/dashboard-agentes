import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  description: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  selected: string;
  onChange: (value: string) => void;
}

export function RadioGroup({ options, selected, onChange }: RadioGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            gap: 10,
            cursor: 'pointer',
            alignItems: 'flex-start',
          }}
        >
          <div
            onClick={() => onChange(opt.value)}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: 2,
              border: `2px solid ${
                selected === opt.value
                  ? 'var(--builder-accent)'
                  : 'rgba(255,255,255,0.2)'
              }`,
              background:
                selected === opt.value ? 'var(--builder-accent)' : 'transparent',
              position: 'relative',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {selected === opt.value && (
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  right: 2,
                  bottom: 2,
                  borderRadius: '50%',
                  background: 'white',
                }}
              />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--builder-text-primary)',
              }}
            >
              {opt.label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--builder-text-muted)',
                marginTop: 2,
              }}
            >
              {opt.description}
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}
