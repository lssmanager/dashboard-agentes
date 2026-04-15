import { ProfileSpec } from '../../../core-types/src';

export const executiveAssistantProfile: ProfileSpec = {
  id: 'executive-assistant',
  name: 'Executive Assistant',
  description: 'High-context assistant for executive planning and communication.',
  category: 'support',
  defaultModel: 'openai/gpt-5.4-mini',
  defaultSkills: ['calendar.read', 'tasks.manage', 'notes.capture'],
  defaultPolicies: ['safe-operator'],
  routines: ['morning-brief', 'task-prep', 'followup-sweep'],
};
