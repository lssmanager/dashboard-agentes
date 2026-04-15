export type AgentVisibility = 'private' | 'workspace' | 'public';
export type AgentExecutionMode = 'direct' | 'orchestrated' | 'handoff';

export interface AgentHandoffRule {
  id: string;
  targetAgentId: string;
  when: string;
  description?: string;
  priority?: number;
}

export interface AgentChannelBinding {
  id: string;
  channel: string;
  route: string;
  enabled: boolean;
}

export interface AgentPolicyBinding {
  policyId: string;
  mode: 'enforce' | 'warn';
}

export interface AgentSpec {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  description: string;
  instructions: string;
  model: string;
  skillRefs: string[];
  tags: string[];
  visibility: AgentVisibility;
  executionMode: AgentExecutionMode;
  handoffRules: AgentHandoffRule[];
  channelBindings: AgentChannelBinding[];
  policyBindings?: AgentPolicyBinding[];
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}
