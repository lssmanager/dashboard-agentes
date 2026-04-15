import { ProfileSpec } from '../../../core-types/src';

export const monitoringAgentProfile: ProfileSpec = {
  id: 'monitoring-agent',
  name: 'Monitoring Agent',
  description: 'Watches health, diagnostics, and usage signals from runtime.',
  category: 'monitoring',
  defaultModel: 'openai/gpt-5.4-mini',
  defaultSkills: ['health.read', 'logs.analyze', 'usage.cost.read'],
  defaultPolicies: ['safe-operator'],
  routines: ['followup-sweep', 'eod-review'],
};
