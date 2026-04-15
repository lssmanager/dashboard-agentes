export interface GatewayAuthOptions {
  apiKey?: string;
}

export function buildGatewayAuthHeaders(auth?: GatewayAuthOptions): Record<string, string> {
  if (!auth?.apiKey) {
    return {};
  }

  return {
    authorization: `Bearer ${auth.apiKey}`,
  };
}
