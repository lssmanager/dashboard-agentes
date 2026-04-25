/**
 * ApprovalsService
 * Manages the Human-in-the-Loop lifecycle (LangGraph interrupt() pattern).
 * - Lists pending approvals for the Operations > Pending Actions panel
 * - Resolves approvals (approve/reject) and resumes the interrupted run
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckpointService } from '../runtime/checkpoint.service';
import { ApprovalStatus } from '@prisma/client';

export interface ResolveApprovalDto {
  status: 'APPROVED' | 'REJECTED';
  resolvedBy: string;
  note?: string;
}

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkpoint: CheckpointService,
  ) {}

  async listPending() {
    return this.prisma.pendingApproval.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: { runStep: { include: { run: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(approvalId: string, dto: ResolveApprovalDto) {
    const approval = await this.prisma.pendingApproval.findUnique({
      where: { id: approvalId },
      include: { runStep: true },
    });

    if (!approval) throw new NotFoundException(`Approval ${approvalId} not found`);
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error(`Approval ${approvalId} is already ${approval.status}`);
    }

    // Update approval record
    await this.prisma.pendingApproval.update({
      where: { id: approvalId },
      data: {
        status: dto.status as ApprovalStatus,
        resolvedBy: dto.resolvedBy,
        resolvedNote: dto.note,
        resolvedAt: new Date(),
      },
    });

    if (dto.status === 'APPROVED') {
      // Resume the run from the interrupted step
      await this.checkpoint.resume(approval.runStepId);
      await this.prisma.run.update({
        where: { id: approval.runStep.runId },
        data: { status: 'RUNNING' },
      });
      this.logger.log(`Run ${approval.runStep.runId} resumed after approval by ${dto.resolvedBy}`);
    } else {
      // Mark run as failed/rejected
      await this.prisma.runStep.update({
        where: { id: approval.runStepId },
        data: { status: 'FAILED', errorMsg: `Rejected by ${dto.resolvedBy}: ${dto.note ?? ''}` },
      });
      await this.prisma.run.update({
        where: { id: approval.runStep.runId },
        data: { status: 'FAILED', errorMsg: `Rejected by ${dto.resolvedBy}` },
      });
      this.logger.log(`Run ${approval.runStep.runId} rejected by ${dto.resolvedBy}`);
    }

    return { success: true, status: dto.status };
  }
}
