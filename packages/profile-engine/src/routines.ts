import { RoutineSpec } from '../../core-types/src';

export const builtinRoutines: RoutineSpec[] = [
  {
    id: 'morning-brief',
    name: 'Morning Brief',
    description: 'Compiles priorities, blockers and key events for the day.',
    schedule: '0 8 * * *',
    steps: ['Collect active tasks', 'Summarize priorities', 'Highlight blockers'],
  },
  {
    id: 'eod-review',
    name: 'End of Day Review',
    description: 'Records outcomes and updates unfinished work.',
    schedule: '0 18 * * *',
    steps: ['Summarize completed work', 'Capture pending follow-ups', 'Plan tomorrow'],
  },
  {
    id: 'followup-sweep',
    name: 'Follow-up Sweep',
    description: 'Finds stale commitments and generates action prompts.',
    schedule: '0 14 * * *',
    steps: ['Scan unresolved commitments', 'Rank urgency', 'Create follow-up messages'],
  },
  {
    id: 'task-prep',
    name: 'Task Prep',
    description: 'Prepares execution context before deep work starts.',
    schedule: '*/30 * * * *',
    steps: ['Gather context', 'Define acceptance criteria', 'Prepare execution checklist'],
  },
];
