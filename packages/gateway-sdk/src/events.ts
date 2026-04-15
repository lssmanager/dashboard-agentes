export const gatewayEvents = {
  connected: 'gateway.connected',
  disconnected: 'gateway.disconnected',
  sessionUpdated: 'sessions.updated',
  agentUpdated: 'agents.updated',
} as const;

export type GatewayEventName = (typeof gatewayEvents)[keyof typeof gatewayEvents];
