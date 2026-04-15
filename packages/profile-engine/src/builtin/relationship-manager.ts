import { ProfileSpec } from '../../../core-types/src';

export const relationshipManagerProfile: ProfileSpec = {
  id: 'relationship-manager',
  name: 'Relationship Manager',
  description: 'Tracks people, commitments, and strategic follow-ups.',
  category: 'support',
  defaultModel: 'openai/gpt-5.4-mini',
  defaultSkills: ['contacts.search', 'followups.plan'],
  defaultPolicies: ['safe-operator'],
  routines: ['followup-sweep', 'eod-review'],
};
