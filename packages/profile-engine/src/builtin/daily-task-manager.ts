import { ProfileSpec } from '../../../core-types/src';

export const dailyTaskManagerProfile: ProfileSpec = {
  id: 'daily-task-manager',
  name: 'Daily Task Manager',
  description: 'Operates daily planning loops and completion tracking.',
  category: 'operations',
  defaultModel: 'openai/gpt-5.4-mini',
  defaultSkills: ['tasks.manage', 'calendar.read'],
  defaultPolicies: ['safe-operator'],
  routines: ['morning-brief', 'eod-review'],
};
