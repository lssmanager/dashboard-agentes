import { DashboardScopeResolver } from '../src/modules/dashboard/scope-resolver.service';
import { adaptLegacyStudioStateToCanonical } from '../src/modules/studio/studio.adapter';
import type { LegacyStudioStateDto } from '../src/modules/studio/dto/studio-state.dto';

const LEGACY_STATE_FIXTURE: LegacyStudioStateDto = {
  workspace: {
    id: 'workspace-1',
    slug: 'workspace-1',
    name: 'Workspace One',
    description: 'Fixture workspace',
    owner: 'Engineering',
    defaultModel: 'gpt-5.4',
    agentIds: ['agent-1', 'subagent-1'],
    skillIds: ['skill-1'],
    flowIds: ['flow-1'],
    profileIds: ['profile-1'],
    policyRefs: [],
    routingRules: [],
    routines: [],
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  agents: [
    {
      id: 'agent-1',
      workspaceId: 'workspace-1',
      name: 'Main Agent',
      role: 'orchestrator',
      description: 'Main worker',
      instructions: 'Do the work',
      model: 'gpt-5.4',
      skillRefs: ['skill-1'],
      tags: [],
      visibility: 'workspace',
      executionMode: 'orchestrated',
      kind: 'agent',
      handoffRules: [],
      channelBindings: [],
      isEnabled: true,
    },
    {
      id: 'subagent-1',
      workspaceId: 'workspace-1',
      name: 'Specialist',
      role: 'specialist',
      description: 'Sub worker',
      instructions: 'Assist',
      model: 'gpt-5.4-mini',
      skillRefs: ['skill-1'],
      tags: [],
      visibility: 'workspace',
      executionMode: 'handoff',
      kind: 'subagent',
      parentAgentId: 'agent-1',
      handoffRules: [],
      channelBindings: [],
      isEnabled: true,
    },
  ],
  skills: [
    {
      id: 'skill-1',
      name: 'Planner',
      description: 'Planning skill',
      version: '1.0.0',
      category: 'operations',
      permissions: [],
      functions: [],
    },
  ],
  flows: [
    {
      id: 'flow-1',
      name: 'Main Flow',
      trigger: 'manual',
      isEnabled: true,
      nodes: [],
      edges: [],
    },
  ],
  policies: [{ id: 'policy-1', name: 'Default Policy' }],
  profiles: [
    {
      id: 'profile-1',
      name: 'Default',
      description: 'Default profile',
      defaultSkills: [],
      routines: [],
    },
  ],
  compile: { artifacts: [], diagnostics: [] },
  runtime: {
    health: { ok: true },
    diagnostics: {},
    sessions: { ok: true, payload: [] },
  },
  generatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Dashboard scope matrix', () => {
  it('enforces tabs and capability rules per level', () => {
    const canonical = adaptLegacyStudioStateToCanonical(LEGACY_STATE_FIXTURE);
    const resolver = new DashboardScopeResolver();

    const agency = resolver.resolve(canonical, { level: 'agency', id: canonical.agency.id });
    expect(agency.capabilities.canOpenStudio).toBe(false);
    expect(agency.capabilities.canUseProfileTab).toBe(false);
    expect(agency.capabilities.sessionsMode).toBe('aggregated');
    expect(agency.capabilities.runsMode).toBe('aggregated');

    const department = resolver.resolve(canonical, { level: 'department', id: canonical.departments[0]?.id });
    expect(department.capabilities.canOpenStudio).toBe(false);
    expect(department.capabilities.canUseProfileTab).toBe(false);
    expect(department.capabilities.sessionsMode).toBe('aggregated');

    const workspace = resolver.resolve(canonical, { level: 'workspace', id: canonical.workspaces[0]?.id });
    expect(workspace.capabilities.canOpenStudio).toBe(true);
    expect(workspace.capabilities.canUseProfileTab).toBe(true);
    expect(workspace.capabilities.sessionsMode).toBe('scoped');
    expect(workspace.capabilities.runsMode).toBe('scoped');

    const agent = resolver.resolve(canonical, { level: 'agent', id: canonical.agents[0]?.id });
    expect(agent.capabilities.canOpenStudio).toBe(true);
    expect(agent.capabilities.canUseProfileTab).toBe(true);

    const subagent = resolver.resolve(canonical, { level: 'subagent', id: canonical.subagents[0]?.id });
    expect(subagent.capabilities.canOpenStudio).toBe(true);
    expect(subagent.capabilities.canUseProfileTab).toBe(true);
  });
});
