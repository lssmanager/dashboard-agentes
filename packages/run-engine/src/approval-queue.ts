/**
 * ApprovalQueue — Human-in-the-Loop (LangGraph interrupt() pattern)
 *
 * Cuando el FlowExecutor llega a un nodo 'human_approval',
 * pausa la ejecución y encola la aprobación aquí.
 *
 * El Operations panel (Hermes-inspired UX) consume este queue
 * para mostrar las aprobaciones pendientes con contexto visual.
 *
 * Patrón: LangGraph interrupt() + resume()
 * https://github.com/langchain-ai/langgraph
 *
 * UX inspirado en: Hermes Chief of Staff
 * https://github.com/TheCraigHewitt/hermes-chief-of-staff
 */

export interface PendingApprovalItem {
  id: string;
  runId: string;
  stepId: string;
  nodeId: string;
  // Contexto para el panel Operations (Hermes UX pattern)
  title: string;
  description?: string;
  context?: Record<string, unknown>;
  // Callback para reanudar el run tras la decisión
  resume: (approved: boolean, decision?: Record<string, unknown>) => Promise<void>;
  createdAt: Date;
  timeoutMs?: number;
}

export interface ApprovalDecision {
  approved: boolean;
  decidedBy?: string;
  decision?: Record<string, unknown>;
  decidedAt: Date;
}

export class ApprovalQueue {
  private readonly queue = new Map<string, PendingApprovalItem>();
  private readonly decisions = new Map<string, ApprovalDecision>();

  /**
   * Enqueues a pending approval and suspends execution.
   * El FlowExecutor llama esto cuando el step queda en 'waiting_approval'.
   */
  async enqueue(item: PendingApprovalItem): Promise<ApprovalDecision> {
    this.queue.set(item.id, item);

    return new Promise<ApprovalDecision>((resolve, reject) => {
      const timeout = item.timeoutMs
        ? setTimeout(() => {
            this.queue.delete(item.id);
            reject(new Error(`Approval timeout after ${item.timeoutMs}ms for step ${item.stepId}`));
          }, item.timeoutMs)
        : null;

      // Polling para detectar cuando se toma una decisión
      const interval = setInterval(() => {
        const decision = this.decisions.get(item.id);
        if (decision) {
          clearInterval(interval);
          if (timeout) clearTimeout(timeout);
          this.decisions.delete(item.id);
          this.queue.delete(item.id);
          resolve(decision);
        }
      }, 500);
    });
  }

  /**
   * Procesa una decisión de aprobación.
   * Llamado por el Operations panel cuando el usuario aprueba/rechaza.
   */
  async decide(
    approvalId: string,
    approved: boolean,
    decidedBy?: string,
    decision?: Record<string, unknown>,
  ): Promise<void> {
    const item = this.queue.get(approvalId);
    if (!item) throw new Error(`Approval not found: ${approvalId}`);

    const approvalDecision: ApprovalDecision = {
      approved,
      decidedBy,
      decision,
      decidedAt: new Date(),
    };

    this.decisions.set(approvalId, approvalDecision);
    await item.resume(approved, decision);
  }

  /**
   * Lista todas las aprobaciones pendientes.
   * El Operations panel llama esto para mostrar el panel Hermes-style.
   */
  list(): PendingApprovalItem[] {
    return Array.from(this.queue.values());
  }

  /**
   * Obtiene una aprobación específica.
   */
  get(approvalId: string): PendingApprovalItem | undefined {
    return this.queue.get(approvalId);
  }

  get pendingCount(): number {
    return this.queue.size;
  }
}
