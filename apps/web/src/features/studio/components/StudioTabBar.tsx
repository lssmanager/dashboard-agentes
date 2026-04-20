const DEFAULT_TABS = [
  { id: 'builder', label: 'Builder' },
  { id: 'test', label: 'Test' },
  { id: 'debug', label: 'Debug' },
  { id: 'topology', label: 'Topology' },
  { id: 'diff', label: 'Diff / Apply' },
] as const;

export type StudioTab = (typeof DEFAULT_TABS)[number]['id'];

interface StudioTabBarProps {
  active: StudioTab;
  onChange: (tab: StudioTab) => void;
  tabs?: ReadonlyArray<{ id: StudioTab; label: string }>;
}

export function StudioTabBar({ active, onChange, tabs = DEFAULT_TABS }: StudioTabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '0 16px',
        borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-primary)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: 'var(--text-sm)',
              fontWeight: isActive ? 600 : 400,
              fontFamily: 'var(--font-heading)',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--color-primary-soft)' : 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'color var(--transition), background var(--transition)',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
