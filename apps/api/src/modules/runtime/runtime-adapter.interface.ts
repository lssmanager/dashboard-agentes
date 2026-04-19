import type {
  ConnectionSpec,
  RuntimeCapabilityMatrix,
  SessionState,
  TopologyActionRequest,
  TopologyActionResult,
  TopologyLinkState,
} from '../../../../../packages/core-types/src';

export interface RuntimeSnapshot {
  health: { ok: boolean; [key: string]: unknown };
  diagnostics: Record<string, unknown>;
  sessions: { ok: boolean; payload?: unknown[] };
}

export interface RuntimeAdapter {
  readonly name: string;
  getRuntimeSnapshot(): Promise<RuntimeSnapshot>;
  getCapabilities(): Promise<RuntimeCapabilityMatrix>;
  inspectSessions(): Promise<SessionState[]>;
  inspectChannels(): Promise<Array<{ channel: string; sessions: number; activeSessions: number }>>;
  inspectTopologyLinks(connections: ConnectionSpec[]): Promise<TopologyLinkState[]>;
  executeTopologyAction(
    action: TopologyActionRequest['action'],
    payload: Omit<TopologyActionRequest, 'action'>,
  ): Promise<TopologyActionResult>;
}
