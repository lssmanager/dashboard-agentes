import { ProfileSpec } from '../../../core-types/src';

export const devAgentProfile: ProfileSpec = {
  id: 'dev-agent',
  name: 'Dev Agent',
  description: 'Focused on coding, refactoring and test-driven execution.',
  category: 'engineering',
  defaultModel: 'openai/gpt-5.3-codex',
  defaultSkills: ['code.search', 'code.edit', 'tests.run'],
  defaultPolicies: ['safe-operator'],
  routines: ['task-prep', 'eod-review'],
};
