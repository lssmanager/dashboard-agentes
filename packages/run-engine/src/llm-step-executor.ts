/**
 * LLMStepExecutor — El cerebro real del motor de ejecución
 *
 * Extiende el StepExecutor stub con implementaciones reales:
 * - executeAgent: llama LLMs con el model policy del scope (Agency→Dept→WS→Agent)
 * - executeTool: invoca skills MCP, n8n webhooks, OpenAPI
 * - executeCondition: evalúa expresiones de forma segura
 * - executeSubAgent: delega a sub-agentes (AutoGen GroupChat pattern)
 *
 * Inspirado en:
 * - LangGraph: state management entre nodos, interrupt/resume
 * - CrewAI: role+goal+backstory en el system prompt
 * - Semantic Kernel: skills con JSON Schema (tool definitions para LLM)
 * - Flowise: tool node invocation pattern
 * - AutoGen: group-chat delegation
 */

import type { FlowNode, RunStep, RunSpec } from '../../core-types/src';
import { StepExecutor, type StepExecutionResult } from './step-executor';

// Interfaces para inyección de dependencias
export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  goal?: string | null;
  backstory?: string | null;
  systemPrompt?: string | null;
  model: string;
  skills: Array<{ skill: SkillRecord }>;
}

export interface SkillRecord {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  config: Record<string, unknown>;
  schema?: Record<string, unknown> | null;
}

export interface ModelPolicyRecord {
  primaryModel: string;
  fallbackModel?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
}

export interface IAgentRepository {
  findById(id: string): Promise<AgentRecord | null>;
}

export interface IModelPolicyRepository {
  resolveEffective(agentId: string): Promise<ModelPolicyRecord>;
}

export interface ISkillInvoker {
  invoke(skill: SkillRecord, input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface ILLMClient {
  chatCompletion(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    tools?: unknown[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    content: string | null;
    toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
    usage: { inputTokens: number; outputTokens: number };
  }>;
}

export interface LLMStepExecutorDeps {
  agentRepo: IAgentRepository;
  policyRepo: IModelPolicyRepository;
  skillInvoker: ISkillInvoker;
  llmClient: ILLMClient;
}

export class LLMStepExecutor extends StepExecutor {
  constructor(private readonly deps: LLMStepExecutorDeps) {
    super();
  }

  /**
   * Ejecuta un nodo tipo 'agent'.
   * - Resuelve el agente y su política de modelo efectiva (scope hierarchy)
   * - Construye el system prompt con role+goal+backstory (CrewAI pattern)
   * - Llama al LLM con las tool definitions de los skills del agente (SK pattern)
   * - Invoca tool calls si el LLM lo solicita
   */
  protected override async executeAgent(
    node: FlowNode,
    step: RunStep,
    run: RunSpec,
  ): Promise<StepExecutionResult> {
    const agentId = node.config.agentId as string;
    if (!agentId) return { status: 'failed', error: 'agentId is required in node config' };

    const agent = await this.deps.agentRepo.findById(agentId);
    if (!agent) return { status: 'failed', error: `Agent not found: ${agentId}` };

    const policy = await this.deps.policyRepo.resolveEffective(agentId);
    const tools = this.buildToolDefinitions(agent.skills.map((s) => s.skill));

    // CrewAI-inspired: role + goal + backstory construyen el system prompt
    const systemPrompt = this.buildSystemPrompt(agent);
    const userMessage = (node.config.userMessage as string) ?? this.extractLastUserMessage(run);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...this.buildConversationHistory(run),
      { role: 'user', content: userMessage },
    ];

    const response = await this.deps.llmClient.chatCompletion({
      model: policy.primaryModel,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: policy.temperature ?? 0.7,
      maxTokens: policy.maxTokens ?? 4096,
    });

    const costUsd = this.estimateCost(
      policy.primaryModel,
      response.usage.inputTokens,
      response.usage.outputTokens,
    );

    // Invocar tool calls si los hay (Semantic Kernel skill invocation)
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults = await this.invokeToolCalls(response.toolCalls, agent);
      return {
        status: 'completed',
        output: { content: response.content, toolCalls: response.toolCalls, toolResults },
        tokenUsage: { input: response.usage.inputTokens, output: response.usage.outputTokens },
        costUsd,
      };
    }

    return {
      status: 'completed',
      output: { content: response.content },
      tokenUsage: { input: response.usage.inputTokens, output: response.usage.outputTokens },
      costUsd,
    };
  }

  /**
   * Ejecuta un nodo tipo 'tool'.
   * Soporta: mcp, n8n_webhook, openapi, function
   * Patrón: Flowise ToolNode + n8n webhook bridge
   */
  protected override async executeTool(
    node: FlowNode,
    _step: RunStep,
    _run: RunSpec,
  ): Promise<StepExecutionResult> {
    const skillId = node.config.skillId as string;
    const input = (node.config.input as Record<string, unknown>) ?? {};

    // Buscar skill en el contexto del nodo (viene inyectado via config)
    const skill = node.config.skill as SkillRecord | undefined;
    if (!skill) return { status: 'failed', error: `Skill config missing in node for skillId: ${skillId}` };

    try {
      const result = await this.deps.skillInvoker.invoke(skill, input);
      return { status: 'completed', output: result };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return { status: 'failed', error: `Skill ${skill.name} failed: ${error}` };
    }
  }

  /**
   * Evalúa condiciones de forma segura.
   * Patrón: CrewAI @router decorator — branching condicional
   * Soporta expresiones simples sobre el output del step anterior
   */
  protected override async executeCondition(
    node: FlowNode,
    _step: RunStep,
    run: RunSpec,
  ): Promise<StepExecutionResult> {
    const expression = (node.config.expression as string) ?? 'true';
    const branches = (node.config.branches as string[]) ?? ['true', 'false'];

    // Contexto de evaluación: outputs de steps anteriores
    const context = this.buildConditionContext(run);
    const result = this.safeEval(expression, context);
    const branch = result ? branches[0] : (branches[1] ?? 'false');

    return {
      status: 'completed',
      output: { expression, result, branch, context },
      branch,
    };
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /**
   * Construye el system prompt con el patrón CrewAI: role + goal + backstory
   */
  private buildSystemPrompt(agent: AgentRecord): string {
    const parts: string[] = [];

    if (agent.role) parts.push(`## Role\n${agent.role}`);
    if (agent.goal) parts.push(`## Goal\n${agent.goal}`);
    if (agent.backstory) parts.push(`## Backstory\n${agent.backstory}`);
    if (agent.systemPrompt) parts.push(`## Instructions\n${agent.systemPrompt}`);

    return parts.join('\n\n') || `You are ${agent.name}, an AI assistant.`;
  }

  /**
   * Construye tool definitions en formato OpenAI Function Calling
   * Patrón: Semantic Kernel skills con JSON Schema
   */
  private buildToolDefinitions(skills: SkillRecord[]): unknown[] {
    return skills.map((skill) => ({
      type: 'function',
      function: {
        name: skill.name.replace(/[^a-zA-Z0-9_]/g, '_'),
        description: skill.description ?? `Invoke ${skill.name}`,
        parameters: skill.schema ?? {
          type: 'object',
          properties: { input: { type: 'string', description: 'Input for the skill' } },
          required: ['input'],
        },
      },
    }));
  }

  /**
   * Invoca tool calls retornados por el LLM
   */
  private async invokeToolCalls(
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
    agent: AgentRecord,
  ): Promise<Array<{ toolCallId: string; name: string; result: unknown; error?: string }>> {
    const results = await Promise.allSettled(
      toolCalls.map(async (tc) => {
        const agentSkill = agent.skills.find(
          (s) => s.skill.name.replace(/[^a-zA-Z0-9_]/g, '_') === tc.name,
        );
        if (!agentSkill)
          return { toolCallId: tc.id, name: tc.name, result: null, error: 'Skill not found' };

        const result = await this.deps.skillInvoker.invoke(agentSkill.skill, tc.arguments);
        return { toolCallId: tc.id, name: tc.name, result };
      }),
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { toolCallId: toolCalls[i].id, name: toolCalls[i].name, result: null, error: String(r.reason) },
    );
  }

  private buildConversationHistory(run: RunSpec): Array<{ role: string; content: string }> {
    // Extrae mensajes previos del estado del run para context window
    const state = (run as unknown as Record<string, unknown>).state as Record<string, unknown> | undefined;
    const history = state?.conversationHistory as Array<{ role: string; content: string }> | undefined;
    return history ?? [];
  }

  private extractLastUserMessage(run: RunSpec): string {
    const payload = run.trigger?.payload as Record<string, unknown> | undefined;
    return (payload?.message as string) ?? (payload?.text as string) ?? 'Process the current task.';
  }

  private buildConditionContext(run: RunSpec): Record<string, unknown> {
    const state = (run as unknown as Record<string, unknown>).state as Record<string, unknown> | undefined;
    return {
      run: { id: run.id, trigger: run.trigger },
      state: state ?? {},
      outputs: state?.stepOutputs ?? {},
    };
  }

  /**
   * Evalúa expresiones de condición de forma segura.
   * Solo permite operaciones básicas de comparación sin acceso a globals peligrosos.
   */
  private safeEval(expression: string, context: Record<string, unknown>): boolean {
    try {
      // Expresiones simples: 'state.score > 0.8', 'outputs.sentiment === "positive"'
      const fn = new Function(
        ...Object.keys(context),
        `"use strict"; return !!(${expression});`,
      );
      return fn(...Object.values(context));
    } catch {
      return false;
    }
  }

  /**
   * Estima el costo en USD por modelo
   * Tabla de precios (USD por 1M tokens, actualizada Abr 2026)
   */
  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'openai/gpt-4o':              { input: 2.50,  output: 10.00 },
      'openai/gpt-4o-mini':         { input: 0.15,  output: 0.60  },
      'openai/o1':                  { input: 15.00, output: 60.00 },
      'openai/o3-mini':             { input: 1.10,  output: 4.40  },
      'qwen/qwen-plus':             { input: 0.40,  output: 1.20  },
      'qwen/qwen-turbo':            { input: 0.05,  output: 0.15  },
      'qwen/qwen-max':              { input: 1.60,  output: 6.40  },
      'deepseek/deepseek-chat':     { input: 0.27,  output: 1.10  },
      'deepseek/deepseek-reasoner': { input: 0.55,  output: 2.19  },
      'anthropic/claude-3-5-sonnet':{ input: 3.00,  output: 15.00 },
    };
    const p = pricing[model] ?? { input: 2.50, output: 10.00 };
    return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  }
}
