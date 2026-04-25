import React from 'react';
import { Users } from 'lucide-react';

interface BootstrapModalProps {
  onSelect: (option: 'template' | 'blank' | 'import') => void;
}

const options = [
  {
    icon: '📋',
    title: 'Select profile template',
    sub: 'Choose from existing profiles in Profiles Hub',
    value: 'template' as const,
  },
  {
    icon: '✦',
    title: 'Start from blank agent',
    sub: 'Fill all sections manually from scratch',
    value: 'blank' as const,
  },
  {
    icon: '↑',
    title: 'Import from Core Files',
    sub: 'Upload .md files to pre-fill the builder',
    value: 'import' as const,
  },
];

export function BootstrapModal({ onSelect }: BootstrapModalProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 440,
          background: 'var(--builder-bg-secondary)',
          border: '1px solid var(--builder-border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Header icon */}
        <div
          style={{
            fontSize: 36,
            color: 'var(--builder-text-muted)',
            marginBottom: 16,
          }}
        >
          ⚙️
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--builder-text-primary)',
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          This agent has not been initialized yet.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--builder-text-muted)',
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          Define who this agent is and how to get started.
        </div>

        {/* Options cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                padding: '14px 16px',
                border: '1px solid var(--builder-border-color)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                transition: 'var(--transition)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--builder-border-accent)';
                e.currentTarget.style.background = 'var(--builder-accent-dim)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--builder-border-color)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: 'var(--builder-accent)',
                  width: 24,
                  textAlign: 'center',
                }}
              >
                {opt.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--builder-text-primary)',
                  }}
                >
                  {opt.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--builder-text-muted)',
                    marginTop: 2,
                  }}
                >
                  {opt.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
