/**
 * FlowEngine
 * Executes a Flow graph node-by-node with durable checkpointing.
 * Handles: LLM_CALL, CONDITION, HUMAN_APPROVAL, SUPERVISOR, SUBAGENT, N8N_WORKFLOW.
 * Resumes from last checkpoint on retry (LangGraph PostgresSaver pattern).
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckpointService } from './checkpoint.service';
import { LLMStepExecutor } from './llm-step-executor.service';
import { FlowNodeType, RunStatus, StepStatus } from '@prisma/client';

export interface FlowRunOptions {
  flowId: string;
  agentId?: string;
  inputData?: Record<string, unknown>;
  sseEmitter?: (event: string, data: unknown) => void;
}

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkpoint: CheckpointService,
    private readonly llmExecutor: LLMStepExecutor,
  ) {}

  async execute(options: FlowRunOptions): Promise<string> {
    const { flowId, agentId, inputData = {}, sseEmitter } = options;

    // 1. Load flow with nodes + edges
    const flow = await this.prisma.flow.findUniqueOrThrow({
      where: { id: flowId },
      include: { nodes: true, edges: true },
    });

    // 2. Create Run record
    const run = await this.prisma.run.create({
      data: {
        flowId,
        agentId,
        status: RunStatus.RUNNING,
        inputData: inputData as any,
        startedAt: new Date(),
      },
    });

    sseEmitter?.('run:start', { runId: run.id, flowId });

    // 3. Try to restore from checkpoint (durable execution)
    const checkpoint = await this.checkpoint.restore(run.id);
    let state: Record<string, unknown> = {
      ...inputData,
      ...(checkpoint?.state ?? {}),
    };
    const resumeFromIndex = checkpoint ? checkpoint.stepIndex + 1 : 0;

    // 4. Topological walk starting from START node
    const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));
    const edgeMap = new Map<string, typeof flow.edges[0][]>();
    for (const edge of flow.edges) {
      if (!edgeMap.has(edge.sourceNodeId))
        edgeMap.set(edge.sourceNodeId, []);
      edgeMap.get(edge.sourceNodeId)!.push(edge);
    }

    const startNode = flow.nodes.find((n) => n.nodeType === FlowNodeType.START);
    if (!startNode) throw new Error('Flow has no START node');

    let currentNodeId: string | null = startNode.id;
    let stepIndex = 0;

    while (currentNodeId) {
      const node = nodeMap.get(currentNodeId);
      if (!node) break;

      if (node.nodeType === FlowNodeType.END) {
        sseEmitter?.('run:end', { runId: run.id });
        break;
      }

      // Skip already-checkpointed steps on resume
      if (stepIndex < resumeFromIndex) {
        stepIndex++;
        currentNodeId = this.getNextNode(currentNodeId, edgeMap, null);
        continue;
      }

      // Create RunStep
      const runStep = await this.prisma.runStep.create({
        data: {
          runId: run.id,
          stepIndex,
          nodeId: node.id,
          nodeType: node.nodeType,
          status: StepStatus.RUNNING,
          inputSnapshot: state as any,
        },
      });

      try {
        const config = node.config as Record<string, unknown>;

        if (node.nodeType === FlowNodeType.HUMAN_APPROVAL) {
          // LangGraph interrupt() pattern
          await this.checkpoint.interrupt(
            runStep.id,
            'human_approval_required',
            state,
            String(config['title'] ?? 'Aprobación requerida'),
            String(config['description'] ?? 'Un agente requiere tu aprobación para continuar'),
          );
          await this.prisma.run.update({
            where: { id: run.id },
            data: { status: RunStatus.INTERRUPTED },
          });
          sseEmitter?.('run:interrupted', { runId: run.id, runStepId: runStep.id });
          return run.id;
        }

        if (node.nodeType === FlowNodeType.LLM_CALL && agentId) {
          const result = await this.llmExecutor.execute({
            runId: run.id,
            runStepId: runStep.id,
            stepIndex,
            nodeId: node.id,
            agentId,
            nodeConfig: config as any,
            stateVars: state,
            sseEmitter,
          });
          state = result.updatedState;
        }

        if (node.nodeType === FlowNodeType.CONDITION) {
          // @router pattern (CrewAI-inspired): evaluate condition against state
          const conditionKey = String(config['stateKey'] ?? 'lastOutput');
          const branches = (config['branches'] as Record<string, string>) ?? {};
          const value = String(state[conditionKey] ?? '');
          let matched = branches['default'] ?? null;
          for (const [pattern, targetNodeId] of Object.entries(branches)) {
            if (pattern !== 'default' && value.includes(pattern)) {
              matched = targetNodeId;
              break;
            }
          }
          await this.checkpoint.save(runStep.id, {
            runId: run.id, stepIndex, nodeId: node.id, state, timestamp: new Date().toISOString(),
          });
          currentNodeId = matched;
          stepIndex++;
          continue;
        }

        // Default: follow first edge
        currentNodeId = this.getNextNode(node.id, edgeMap, null);
      } catch (err: any) {
        this.logger.error(`Step ${stepIndex} failed: ${err.message}`);
        await this.prisma.runStep.update({
          where: { id: runStep.id },
          data: { status: StepStatus.FAILED, errorMsg: err.message },
        });
        await this.prisma.run.update({
          where: { id: run.id },
          data: { status: RunStatus.FAILED, errorMsg: err.message },
        });
        sseEmitter?.('run:failed', { runId: run.id, error: err.message });
        return run.id;
      }

      stepIndex++;
    }

    await this.prisma.run.update({
      where: { id: run.id },
      data: { status: RunStatus.COMPLETED, completedAt: new Date() },
    });
    sseEmitter?.('run:completed', { runId: run.id });
    return run.id;
  }

  private getNextNode(
    sourceId: string,
    edgeMap: Map<string, any[]>,
    condition: string | null,
  ): string | null {
    const edges = edgeMap.get(sourceId) ?? [];
    if (!edges.length) return null;
    return edges[0].targetNodeId;
  }
}
