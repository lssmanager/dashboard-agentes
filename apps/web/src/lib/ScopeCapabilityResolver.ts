import type { CanonicalNodeLevel } from './types';
import { SCOPE_VIEW_REGISTRY } from './ScopeViewRegistry';

export interface ScopeCapabilityResolverResult {
  level: CanonicalNodeLevel;
  canOpenStudio: boolean;
  canUseProfileTab: boolean;
  canManageSettings: boolean;
  canRunOperations: boolean;
  sessionsMode: 'aggregated' | 'scoped';
  runsMode: 'aggregated' | 'scoped';
}

export function resolveScopeCapabilities(level: CanonicalNodeLevel): ScopeCapabilityResolverResult {
  const view = SCOPE_VIEW_REGISTRY[level];

  return {
    level,
    canOpenStudio: view.canEnterStudio,
    canUseProfileTab: view.showProfileTab,
    canManageSettings: level === 'agency',
    canRunOperations: view.operations,
    sessionsMode: view.sessionsMode,
    runsMode: view.runsMode,
  };
}

