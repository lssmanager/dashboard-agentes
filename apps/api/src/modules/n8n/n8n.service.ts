/**
 * N8nService
 * Integrates n8n workflows into the Agent Visual Studio.
 * - Syncs workflows from n8n instance via REST API
 * - Triggers workflows with payload (used by N8nWorkflowNode in FlowEngine)
 * - Registers workflows as Skills available to all agents
 * n8n base URL and API key stored encrypted in DB (or env for server-level config)
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface N8nWorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  webhookUrl?: string;
}

export interface N8nTriggerResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get baseUrl(): string {
    return process.env.N8N_BASE_URL ?? 'http://localhost:5678';
  }

  private get apiKey(): string {
    return process.env.N8N_API_KEY ?? '';
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': this.apiKey,
    };
  }

  /** Fetch all workflows from n8n and sync to local DB */
  async syncWorkflows(): Promise<N8nWorkflowSummary[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        headers: this.headers(),
      });
      const json = (await res.json()) as { data: any[] };
      const workflows = json.data ?? [];

      for (const wf of workflows) {
        await this.prisma.n8nWorkflow.upsert({
          where: { n8nWorkflowId: String(wf.id) },
          create: {
            n8nWorkflowId: String(wf.id),
            name: wf.name,
            description: wf.description,
            isActive: wf.active,
            webhookUrl: wf.nodes?.find((n: any) => n.type === 'n8n-nodes-base.webhook')?.parameters?.path
              ? `${this.baseUrl}/webhook/${wf.nodes.find((n: any) => n.type === 'n8n-nodes-base.webhook')?.parameters?.path}`
              : undefined,
          },
          update: {
            name: wf.name,
            isActive: wf.active,
          },
        });
      }

      this.logger.log(`Synced ${workflows.length} n8n workflows`);
      return workflows.map((wf) => ({ id: String(wf.id), name: wf.name, active: wf.active }));
    } catch (err: any) {
      this.logger.error(`Failed to sync n8n workflows: ${err.message}`);
      return [];
    }
  }

  /** Trigger a workflow by its n8n workflow ID with a payload */
  async trigger(n8nWorkflowId: string, payload: Record<string, unknown>): Promise<N8nTriggerResult> {
    const wf = await this.prisma.n8nWorkflow.findFirst({
      where: { n8nWorkflowId },
    });

    if (!wf) return { success: false, error: `Workflow ${n8nWorkflowId} not found in DB` };

    const url = wf.webhookUrl ?? `${this.baseUrl}/api/v1/workflows/${n8nWorkflowId}/execute`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      this.logger.log(`n8n workflow ${n8nWorkflowId} triggered`);
      return { success: true, data };
    } catch (err: any) {
      this.logger.error(`n8n trigger failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /** List all workflows from DB (for the Studio Skills picker) */
  async listFromDb() {
    return this.prisma.n8nWorkflow.findMany({ orderBy: { name: 'asc' } });
  }
}
