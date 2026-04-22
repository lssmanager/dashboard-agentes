import { Activity, Box, Compass, Layers3, Orbit, Sparkles, type LucideIcon } from 'lucide-react';

export type StudioTab = 'builder' | 'test' | 'debug' | 'topology' | 'diff';

interface StudioTabBarProps {
  active: StudioTab;
  onChange: (tab: StudioTab) => void;
  tabs: Array<{ id: StudioTab; label: string; hint?: string; count?: string | number }>;
  scopeLabel: string;
  agentLabel: string;
  selectedNodeLabel?: string | null;
  runtimeLabel: string;
  runtimeTone?: 'success' | 'warning';
}

const TAB_ICONS: Record<StudioTab, LucideIcon> = {
  builder: Sparkles,
  test: Compass,
  debug: Activity,
  topology: Orbit,
  diff: Layers3,
};

export function StudioTabBar({
  active,
  onChange,
  tabs,
  scopeLabel,
  agentLabel,
  selectedNodeLabel,
  runtimeLabel,
  runtimeTone = 'success',
}: StudioTabBarProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: '16px 18px 14px',
        border: '1px solid var(--shell-panel-border)',
        borderRadius: 'var(--radius-xl)',
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--shell-panel-bg) 96%, var(--color-primary-soft)), var(--shell-panel-bg))',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ContextChip label="Scope" value={scopeLabel} />
          <ContextChip label="Agent" value={agentLabel} />
          <ContextChip label="Selection" value={selectedNodeLabel ?? 'Canvas focus'} icon={Box} subtle={!selectedNodeLabel} />
        </div>

        <ContextChip
          label="Runtime"
          value={runtimeLabel}
          tone={runtimeTone}
        />
      </div>

      <div
        role="tablist"
        aria-label="Studio editor modes"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))',
          gap: 8,
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const Icon = TAB_ICONS[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              style={{
                display: 'grid',
                gap: 3,
                alignContent: 'start',
                minHeight: 72,
                padding: '11px 12px',
                textAlign: 'left',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${
                  isActive
                    ? 'color-mix(in srgb, var(--color-primary) 42%, var(--shell-panel-border))'
                    : 'var(--shell-panel-border)'
                }`,
                background: isActive ? 'var(--color-primary-soft)' : 'color-mix(in srgb, var(--shell-panel-bg) 82%, transparent)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: isActive ? '0 12px 24px rgba(15, 23, 42, 0.10)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    background: isActive ? 'rgba(255,255,255,0.72)' : 'var(--shell-chip-bg)',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={14} />
                </span>
                {tab.count !== undefined ? (
                  <span
                    style={{
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--shell-chip-border)',
                      background: isActive ? 'rgba(255,255,255,0.72)' : 'var(--shell-chip-bg)',
                      padding: '2px 7px',
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </div>

              <span style={{ fontSize: 13, fontWeight: 900, color: isActive ? 'var(--text-primary)' : 'inherit' }}>{tab.label}</span>
              <span style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--text-muted)' }}>{tab.hint ?? 'Open studio mode'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ContextChip({
  label,
  value,
  tone = 'default',
  subtle = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
  subtle?: boolean;
  icon?: LucideIcon;
}) {
  const toneStyles =
    tone === 'success'
      ? {
          color: 'var(--tone-success-text)',
          background: 'var(--tone-success-bg)',
          border: 'var(--tone-success-border)',
        }
      : tone === 'warning'
        ? {
            color: 'var(--tone-warning-text)',
            background: 'var(--tone-warning-bg)',
            border: 'var(--tone-warning-border)',
          }
        : {
            color: subtle ? 'var(--text-muted)' : 'var(--text-primary)',
            background: subtle ? 'color-mix(in srgb, var(--shell-chip-bg) 72%, transparent)' : 'var(--shell-chip-bg)',
            border: 'var(--shell-chip-border)',
          };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${toneStyles.border}`,
        background: toneStyles.background,
        minWidth: 0,
      }}
    >
      {Icon ? (
        <span style={{ color: toneStyles.color, display: 'inline-flex', alignItems: 'center' }}>
          <Icon size={13} />
        </span>
      ) : null}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: toneStyles.color,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 220,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
