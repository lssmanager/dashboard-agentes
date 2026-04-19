import { type ComponentType } from 'react';
import { type LucideProps } from 'lucide-react';

interface EmptySectionProps {
  icon:         ComponentType<LucideProps>;
  title:        string;
  description?: string;
  ctaLabel?:    string;
  onCta?:       () => void;
}

export function EmptySection({ icon: Icon, title, description, ctaLabel, onCta }: EmptySectionProps) {
  return (
    <div
      style={{
        border: '2px dashed var(--border-primary)',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(180deg, var(--card-bg), var(--bg-secondary))',
        padding: '48px 24px',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        gap: 16,
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-soft)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon size={28} style={{ color: 'var(--color-primary)' }} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p style={{ color: 'var(--text-muted)', maxWidth: '42ch', lineHeight: 1.55, fontSize: 'var(--text-sm)' }}>
          {description}
        </p>
      )}

      {/* CTA */}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            color: 'var(--btn-primary-text)',
            background: 'var(--btn-primary-bg)',
            cursor: 'pointer',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-hover)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--btn-primary-bg)'; }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
