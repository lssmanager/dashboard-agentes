/**
 * CheckpointService
 * LangGraph PostgresSaver pattern — saves/restores full graph state per RunStep.
 * Enables durable execution: if a run fails at step N, it resumes from step N-1's checkpoint.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StepStatus } from '@prisma/client';

export interface GraphState {
  runId: string;
  stepIndex: number;
  nodeId: string;
  state: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Save a checkpoint after a step completes successfully */
  async save(runStepId: string, graphState: GraphState): Promise<void> {
    await this.prisma.runStep.update({
      where: { id: runStepId },
      data: {
        checkpoint_data: graphState as any,
        status: StepStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    this.logger.debug(`Checkpoint saved for step ${runStepId}`);
  }

  /** Restore the last successful checkpoint for a run */
  async restore(runId: string): Promise<GraphState | null> {
    const lastCheckpoint = await this.prisma.runStep.findFirst({
      where: {
        runId,
        status: StepStatus.COMPLETED,
        checkpoint_data: { not: null },
      },
      orderBy: { stepIndex: 'desc' },
    });

    if (!lastCheckpoint?.checkpoint_data) {
      this.logger.log(`No checkpoint found for run ${runId}, starting fresh`);
      return null;
    }

    this.logger.log(
      `Restoring run ${runId} from step ${lastCheckpoint.stepIndex}`,
    );
    return lastCheckpoint.checkpoint_data as unknown as GraphState;
  }

  /** Mark a step as interrupted (HumanApprovalNode) */
  async interrupt(
    runStepId: string,
    reason: string,
    contextData: Record<string, unknown>,
    title: string,
    description: string,
  ): Promise<void> {
    await this.prisma.runStep.update({
      where: { id: runStepId },
      data: {
        status: StepStatus.INTERRUPTED,
        interruptReason: reason,
      },
    });

    await this.prisma.pendingApproval.create({
      data: {
        runStepId,
        title,
        description,
        contextData: contextData as any,
      },
    });

    this.logger.log(`Run step ${runStepId} interrupted: ${reason}`);
  }

  /** Resume after approval — marks step as running again */
  async resume(runStepId: string): Promise<void> {
    await this.prisma.runStep.update({
      where: { id: runStepId },
      data: { status: StepStatus.RUNNING, interruptReason: null },
    });
    this.logger.log(`Run step ${runStepId} resumed`);
  }
}
