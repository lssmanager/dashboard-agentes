import type {
  AgencySpec,
  CanonicalStudioState,
  RuntimeCapabilities,
  SkillSpec,
  ToolSpec,
} from '../index';

interface LegacyAgent {
  id: string;
  name: string;
  role?: string;
  skillRefs?: string[];
  isEnabled?: boolean;
}

interface LegacyWorkspace {
  id: string;
  name: string;
  description?: string;
}

interface LegacyStateLike {
  workspace?: LegacyWorkspace | null;
  agents?: LegacyAgent[];
  skills?: Array<{ id: string; name: string; description?: string; category?: string; version?: string }>;
  runtime?: {
    health?: { ok?: boolean };
  };
}

const DEFAULT_CAPABILITIES: RuntimeCapabilities = {
  runtimeName: 'openclaw',
  supportsTopologyConnect: false,
  supportsTopologyDisconnect: false,
  supportsTopologyPause: false,
  supportsTopologyReactivate: false,
  supportsTopologyRedirect: false,
  supportsTopologyContinue: false,
  supportsReplay: false,
  supportsCheckpoints: false,
  supportsLoopProtection: false,
  supportsParallelDispatch: false,
};

export function adaptLegacyStudioStateToCanonical(
  legacy: LegacyStateLike,
  inputCapabilities?: Partial<RuntimeCapabilities>,
): CanonicalStudioState {
  const capabilities: RuntimeCapabilities = {
    ...DEFAULT_CAPABILITIES,
    ...(inputCapabilities ?? {}),
  };

  const agency: AgencySpec | null = legacy.workspace
    ? {
        id: 'agency:compat',
        name: 'Legacy Agency (Compatibility)',
        kind: 'agency',
        canReceiveDirectMessages: true,
        departments: [
          {
            id: 'department:compat',
            name: 'Legacy Department',
            kind: 'department',
            canReceiveDirectMessages: true,
            status: 'active',
            workspaces: [
              {
                id: legacy.workspace.id,
                name: legacy.workspace.name,
                kind: 'workspace',
                canReceiveDirectMessages: true,
                status: 'active',
                agents: (legacy.agents ?? []).map((agent) => ({
                  id: agent.id,
                  name: agent.name,
                  kind: 'agent',
                  role: agent.role,
                  status: agent.isEnabled === false ? 'inactive' : 'active',
                  skills: (agent.skillRefs ?? []).map((skillId) => ({
                    skillId,
                    name: skillId,
                    profileImpact: 'medium',
                  })),
                })),
              },
            ],
          },
        ],
        skillsCatalog: (legacy.skills ?? []).map(mapLegacySkill),
        toolsCatalog: [],
        status: legacy.runtime?.health?.ok === false ? 'paused' : 'active',
      }
    : null;

  return {
    version: '1.0',
    resolvedAt: new Date().toISOString(),
    agency,
    source: agency ? 'legacy-adapted' : 'empty',
    runtimeCapabilities: capabilities,
  };
}

function mapLegacySkill(skill: {
  id: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
}): SkillSpec {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description ?? `${skill.category ?? 'General'} skill`,
    profileImpact: 'medium',
    version: skill.version,
    tags: skill.category ? [skill.category] : undefined,
  };
}

export function mapLegacyToolsToCatalog(
  tools: Array<{ id: string; name: string; description?: string; kind?: string }>,
): ToolSpec[] {
  return tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description ?? 'Legacy tool',
    kind: mapToolKind(tool.kind),
  }));
}

function mapToolKind(kind?: string): ToolSpec['kind'] {
  if (kind === 'mcp' || kind === 'webhook' || kind === 'browser' || kind === 'file_search' || kind === 'db' || kind === 'crm' || kind === 'api' || kind === 'custom') {
    return kind;
  }
  return 'custom';
}
