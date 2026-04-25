/**
 * CheckpointService — Durable Execution (LangGraph PostgresSaver pattern)
 *
 * Permite que los runs se reanuden desde el último step completado
 * si el proceso falla, se reinicia, o el step queda en 'waiting_approval'.
 *
 * Patrón tomado de: LangGraph StateGraph + PostgresSaver
 * https://github.com/langchain-ai/langgraph
 *
 * El FlowExecutor llama saveCheckpoint() después de cada step completado.
 * Al reanudar un run (replay o recovery), loadCheckpoint() devuelve
 * el estado del StateGraph en el punto exacto de interrupción.
 */

export interface Checkpoint {
  runId: string;
  stepId: string;
  nodeId: string;
  // Estado del StateGraph en este punto (LangGraph pattern)
  state: Record<string, unknown>;
  // Outputs acumulados de steps anteriores
  stepOutputs: Record<string, unknown>;
  savedAt: Date;
}

export interface ICheckpointStore {
  save(checkpoint: Checkpoint): Promise<void>;
  load(runId: string): Promise<Checkpoint | null>;
  loadForStep(runId: string, stepId: string): Promise<Checkpoint | null>;
  list(runId: string): Promise<Checkpoint[]>;
}

/**
 * Implementación en memoria para desarrollo.
 * En producción, reemplazar con PrismaCheckpointStore que escribe
 * en RunStep.checkpointData (columna Json en PostgreSQL).
 */
export class InMemoryCheckpointStore implements ICheckpointStore {
  private readonly store = new Map<string, Checkpoint[]>();

  async save(checkpoint: Checkpoint): Promise<void> {
    const list = this.store.get(checkpoint.runId) ?? [];
    // Remover checkpoint anterior del mismo step si existe
    const filtered = list.filter((c) => c.stepId !== checkpoint.stepId);
    filtered.push(checkpoint);
    this.store.set(checkpoint.runId, filtered);
  }

  async load(runId: string): Promise<Checkpoint | null> {
    const list = this.store.get(runId) ?? [];
    if (list.length === 0) return null;
    // Retornar el checkpoint más reciente
    return list[list.length - 1] ?? null;
  }

  async loadForStep(runId: string, stepId: string): Promise<Checkpoint | null> {
    const list = this.store.get(runId) ?? [];
    return list.find((c) => c.stepId === stepId) ?? null;
  }

  async list(runId: string): Promise<Checkpoint[]> {
    return this.store.get(runId) ?? [];
  }
}

/**
 * CheckpointService: wrapper de alto nivel para el FlowExecutor
 */
export class CheckpointService {
  constructor(private readonly store: ICheckpointStore) {}

  async saveAfterStep(
    runId: string,
    stepId: string,
    nodeId: string,
    currentState: Record<string, unknown>,
    stepOutputs: Record<string, unknown>,
  ): Promise<void> {
    await this.store.save({
      runId,
      stepId,
      nodeId,
      state: structuredClone(currentState),
      stepOutputs: structuredClone(stepOutputs),
      savedAt: new Date(),
    });
  }

  async resume(runId: string): Promise<Checkpoint | null> {
    return this.store.load(runId);
  }

  async getCheckpoints(runId: string): Promise<Checkpoint[]> {
    return this.store.list(runId);
  }
}
