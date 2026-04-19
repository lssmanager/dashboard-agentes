import type {
  AgentSpec,
  CanonicalStudioState,
  FlowSpec,
  ProfileSpec,
  SkillSpec,
  WorkspaceSpec,
} from '../../../../../../packages/core-types/src';

export interface LegacyStudioStateDto {
  workspace: WorkspaceSpec | null;
  agents: AgentSpec[];
  skills: SkillSpec[];
  flows: FlowSpec[];
  policies: Array<{ id: string; name: string }>;
  profiles: ProfileSpec[];
  compile: { artifacts: unknown[]; diagnostics: string[] };
  runtime: {
    health: { ok: boolean; [key: string]: unknown };
    diagnostics: Record<string, unknown>;
    sessions: { ok: boolean; payload?: unknown[] };
  };
  generatedAt: string;
}

export type CanonicalStudioStateDto = CanonicalStudioState;
