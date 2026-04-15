export interface WorkspaceRoutingRule {
  id: string;
  from: string;
  to: string;
  when: string;
  priority: number;
}

export interface WorkspacePolicyRef {
  id: string;
  scope: 'workspace' | 'agent' | 'flow';
  targetId?: string;
}

export interface WorkspaceSpec {
  id: string;
  slug: string;
  name: string;
  description?: string;
  owner?: string;
  defaultModel?: string;
  agentIds: string[];
  skillIds: string[];
  flowIds: string[];
  profileIds: string[];
  policyRefs: WorkspacePolicyRef[];
  routingRules: WorkspaceRoutingRule[];
  routines: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
