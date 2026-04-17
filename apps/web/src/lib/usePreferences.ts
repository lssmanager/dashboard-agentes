import { useEffect, useState } from 'react';

interface Preferences {
  selectedAgentId?: string;
  selectedWorkspaceId?: string;
  sidebarCollapsed?: boolean;
  theme?: 'light' | 'dark';
}

const PREFERENCES_KEY = 'studio-preferences';

function getPreferences(): Preferences {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  return stored ? JSON.parse(stored) : {};
}

function savePreferences(prefs: Preferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(getPreferences);

  // Persist to localStorage whenever preferences change
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

    setSelectedAgentId: (id: string | undefined) => updatePreference('selectedAgentId', id),
    setSelectedWorkspaceId: (id: string | undefined) => updatePreference('selectedWorkspaceId', id),
    setSidebarCollapsed: (collapsed: boolean) => updatePreference('sidebarCollapsed', collapsed),
    setTheme: (theme: 'light' | 'dark') => updatePreference('theme', theme),
  };
}
