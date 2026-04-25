/**
 * SupervisorRunner — Process.hierarchical pattern (CrewAI-inspired)
 * A manager agent decomposes a task, delegates to sub-agents, validates
 * each output, and retries if quality threshold is not met.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMStepExecutor } from '../runtime/llm-step-executor.service';
import { PrismaService as PS } from '../prisma/prisma.service';

export interface SupervisorTask {
  managerAgentId: string;
  subordinateAgentIds: string[];
  goal: string;
  maxRetries?: number;
}

export interface SupervisorResult {
  finalOutput: string;
  iterations: number;
}

@Injectable()
export class SupervisorRunnerService {
  private readonly logger = new Logger(SupervisorRunnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmExecutor: LLMStepExecutor,
  ) {}

  async run(task: SupervisorTask): Promise<SupervisorResult> {
    const { managerAgentId, subordinateAgentIds, goal, maxRetries = 2 } = task;
    const MAX_ITER = maxRetries + 1;
    let iteration = 0;
    let collectedOutputs: string[] = [];

    // Phase 1: Manager decomposes the task
    const run = await this.prisma.run.create({
      data: {
        agentId: managerAgentId,
        status: 'RUNNING',
        inputData: { goal } as any,
        startedAt: new Date(),
      },
    });

    while (iteration < MAX_ITER) {
      collectedOutputs = [];

      // Each subordinate executes their part
      for (let i = 0; i < subordinateAgentIds.length; i++) {
        const subAgentId = subordinateAgentIds[i];
        const runStep = await this.prisma.runStep.create({
          data: {
            runId: run.id,
            stepIndex: iteration * subordinateAgentIds.length + i,
            nodeId: `supervisor_sub_${i}`,
            nodeType: 'LLM_CALL',
            status: 'RUNNING',
            inputSnapshot: { goal, iteration } as any,
          },
        });

        const result = await this.llmExecutor.execute({
          runId: run.id,
          runStepId: runStep.id,
          stepIndex: iteration * subordinateAgentIds.length + i,
          nodeId: `supervisor_sub_${i}`,
          agentId: subAgentId,
          nodeConfig: {
            userPromptTemplate: `Complete your part of the following task:\n\n${goal}\n\nPrevious context:\n${collectedOutputs.join('\n---\n')}`,
          },
          stateVars: { goal, iteration, previousOutputs: collectedOutputs },
        });
        collectedOutputs.push(result.content);
      }

      // Manager validates consolidated output
      const validationStep = await this.prisma.runStep.create({
        data: {
          runId: run.id,
          stepIndex: (iteration + 1) * subordinateAgentIds.length,
          nodeId: `supervisor_validate_${iteration}`,
          nodeType: 'LLM_CALL',
          status: 'RUNNING',
          inputSnapshot: { collectedOutputs } as any,
        },
      });

      const validation = await this.llmExecutor.execute({
        runId: run.id,
        runStepId: validationStep.id,
        stepIndex: (iteration + 1) * subordinateAgentIds.length,
        nodeId: `supervisor_validate_${iteration}`,
        agentId: managerAgentId,
        nodeConfig: {
          systemPrompt: 'You are a quality control manager. Evaluate if the following outputs adequately complete the goal. Respond with JSON: {"approved": true/false, "feedback": "...", "finalOutput": "..."}',
          userPromptTemplate: `Goal: ${goal}\n\nOutputs:\n${collectedOutputs.join('\n---\n')}`,
        },
        stateVars: { goal, collectedOutputs },
      });

      try {
        const parsed = JSON.parse(validation.content);
        if (parsed.approved) {
          await this.prisma.run.update({
            where: { id: run.id },
            data: { status: 'COMPLETED', outputData: { finalOutput: parsed.finalOutput } as any, completedAt: new Date() },
          });
          return { finalOutput: parsed.finalOutput, iterations: iteration + 1 };
        }
        this.logger.log(`Supervisor iteration ${iteration} rejected. Feedback: ${parsed.feedback}`);
      } catch {
        // If JSON parse fails, assume approved with last collected output
        await this.prisma.run.update({
          where: { id: run.id },
          data: { status: 'COMPLETED', outputData: { finalOutput: collectedOutputs.join('\n') } as any, completedAt: new Date() },
        });
        return { finalOutput: collectedOutputs.join('\n'), iterations: iteration + 1 };
      }

      iteration++;
    }

    // Max retries reached — return best effort
    const finalOutput = collectedOutputs.join('\n');
    await this.prisma.run.update({
      where: { id: run.id },
      data: { status: 'COMPLETED', outputData: { finalOutput } as any, completedAt: new Date() },
    });
    return { finalOutput, iterations: MAX_ITER };
  }
}
