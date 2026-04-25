/**
 * HierarchyOrchestrator — Multi-agent delegation
 *
 * Implementa el patrón de orquestación jerárquica:
 * Agency → Department → Workspace → Agent → Subagent
 *
 * Inspirado en:
 * - AutoGen GroupChat: parallel task execution + result consolidation
 *   https://github.com/microsoft/autogen
 * - CrewAI Process.hierarchical: manager agent que descompone y delega
 *   https://github.com/crewaiinc/crewai
 * - microsoft/agent-framework: AgentCapability contract
 *   https://github.com/microsoft/agent-framework
 *
 * Flujo:
 * 1. El orchestrator recibe un task
 * 2. Llama al LLM para descomponer en subtareas por child
 * 3. Ejecuta subtareas en paralelo (Promise.allSettled)
 * 4. Llama al LLM para consolidar resultados
 * 5. Retorna la respuesta consolidada
 */

import type { ILLMClient } from './llm-step-executor';

export type OrchestratorLevel = 'agency' | 'department' | 'workspace';

export interface ChildScope {
  id: string;
  name: string;
  role: string;
  goal?: string | null;
  backstory?: string | null;
  systemPrompt?: string | null;
}

export interface DelegationRequest {
  orchestratorId: string;
  orchestratorLevel: OrchestratorLevel;
  orchestratorName: string;
  task: string;
  context?: Record<string, unknown>;
}

export interface SubtaskResult {
  childId: string;
  childName: string;
  task: string;
  result: string;
  status: 'completed' | 'failed';
  error?: string;
}

export interface DelegationResult {
  orchestratorId: string;
  subtasks: SubtaskResult[];
  consolidatedAnswer: string;
  totalChildren: number;
  successfulChildren: number;
}

export interface IChildScopeRepository {
  getChildren(orchestratorId: string, level: OrchestratorLevel): Promise<ChildScope[]>;
  executeTask(childId: string, task: string, context?: Record<string, unknown>): Promise<string>;
}

export class HierarchyOrchestrator {
  constructor(
    private readonly llm: ILLMClient,
    private readonly childRepo: IChildScopeRepository,
    private readonly defaultModel: string = 'openai/gpt-4o-mini',
  ) {}

  async delegate(req: DelegationRequest): Promise<DelegationResult> {
    const children = await this.childRepo.getChildren(req.orchestratorId, req.orchestratorLevel);

    if (children.length === 0) {
      return {
        orchestratorId: req.orchestratorId,
        subtasks: [],
        consolidatedAnswer: 'No subordinates available to delegate this task.',
        totalChildren: 0,
        successfulChildren: 0,
      };
    }

    // Paso 1: Descomponer el task (CrewAI manager pattern)
    const decomposition = await this.decomposeTask(req, children);

    // Paso 2: Ejecutar en paralelo (AutoGen GroupChat pattern)
    const settledResults = await Promise.allSettled(
      decomposition.subtasks.map((sub) =>
        this.childRepo.executeTask(sub.childId, sub.task, req.context),
      ),
    );

    const subtaskResults: SubtaskResult[] = decomposition.subtasks.map((sub, i) => {
      const settled = settledResults[i]!;
      return settled.status === 'fulfilled'
        ? { childId: sub.childId, childName: sub.childName, task: sub.task, result: settled.value, status: 'completed' as const }
        : { childId: sub.childId, childName: sub.childName, task: sub.task, result: '', status: 'failed' as const, error: String(settled.reason) };
    });

    // Paso 3: Consolidar resultados
    const consolidated = await this.consolidateResults(req, subtaskResults);
    const successfulChildren = subtaskResults.filter((r) => r.status === 'completed').length;

    return {
      orchestratorId: req.orchestratorId,
      subtasks: subtaskResults,
      consolidatedAnswer: consolidated,
      totalChildren: children.length,
      successfulChildren,
    };
  }

  private async decomposeTask(
    req: DelegationRequest,
    children: ChildScope[],
  ): Promise<{ subtasks: Array<{ childId: string; childName: string; task: string }> }> {
    const childList = children
      .map((c) => `- ${c.name} [ID: ${c.id}] (Role: ${c.role}${c.goal ? ` | Goal: ${c.goal.slice(0, 80)}` : ''})`)
      .join('\n');

    const prompt = `You are ${req.orchestratorName}, an orchestrator managing the following subordinates:
${childList}

Task to delegate: "${req.task}"

Decompose this task into specific subtasks for each relevant subordinate.
Only include subordinates that are relevant to this task.
Respond ONLY with valid JSON: { "subtasks": [{ "childId": "...", "childName": "...", "task": "..." }] }`;

    const response = await this.llm.chatCompletion({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 1000,
    });

    try {
      const content = response.content ?? '{"subtasks":[]}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch?.[0] ?? '{"subtasks":[]}') as { subtasks: Array<{ childId: string; childName: string; task: string }> };
    } catch {
      // Fallback: asignar el task completo a todos los hijos
      return {
        subtasks: children.map((c) => ({
          childId: c.id,
          childName: c.name,
          task: req.task,
        })),
      };
    }
  }

  private async consolidateResults(
    req: DelegationRequest,
    results: SubtaskResult[],
  ): Promise<string> {
    const successResults = results.filter((r) => r.status === 'completed');
    if (successResults.length === 0) return 'All subtasks failed. No results to consolidate.';

    const summary = successResults
      .map((r) => `**${r.childName}**: ${r.result}`)
      .join('\n\n');

    const prompt = `You received the following results from your subordinates regarding the task: "${req.task}"

${summary}

Consolidate these results into a coherent, comprehensive response.`;

    const response = await this.llm.chatCompletion({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      maxTokens: 2000,
    });

    return response.content ?? 'Unable to consolidate results.';
  }
}
