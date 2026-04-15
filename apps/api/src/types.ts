import { AgentSpec, FlowSpec, PolicySpec, ProfileSpec, SkillSpec, WorkspaceSpec } from '../../../packages/core-types/src';

export interface StudioState {
  workspace: WorkspaceSpec | null;
  agents: AgentSpec[];
  skills: SkillSpec[];
  flows: FlowSpec[];
  profiles: ProfileSpec[];
  policies: PolicySpec[];
}

export interface GatewayCallPayload {
  method: string;
  params?: Record<string, unknown>;
}
