import { ProfileSpec } from '../../../core-types/src';

export const orchestratorProfile: ProfileSpec = {
  id: 'orchestrator',
  name: 'Orchestrator',
  description: 'Coordinates specialist agents and enforces routing policy.',
  category: 'operations',
  defaultModel: 'openai/gpt-5.4',
  defaultSkills: ['routing.apply', 'status.read'],
  defaultPolicies: ['safe-operator'],
  routines: ['task-prep', 'followup-sweep'],
};
