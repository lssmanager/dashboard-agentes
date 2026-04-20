import type {
  AgencySpec,
  AgentSpec,
  SkillRef,
  SubagentSpec,
  ToolRef,
} from '../../../../../packages/canonical-types/src';

export interface BottomUpProfileChangeProposal {
  proposalKind: 'bottom-up-profile-change';
  originId: string;
  originLevel: 'subagent' | 'agent' | 'workspace';
  targetLevel: 'agent' | 'workspace' | 'department' | 'agency';
  targetId: string;
  changes: Array<{
    type: 'add_skill_ref' | 'add_tool_ref' | 'propose_corefile_diff';
    skillId?: string;
    toolId?: string;
    target?: string;
    patch?: string;
    reason: string;
  }>;
  createdAt: string;
}

export class SkillsPropagationService {
  propagateTopDown(agency: AgencySpec): AgencySpec {
    const inheritedSkills = agency.skillsCatalog.map((skill): SkillRef => ({
      skillId: skill.id,
      name: skill.name,
      profileImpact: skill.profileImpact,
      inherited: true,
    }));
    const inheritedTools = agency.toolsCatalog.map((tool): ToolRef => ({
      toolId: tool.id,
      name: tool.name,
      inherited: true,
    }));

    return {
      ...agency,
      departments: agency.departments.map((department) => {
        const departmentSkills = mergeSkillRefs(inheritedSkills, department.skills ?? []);
        const departmentTools = mergeToolRefs(inheritedTools, department.tools ?? []);

        return {
          ...department,
          skills: departmentSkills,
          tools: departmentTools,
          workspaces: department.workspaces.map((workspace) => {
            const workspaceSkills = mergeSkillRefs(departmentSkills, workspace.skills ?? []);
            const workspaceTools = mergeToolRefs(departmentTools, workspace.tools ?? []);

            return {
              ...workspace,
              skills: workspaceSkills,
              tools: workspaceTools,
              agents: workspace.agents.map((agent) =>
                this.propagateAgentRefs(agent, workspaceSkills, workspaceTools),
              ),
            };
          }),
        };
      }),
    };
  }

  createBottomUpProposal(input: {
    originId: string;
    originLevel: 'subagent' | 'agent' | 'workspace';
    targetLevel: 'agent' | 'workspace' | 'department' | 'agency';
    targetId: string;
    skillIds?: string[];
    toolIds?: string[];
    reason: string;
  }): BottomUpProfileChangeProposal {
    const skillChanges = (input.skillIds ?? []).map((skillId) => ({
      type: 'add_skill_ref' as const,
      skillId,
      reason: input.reason,
    }));
    const toolChanges = (input.toolIds ?? []).map((toolId) => ({
      type: 'add_tool_ref' as const,
      toolId,
      reason: input.reason,
    }));

    return {
      proposalKind: 'bottom-up-profile-change',
      originId: input.originId,
      originLevel: input.originLevel,
      targetLevel: input.targetLevel,
      targetId: input.targetId,
      changes: [...skillChanges, ...toolChanges],
      createdAt: new Date().toISOString(),
    };
  }

  private propagateAgentRefs(agent: AgentSpec, parentSkills: SkillRef[], parentTools: ToolRef[]): AgentSpec {
    const skills = mergeSkillRefs(parentSkills, agent.skills ?? []);
    const tools = mergeToolRefs(parentTools, agent.tools ?? []);

    return {
      ...agent,
      skills,
      tools,
      subagents: (agent.subagents ?? []).map((subagent) =>
        this.propagateSubagentRefs(subagent, skills, tools),
      ),
    };
  }

  private propagateSubagentRefs(
    subagent: SubagentSpec,
    parentSkills: SkillRef[],
    parentTools: ToolRef[],
  ): SubagentSpec {
    return {
      ...subagent,
      skills: mergeSkillRefs(parentSkills, subagent.skills ?? []),
      tools: mergeToolRefs(parentTools, subagent.tools ?? []),
    };
  }
}

function mergeSkillRefs(parentRefs: SkillRef[], localRefs: SkillRef[]): SkillRef[] {
  const localById = new Map(localRefs.map((ref) => [ref.skillId, ref] as const));
  const merged: SkillRef[] = [];

  for (const parent of parentRefs) {
    const local = localById.get(parent.skillId);
    if (local) {
      merged.push({
        ...local,
        inherited: false,
        overridden: true,
      });
      localById.delete(parent.skillId);
    } else {
      merged.push({ ...parent, inherited: true, overridden: false });
    }
  }

  for (const [, local] of localById) {
    merged.push({ ...local, inherited: false });
  }

  return merged;
}

function mergeToolRefs(parentRefs: ToolRef[], localRefs: ToolRef[]): ToolRef[] {
  const localById = new Map(localRefs.map((ref) => [ref.toolId, ref] as const));
  const merged: ToolRef[] = [];

  for (const parent of parentRefs) {
    const local = localById.get(parent.toolId);
    if (local) {
      merged.push({
        ...local,
        inherited: false,
        overridden: true,
      });
      localById.delete(parent.toolId);
    } else {
      merged.push({ ...parent, inherited: true, overridden: false });
    }
  }

  for (const [, local] of localById) {
    merged.push({ ...local, inherited: false });
  }

  return merged;
}
