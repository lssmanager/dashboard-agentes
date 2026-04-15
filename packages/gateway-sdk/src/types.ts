export interface GatewayHealthPayload {
  ok: boolean;
  status?: string;
}

export interface GatewayDiagnosticsPayload {
  ok?: boolean;
  [key: string]: unknown;
}

export interface GatewayAgentSummary {
  id: string;
  name?: string;
  model?: string;
  status?: string;
  [key: string]: unknown;
}

export interface GatewaySessionSummary {
  id?: string;
  agentId?: string;
  channel?: string;
  status?: string;
  [key: string]: unknown;
}

export interface GatewayUsagePayload {
  totalCostUsd?: number;
  [key: string]: unknown;
}

export interface GatewayRpcEnvelope<T = unknown> {
  ok: boolean;
  payload?: T;
  error?: string;
}
