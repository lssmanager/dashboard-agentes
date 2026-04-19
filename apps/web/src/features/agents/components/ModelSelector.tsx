import { useState } from 'react';

const MODELS = [
  { id: 'openai/gpt-5.4',         label: 'GPT-5.4',           desc: 'Most capable, higher cost' },
  { id: 'openai/gpt-5.4-mini',    label: 'GPT-5.4 Mini',      desc: 'Balanced speed and quality' },
  { id: 'openai/gpt-5.3-codex',   label: 'GPT-5.3 Codex',     desc: 'Optimized for code tasks' },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {MODELS.map((m) => {
        const selected = value === m.id;
        const isHov = hovered === m.id;

        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            onMouseEnter={() => setHovered(m.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${selected ? 'var(--color-primary)' : isHov ? 'rgba(34,89,242,0.3)' : 'var(--border-primary)'}`,
              background: selected ? 'var(--color-primary-soft)' : 'var(--bg-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color var(--transition), background var(--transition)',
              outline: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {/* Radio circle */}
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 'var(--radius-full)',
                  border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--border-primary)'}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {selected && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-primary)',
                    }}
                  />
                )}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  color: selected ? 'var(--color-primary)' : 'var(--text-primary)',
                }}
              >
                {m.label}
              </span>
            </div>
            <p
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                margin: 0,
                paddingLeft: 24,
              }}
            >
              {m.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}
