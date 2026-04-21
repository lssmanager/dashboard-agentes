import type { FlowNodeType } from '../../../lib/types';

export interface NodeTemplate {
  type: FlowNodeType;
  label: string;
  icon: string;
  color: string;
  defaultConfig: Record<string, unknown>;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  { type: 'trigger', label: 'Root', icon: '⚡', color: '#2563eb', defaultConfig: { triggerType: 'manual' } },
  {
    type: 'agent',
    label: 'Agent / Triage',
    icon: '🤖',
    color: '#16a34a',
    defaultConfig: { agentId: '', name: '', instructions: '', includeChatHistory: false, model: 'gpt-4o', reasoningEffort: 'medium', tools: [], outputFormat: 'text', responseSchema: null },
  },
  {
    type: 'subagent',
    label: 'Subagent',
    icon: '🧩',
    color: '#0d9488',
    defaultConfig: { agentId: '', name: '', purpose: '', skills: [], tools: [] },
  },
  { type: 'skill', label: 'Skill', icon: '⚙️', color: '#7c3aed', defaultConfig: { skillId: '' } },
  { type: 'tool', label: 'Tool', icon: '🔧', color: '#9333ea', defaultConfig: { toolId: '', functionName: '' } },
  {
    type: 'condition',
    label: 'Condition',
    icon: '🔀',
    color: '#ca8a04',
    defaultConfig: { expression: '', branches: ['true', 'false'] },
  },
  {
    type: 'if_else',
    label: 'If / Else',
    icon: '⑂',
    color: '#b45309',
    defaultConfig: { cases: [{ name: 'Case 1', condition: '' }], defaultBranch: 'else' },
  },
  { type: 'handoff', label: 'Handoff', icon: '↗️', color: '#ea580c', defaultConfig: { targetAgentId: '', reason: '' } },
  {
    type: 'loop',
    label: 'While',
    icon: '🔁',
    color: '#0284c7',
    defaultConfig: { maxIterations: 3, expression: '' },
  },
  {
    type: 'approval',
    label: 'Approval',
    icon: '✅',
    color: '#0f766e',
    defaultConfig: { approvalRole: 'operator', timeoutMs: 300000 },
  },
  {
    type: 'user_approval',
    label: 'User Approval',
    icon: '👤',
    color: '#0891b2',
    defaultConfig: { name: '', message: '', context: [], outputs: ['Approve', 'Reject'] },
  },
  {
    type: 'guardrails',
    label: 'Guardrails',
    icon: '🛡️',
    color: '#dc2626',
    defaultConfig: {
      input: '',
      pii: false,
      moderation: false,
      jailbreak: false,
      hallucination: false,
      nsfwText: false,
      urlFilter: false,
      promptInjection: false,
      customPromptCheck: false,
      continueOnError: false,
    },
  },
  {
    type: 'file_search',
    label: 'File Search',
    icon: '📁',
    color: '#7c3aed',
    defaultConfig: { vectorStore: '', maxResults: 5, query: '' },
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: '⟲',
    color: '#0369a1',
    defaultConfig: { mode: 'expressions', rows: [{ key: '', value: '' }] },
  },
  {
    type: 'set_state',
    label: 'Set State',
    icon: '📝',
    color: '#0f766e',
    defaultConfig: { rows: [{ key: '', value: '' }] },
  },
  {
    type: 'classify',
    label: 'Classify',
    icon: '🏷️',
    color: '#9333ea',
    defaultConfig: { name: '', input: '', categories: [], classifier: 'llm', examples: [] },
  },
  {
    type: 'mcp',
    label: 'MCP',
    icon: '🔌',
    color: '#64748b',
    defaultConfig: { server: '', tool: '', params: {} },
  },
  {
    type: 'note',
    label: 'Note',
    icon: '📋',
    color: '#6b7280',
    defaultConfig: { text: '' },
  },
  { type: 'end', label: 'End', icon: '⏹', color: '#4b5563', defaultConfig: { outcome: 'completed', outputSchema: null } },
];

let nodeCounter = 0;

export function generateNodeId(type: string): string {
  nodeCounter += 1;
  return `${type}-${Date.now()}-${nodeCounter}`;
}

export function getNodeTemplate(type: FlowNodeType): NodeTemplate | undefined {
  return NODE_TEMPLATES.find((template) => template.type === type);
}
