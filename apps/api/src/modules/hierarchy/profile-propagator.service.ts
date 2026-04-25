/**
 * ProfilePropagatorService
 * When an agent is added/modified at any hierarchy level, automatically
 * recalculates the system prompts of parent scopes (Workspace → Department → Agency)
 * so orquestrators always know what they can delegate.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfilePropagatorService {
  private readonly logger = new Logger(ProfilePropagatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Call after any agent is created, updated, or deleted */
  async propagateFromAgent(agentId: string): Promise<void> {
    const agent = await this.prisma.agent.findUniqueOrThrow({
      where: { id: agentId },
      include: { workspace: { include: { department: { include: { agency: true } } } } },
    });

    await this.recalculateWorkspace(agent.workspaceId);
    await this.recalculateDepartment(agent.workspace.departmentId);
    await this.recalculateAgency(agent.workspace.department.agencyId);
  }

  private async recalculateWorkspace(workspaceId: string): Promise<void> {
    const agents = await this.prisma.agent.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });

    const agentList = agents
      .map((a) => `- ${a.name}${a.role ? ` (${a.role})` : ''}: ${a.goal || a.systemPrompt?.slice(0, 100) || 'No description'}`)
      .join('\n');

    const systemPrompt = agents.length
      ? `You orchestrate the following agents:\n${agentList}\n\nDelegate tasks to the appropriate agent based on their role and capabilities.`
      : 'No agents assigned yet.';

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { systemPrompt },
    });
    this.logger.debug(`Workspace ${workspaceId} prompt updated (${agents.length} agents)`);
  }

  private async recalculateDepartment(departmentId: string): Promise<void> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { departmentId },
      include: { agents: { orderBy: { name: 'asc' } } },
    });

    const lines: string[] = [];
    for (const ws of workspaces) {
      lines.push(`Workspace: ${ws.name}`);
      for (const agent of ws.agents) {
        lines.push(`  - ${agent.name}${agent.role ? ` (${agent.role})` : ''}`);
      }
    }

    const systemPrompt = lines.length
      ? `You manage the following workspaces and their agents:\n${lines.join('\n')}\n\nRoute tasks to the correct workspace.`
      : 'No workspaces assigned yet.';

    await this.prisma.department.update({
      where: { id: departmentId },
      data: { systemPrompt },
    });
    this.logger.debug(`Department ${departmentId} prompt updated`);
  }

  private async recalculateAgency(agencyId: string): Promise<void> {
    const departments = await this.prisma.department.findMany({
      where: { agencyId },
      include: {
        workspaces: {
          include: { agents: { orderBy: { name: 'asc' } } },
        },
      },
    });

    const lines: string[] = [];
    for (const dept of departments) {
      const agentCount = dept.workspaces.reduce((acc, ws) => acc + ws.agents.length, 0);
      lines.push(`Department: ${dept.name} (${agentCount} agents)`);
    }

    const systemPrompt = lines.length
      ? `You are the top-level orchestrator. You have access to these departments:\n${lines.join('\n')}\n\nDecompose complex tasks and delegate to the appropriate department.`
      : 'No departments configured yet.';

    await this.prisma.agency.update({
      where: { id: agencyId },
      data: { systemPrompt },
    });
    this.logger.debug(`Agency ${agencyId} prompt updated`);
  }
}
