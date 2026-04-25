/**
 * LLMStepExecutor
 * Executes a single LLM_CALL node within a Flow run.
 * Reads effective config from scope (agent model + credentials from DB).
 * Streams token deltas via SSE if sseEmitter is provided.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckpointService, GraphState } from './checkpoint.service';
import { CryptoService } from '../crypto/crypto.service';

export interface LLMNodeConfig {
  systemPrompt?: string;
  userPromptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
  modelOverride?: string;
}

export interface StepInput {
  runId: string;
  runStepId: string;
  stepIndex: number;
  nodeId: string;
  agentId: string;
  nodeConfig: LLMNodeConfig;
  stateVars: Record<string, unknown>;
  sseEmitter?: (event: string, data: unknown) => void;
}

export interface StepOutput {
  content: string;
  tokensUsed: number;
  costUsd: number;
  updatedState: Record<string, unknown>;
}

@Injectable()
export class LLMStepExecutor {
  private readonly logger = new Logger(LLMStepExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkpoint: CheckpointService,
    private readonly crypto: CryptoService,
  ) {}

  async execute(input: StepInput): Promise<StepOutput> {
    const { runId, runStepId, stepIndex, agentId, nodeConfig, stateVars } =
      input;

    // 1. Load agent + provider from DB
    const agent = await this.prisma.agent.findUniqueOrThrow({
      where: { id: agentId },
      include: { llmProvider: true },
    });

    if (!agent.llmProvider) {
      throw new Error(`Agent ${agentId} has no LLM provider configured`);
    }

    // 2. Decrypt API key
    const apiKey = this.crypto.decrypt(agent.llmProvider.apiKeyEnc);
    const model =
      nodeConfig.modelOverride ??
      agent.llmProvider.defaultModel ??
      'gpt-4o-mini';
    const baseUrl =
      agent.llmProvider.baseUrl ?? 'https://api.openai.com/v1';

    // 3. Build messages — role+goal+backstory (CrewAI-inspired) + node prompt
    const systemMsg = [
      agent.systemPrompt,
      agent.role ? `Role: ${agent.role}` : '',
      agent.goal ? `Goal: ${agent.goal}` : '',
      agent.backstory ? `Backstory: ${agent.backstory}` : '',
      nodeConfig.systemPrompt ?? '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const userMsg = this.interpolate(
      nodeConfig.userPromptTemplate ?? '{{input}}',
      stateVars,
    );

    // 4. Call LLM (OpenAI-compatible endpoint)
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: nodeConfig.temperature ?? 0.7,
        max_tokens: nodeConfig.maxTokens ?? 2048,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM API error ${response.status}: ${err}`);
    }

    const json = (await response.json()) as any;
    const content: string = json.choices?.[0]?.message?.content ?? '';
    const tokensUsed: number = json.usage?.total_tokens ?? 0;

    // Rough cost estimate (adjust per model)
    const costUsd = tokensUsed * 0.000002;

    // 5. Persist output + checkpoint
    const updatedState = { ...stateVars, lastOutput: content };
    const graphState: GraphState = {
      runId,
      stepIndex,
      nodeId: input.nodeId,
      state: updatedState,
      timestamp: new Date().toISOString(),
    };

    await this.prisma.runStep.update({
      where: { id: runStepId },
      data: {
        outputSnapshot: { content, tokensUsed, costUsd } as any,
        tokensUsed,
        costUsd,
      },
    });

    await this.checkpoint.save(runStepId, graphState);

    // 6. SSE stream to frontend
    input.sseEmitter?.('step:complete', {
      runStepId,
      stepIndex,
      content,
      tokensUsed,
      costUsd,
    });

    return { content, tokensUsed, costUsd, updatedState };
  }

  private interpolate(
    template: string,
    vars: Record<string, unknown>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
    );
  }
}
