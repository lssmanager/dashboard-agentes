import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface StudioPageShellProps {
  children: ReactNode;
  maxWidth?: number;
}

export function StudioPageShell({ children, maxWidth = 1360 }: StudioPageShellProps) {
  return (
    <div
      style={{
        maxWidth,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {children}
    </div>
  );
}

interface StudioHeroSectionProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function StudioHeroSection({ eyebrow, title, description, actions, meta }: StudioHeroSectionProps) {
  return (
    <section
      style={{
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--card-border)',
        background:
          'linear-gradient(140deg, color-mix(in srgb, var(--color-primary) 12%, var(--card-bg) 88%) 0%, var(--card-bg) 45%, color-mix(in srgb, var(--color-accent) 14%, var(--card-bg) 86%) 100%)',
        boxShadow: 'var(--shadow-md)',
        padding: '28px 30px',
        display: 'grid',
        gap: 16,
      }}
    >
      {eyebrow && (
        <span
          style={{
            display: 'inline-flex',
            width: 'fit-content',
            borderRadius: 'var(--radius-full)',
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-primary-active)',
            background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
          }}
        >
          {eyebrow}
        </span>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', lineHeight: 1.15 }}>{title}</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 760 }}>{description}</p>
      </div>

      {(actions || meta) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
          {meta}
        </div>
      )}
    </section>
  );
}

interface StudioSectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function StudioSectionCard({ title, description, actions, children }: StudioSectionCardProps) {
  return (
    <section
      style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <header
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'grid', gap: 2 }}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>{title}</h2>
          {description && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{description}</p>}
        </div>
        {actions}
      </header>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

interface StudioKpiCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'warning';
  onClick?: () => void;
}

const KPI_TONES: Record<NonNullable<StudioKpiCardProps['tone']>, CSSProperties> = {
  default: {
    borderColor: 'var(--card-border)',
    background: 'var(--card-bg)',
  },
  success: {
    borderColor: 'var(--tone-success-border)',
    background: 'var(--tone-success-bg)',
  },
  warning: {
    borderColor: 'var(--tone-warning-border)',
    background: 'var(--tone-warning-bg)',
  },
};

export function StudioKpiCard({
  label,
  value,
  helper,
  icon,
  tone = 'default',
  onClick,
}: StudioKpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...KPI_TONES[tone],
        textAlign: 'left',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            {label}
          </span>
          <strong style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.1, color: 'var(--text-primary)' }}>{value}</strong>
          {helper && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{helper}</span>}
        </div>
        {icon && <div style={{ color: 'var(--text-secondary)', opacity: 0.85 }}>{icon}</div>}
      </div>
    </button>
  );
}

interface RuntimeStatusBadgeProps {
  status: 'online' | 'degraded' | 'offline' | 'idle';
  label: string;
}

export function RuntimeStatusBadge({ status, label }: RuntimeStatusBadgeProps) {
  const map: Record<RuntimeStatusBadgeProps['status'], CSSProperties> = {
    online: { background: 'var(--tone-success-bg)', borderColor: 'var(--tone-success-border)', color: 'var(--tone-success-text)' },
    degraded: { background: 'var(--tone-warning-bg)', borderColor: 'var(--tone-warning-border)', color: 'var(--tone-warning-text)' },
    offline: { background: 'var(--tone-danger-bg)', borderColor: 'var(--tone-danger-border)', color: 'var(--tone-danger-text)' },
    idle: { background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-muted)' },
  };

  return (
    <span
      style={{
        ...map[status],
        borderRadius: 'var(--radius-full)',
        borderWidth: 1,
        borderStyle: 'solid',
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

interface StudioMetricRowProps {
  label: string;
  value: string;
  hint?: string;
}

export function StudioMetricRow({ label, value, hint }: StudioMetricRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        borderBottom: '1px solid var(--border-secondary)',
        padding: '10px 0',
      }}
    >
      <div style={{ display: 'grid', gap: 2 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {hint && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{hint}</span>}
      </div>
      <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value}</strong>
    </div>
  );
}

interface StudioEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function StudioEmptyState({ title, description, actionLabel, onAction }: StudioEmptyStateProps) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-primary)',
        background: 'var(--bg-secondary)',
        padding: 20,
        textAlign: 'center',
        display: 'grid',
        gap: 10,
      }}
    >
      <h3 style={{ fontSize: 'var(--text-base)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            margin: '0 auto',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            background: 'var(--card-bg)',
            fontSize: 13,
            color: 'var(--text-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {actionLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

interface StudioInspectorCardProps {
  title: string;
  children: ReactNode;
}

export function StudioInspectorCard({ title, children }: StudioInspectorCardProps) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-primary)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

interface StudioTimelineBlockProps {
  items: Array<{ title: string; description: string; meta?: string }>;
}

export function StudioTimelineBlock({ items }: StudioTimelineBlockProps) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item, idx) => (
        <div key={`${item.title}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: 10 }}>
          <div style={{ display: 'grid', placeItems: 'start center' }}>
            <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
          </div>
          <div style={{ paddingBottom: 10, borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--border-secondary)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{item.title}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{item.description}</p>
            {item.meta && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{item.meta}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
