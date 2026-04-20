import { BuilderAgentService } from '../src/modules/builder-agent/builder-agent.service';

describe('BuilderAgentService', () => {
  it('returns deduplicated skills/tools/collaborators for agent output', async () => {
    const service = new BuilderAgentService() as any;

    service.studioService = {
      getCanonicalState: async () => ({
        agency: { id: 'agency-1', name: 'Agency' },
        departments: [{ id: 'dept-1', name: 'Dept', workspaceIds: ['ws-1'] }],
        workspaces: [{ id: 'ws-1', name: 'Workspace', departmentId: 'dept-1', skillIds: ['skill-1'] }],
        agents: [
          {
            id: 'agent-1',
            name: 'Agent A',
            workspaceId: 'ws-1',
            description: 'desc',
            skillRefs: ['skill-1', 'skill-1'],
            permissions: { tools: ['tool-a', 'tool-a'] },
          },
        ],
        subagents: [
          { id: 'sub-1', name: 'Sub A', parentAgentId: 'agent-1', skillRefs: [], permissions: { tools: [] } },
          { id: 'sub-1', name: 'Sub A', parentAgentId: 'agent-1', skillRefs: [], permissions: { tools: [] } },
        ],
        catalog: {
          skills: [{ id: 'skill-1', name: 'Skill A' }],
          tools: [{ id: 'tool-a', name: 'Tool A' }],
        },
      }),
    };
    service.compiler = { compileCurrent: async () => ({ artifacts: [], diagnostics: [] }) };
    service.diffService = { diffArtifacts: () => [{ path: 'IDENTITY.md', status: 'updated' }] };

    const result = await service.getFunctionSummary('agent', 'agent-1');

    expect(result.entityLevel).toBe('agent');
    expect(result.skills).toEqual(['Skill A']);
    expect(result.tools).toEqual(['tool-a']);
    expect(result.collaborators).toEqual(['Sub A']);
  });
});
