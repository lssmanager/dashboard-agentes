import { ProfileSpec } from '../../../core-types/src';

export const chiefOfStaffProfile: ProfileSpec = {
  id: 'chief-of-staff',
  name: 'Chief of Staff',
  description: 'Operational orchestrator with routines and follow-ups',
  category: 'operations',
  defaultModel: 'openai/gpt-5.4-mini',
  routines: ['morning-brief', 'eod-review', 'followup-sweep', 'task-prep'],
  defaultSkills: ['status.read', 'tasks.manage', 'notes.capture'],
  defaultPolicies: ['safe-operator'],
};
