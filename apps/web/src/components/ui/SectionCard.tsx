import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className = '',
  bodyClassName = '',
}: SectionCardProps) {
  return (
    <div
      className={`rounded-xl border overflow-hidden ${className}`}
      style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div
        className="px-5 py-4 border-b flex items-center justify-between gap-4"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="flex-shrink-0" style={{ color: 'var(--color-primary)' }}>{icon}</div>}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {description && (
              <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
