/**
 * HierarchyOrchestrator
 * AutoGen GroupChat pattern adapted to Node.js/NestJS.
 * Routes a message from an incoming channel session to the correct scope
 * (Agency → Department → Workspace → Agent) and executes the agent.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FlowEngineService } from '../runtime/flow-engine.service';
import { LLMStepExecutor } from '../runtime/llm-step-executor.service';

export interface IncomingMessage {
  channelType: string;
  channelSessionId: string;
  agentId: string; // resolved by ChannelBinding
  content: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestratorResult {
  runId: string;
  response: string;
  delegatedTo?: string;
}

@Injectable()
export class HierarchyOrchestratorService {
  private readonly logger = new Logger(HierarchyOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flowEngine: FlowEngineService,
    private readonly llmExecutor: LLMStepExecutor,
  ) {}

  async handle(msg: IncomingMessage): Promise<OrchestratorResult> {
    const agent = await this.prisma.agent.findUniqueOrThrow({
      where: { id: msg.agentId },
      include: {
        workspace: {
          include: {
            department: { include: { agency: true } },
          },
        },
        subagents: true,
      },
    });

    // If agent has an active flow, run through FlowEngine
    const activeFlow = await this.prisma.flow.findFirst({
      where: { agentId: agent.id, isActive: true },
    });

    if (activeFlow) {
      this.logger.log(`Routing to FlowEngine: flow=${activeFlow.id}`);
      const runId = await this.flowEngine.execute({
        flowId: activeFlow.id,
        agentId: agent.id,
        inputData: { userMessage: msg.content, ...msg.metadata },
      });
      return { runId, response: 'Flow started', delegatedTo: activeFlow.id };
    }

    // Direct LLM execution (no flow)
    this.logger.log(`Direct LLM execution: agent=${agent.id}`);
    const run = await this.prisma.run.create({
      data: {
        agentId: agent.id,
        status: 'RUNNING',
        inputData: { userMessage: msg.content } as any,
        startedAt: new Date(),
      },
    });

    const runStep = await this.prisma.runStep.create({
      data: {
        runId: run.id,
        stepIndex: 0,
        nodeId: 'direct',
        nodeType: 'LLM_CALL',
        status: 'RUNNING',
        inputSnapshot: { userMessage: msg.content } as any,
      },
    });

    const result = await this.llmExecutor.execute({
      runId: run.id,
      runStepId: runStep.id,
      stepIndex: 0,
      nodeId: 'direct',
      agentId: agent.id,
      nodeConfig: { userPromptTemplate: msg.content },
      stateVars: { input: msg.content },
    });

    await this.prisma.run.update({
      where: { id: run.id },
      data: { status: 'COMPLETED', outputData: { response: result.content } as any, completedAt: new Date() },
    });

    return { runId: run.id, response: result.content };
  }
}
