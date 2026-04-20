import type { AgencySpec } from '../../../packages/canonical-types/src';
import { SkillsPropagationService } from '../src/modules/skills/skills-propagation.service';

function buildAgencyFixture(): AgencySpec {
  return {
    id: 'agency-1',
    name: 'Agency',
    kind: 'agency',
    canReceiveDirectMessages: true,
    status: 'active',
    skillsCatalog: [
      { id: 'skill-global', name: 'Global Skill', description: 'x', profileImpact: 'high' },
    ],
    toolsCatalog: [
      { id: 'tool-global', name: 'Global Tool', description: 'y', kind: 'api' },
    ],
    departments: [
      {
        id: 'dept-1',
        name: 'Dept',
        kind: 'department',
        canReceiveDirectMessages: true,
        status: 'active',
        workspaces: [
          {
            id: 'ws-1',
            name: 'Workspace',
            kind: 'workspace',
            canReceiveDirectMessages: true,
            status: 'active',
            skills: [{ skillId: 'skill-global', name: 'Workspace Override', profileImpact: 'medium' }],
            tools: [{ toolId: 'tool-global', name: 'Workspace Tool Override' }],
            agents: [
              {
                id: 'agent-1',
                name: 'Agent',
                kind: 'agent',
                status: 'active',
                subagents: [{ id: 'sub-1', name: 'Sub', kind: 'subagent', status: 'active' }],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('SkillsPropagationService', () => {
  it('propagates top-down refs and preserves local overrides', () => {
    const service = new SkillsPropagationService();
    const propagated = service.propagateTopDown(buildAgencyFixture());
    const workspace = propagated.departments[0]?.workspaces[0];
    const agent = workspace?.agents[0];
    const subagent = agent?.subagents?.[0];

    expect(workspace?.skills?.[0]?.overridden).toBe(true);
    expect(workspace?.tools?.[0]?.overridden).toBe(true);
    expect(agent?.skills?.some((item) => item.skillId === 'skill-global')).toBe(true);
    expect(subagent?.tools?.some((item) => item.toolId === 'tool-global')).toBe(true);
  });

  it('creates additive bottom-up profile proposals', () => {
    const service = new SkillsPropagationService();
    const proposal = service.createBottomUpProposal({
      originId: 'agent-1',
      originLevel: 'agent',
      targetId: 'ws-1',
      targetLevel: 'workspace',
      skillIds: ['skill-a'],
      toolIds: ['tool-a'],
      reason: 'Needed by refined flow',
    });

    expect(proposal.proposalKind).toBe('bottom-up-profile-change');
    expect(proposal.changes).toHaveLength(2);
    expect(proposal.changes[0]?.reason).toBe('Needed by refined flow');
  });
});
