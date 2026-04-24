import {
  BuilderAgentFunctionOutput,
  CanonicalNodeLevel,
} from '../../../../../packages/core-types/src';
import { builderAgentFunctionOutputSchema } from '../../../../../packages/schemas/src';
import { DeployDiffService } from '../deploy/deploy-diff.service';
import { StudioService } from '../studio/studio.service';
import { WorkspacesCompiler } from '../workspaces/workspaces.compiler';

const DEFAULT_INPUTS_BY_LEVEL: Record<CanonicalNodeLevel, string[]> = {
  agency: ['Inbound request', 'Global policies', 'Agency catalog'],
  department: ['Agency dispatch', 'Department constraints', 'Workspace capacity'],
  workspace: ['Direct message', 'Department handoff', 'Flow trigger'],
  agent: ['Workspace assignment', 'Task payload', 'Skill references'],
  subagent: ['Delegated subtask', 'Parent context', 'Scoped instructions'],
};

const DEFAULT_OUTPUTS_BY_LEVEL: Record<CanonicalNodeLevel, string[]> = {
  agency: ['Department dispatch', 'Global governance updates', 'Execution envelope'],
  department: ['Workspace routing', 'Operational refinement', 'Status signals'],
  workspace: ['Agent orchestration', 'Run steps', 'Diff proposals'],
  agent: ['Task result', 'Handoff proposal', 'Core-file change proposal'],
  subagent: ['Specialized result', 'Refinement proposal', 'Escalation signal'],
};

export class BuilderAgentService {
  private readonly studioService = new StudioService();
  private readonly compiler = new WorkspacesCompiler();
  private readonly diffService = new DeployDiffService();

  async getFunctionSummary(level: CanonicalNodeLevel, id: string): Promise<BuilderAgentFunctionOutput> {
    const canonical = await this.studioService.getCanonicalState();
    const compile = await this.compiler.compileCurrent();
    const proposedCoreFileDiffs = this.diffService.diffArtifacts(compile.artifacts).slice(0, 20);

    if (level === 'agency') {
      return builderAgentFunctionOutputSchema.parse({
        entityId: canonical.agency.id,
        entityLevel: 'agency',
        entityName: canonical.agency.name,
        whatItDoes: 'Coordinates departments, governance, and global catalog strategy',
        inputs: DEFAULT_INPUTS_BY_LEVEL.agency,
        outputs: DEFAULT_OUTPUTS_BY_LEVEL.agency,
        skills: canonical.catalog.skills.map((skill) => skill.name),
        tools: canonical.catalog.tools.map((tool) => tool.name),
        collaborators: canonical.departments.map((department) => department.name),
        proposedCoreFileDiffs,
      });
    }

    if (level === 'department') {
      const department = canonical.departments.find((item) => item.id === id) ?? canonical.departments[0];
      if (!department) {
        throw new Error('No department found in canonical state');
      }
      return builderAgentFunctionOutputSchema.parse({
        entityId: department.id,
        entityLevel: 'department',
        entityName: department.name,
        whatItDoes: 'Routes intents from agency to workspaces and proposes operational refinements',
        inputs: DEFAULT_INPUTS_BY_LEVEL.department,
        outputs: DEFAULT_OUTPUTS_BY_LEVEL.department,
        skills: canonical.catalog.skills.map((skill) => skill.name),
        tools: canonical.catalog.tools.map((tool) => tool.name),
        collaborators: canonical.workspaces
          .filter((workspace) => workspace.departmentId === department.id)
          .map((workspace) => workspace.name),
        proposedCoreFileDiffs,
      });
    }

    if (level === 'workspace') {
      const workspace = canonical.workspaces.find((item) => item.id === id) ?? canonical.workspaces[0];
      if (!workspace) {
        throw new Error('No workspace found in canonical state');
      }
      const workspaceSkills = canonical.catalog.skills
        .filter((skill) => workspace.skillIds.includes(skill.id))
        .map((skill) => skill.name);
      return builderAgentFunctionOutputSchema.parse({
        entityId: workspace.id,
        entityLevel: 'workspace',
        entityName: workspace.name,
        whatItDoes: 'Executes work by orchestrating agents, subagents, flows, and diff lifecycle',
        inputs: DEFAULT_INPUTS_BY_LEVEL.workspace,
        outputs: DEFAULT_OUTPUTS_BY_LEVEL.workspace,
        skills: workspaceSkills,
        tools: canonical.catalog.tools.map((tool) => tool.name),
        collaborators: canonical.agents
          .filter((agent) => agent.workspaceId === workspace.id)
          .map((agent) => agent.name),
        proposedCoreFileDiffs,
      });
    }

    if (level === 'subagent') {
      const subagent = canonical.subagents.find((item) => item.id === id) ?? canonical.subagents[0];
      if (!subagent) {
        throw new Error('No subagent found in canonical state');
      }
      return builderAgentFunctionOutputSchema.parse({
        entityId: subagent.id,
        entityLevel: 'subagent',
        entityName: subagent.name,
        whatItDoes: subagent.description || 'Executes delegated specialized tasks under an agent',
        inputs: DEFAULT_INPUTS_BY_LEVEL.subagent,
        outputs: DEFAULT_OUTPUTS_BY_LEVEL.subagent,
        skills: canonical.catalog.skills
          .filter((skill) => (subagent.skillRefs ?? []).includes(skill.id))
          .map((skill) => skill.name),
        tools: subagent.permissions?.tools ?? [],
        collaborators: canonical.agents
          .filter((agent) => agent.id === subagent.parentAgentId)
          .map((agent) => agent.name),
        proposedCoreFileDiffs,
      });
    }

    const agent = canonical.agents.find((item) => item.id === id) ?? canonical.agents[0];
    if (!agent) {
      throw new Error('No agent found in canonical state');
    }
    return builderAgentFunctionOutputSchema.parse({
      entityId: agent.id,
      entityLevel: 'agent',
      entityName: agent.name,
      whatItDoes: agent.description || 'Executes delegated tasks in the workspace execution graph',
      inputs: DEFAULT_INPUTS_BY_LEVEL.agent,
      outputs: DEFAULT_OUTPUTS_BY_LEVEL.agent,
      skills: canonical.catalog.skills
        .filter((skill) => (agent.skillRefs ?? []).includes(skill.id))
        .map((skill) => skill.name),
      tools: agent.permissions?.tools ?? [],
      collaborators: canonical.subagents
        .filter((subagent) => subagent.parentAgentId === agent.id)
        .map((subagent) => subagent.name),
      proposedCoreFileDiffs,
    });
  }
}
