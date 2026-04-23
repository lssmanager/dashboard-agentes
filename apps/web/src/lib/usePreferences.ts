import { useEffect, useState } from 'react';

export type LayoutMode = 'normal' | 'compact';
export type AnalyticsWindowPref = '1H' | '6H' | '24H' | '7D' | '30D';

interface Preferences {
  selectedAgentId?: string;
  selectedWorkspaceId?: string;
  sidebarCollapsed?: boolean;
  theme?: 'light' | 'dark';
  layoutMode?: LayoutMode;
  defaultAnalyticsWindow?: AnalyticsWindowPref;
}

const PREFERENCES_KEY = 'studio-preferences';

function getPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? (JSON.parse(stored) as Preferences) : {};
  } catch {
    return {};
  }
}

function savePreferences(prefs: Preferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(getPreferences);

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return {
    prefs,
    selectedAgentId: prefs.selectedAgentId,
    selectedWorkspaceId: prefs.selectedWorkspaceId,
    sidebarCollapsed: prefs.sidebarCollapsed ?? false,
    theme: prefs.theme ?? 'light',
    layoutMode: (prefs.layoutMode ?? 'normal') as LayoutMode,
    defaultAnalyticsWindow: (prefs.defaultAnalyticsWindow ?? '24H') as AnalyticsWindowPref,

    setSelectedAgentId: (id: string | undefined) => updatePreference('selectedAgentId', id),
    setSelectedWorkspaceId: (id: string | undefined) => updatePreference('selectedWorkspaceId', id),
    setSidebarCollapsed: (collapsed: boolean) => updatePreference('sidebarCollapsed', collapsed),
    setTheme: (theme: 'light' | 'dark') => updatePreference('theme', theme),
    setLayoutMode: (mode: LayoutMode) => updatePreference('layoutMode', mode),
    setDefaultAnalyticsWindow: (w: AnalyticsWindowPref) => updatePreference('defaultAnalyticsWindow', w),
  };
}
