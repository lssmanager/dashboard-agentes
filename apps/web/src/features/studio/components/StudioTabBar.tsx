import { StudioTabs } from '../../../components/ui';

export type StudioTab = 'builder' | 'test' | 'debug' | 'topology' | 'diff';

interface StudioTabBarProps {
  active: StudioTab;
  onChange: (tab: StudioTab) => void;
  tabs: Array<{ id: StudioTab; label: string }>;
}

export function StudioTabBar({ active, onChange, tabs }: StudioTabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 14px',
        borderBottom: '1px solid var(--shell-panel-border)',
        background: 'var(--shell-panel-bg)',
        flexWrap: 'wrap',
      }}
    >
      <StudioTabs
        tabs={tabs}
        active={active}
        onChange={onChange}
        ariaLabel="Workspace studio sections"
      />
    </div>
  );
}
