import { gatewayMethods } from '../../../../../packages/gateway-sdk/src';
import { studioConfig } from '../../config';

export class GatewayService {
  async call(method: string, params?: Record<string, unknown>) {
    const response = await fetch(`${studioConfig.gatewayBaseUrl}/gateway/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method, params }),
    }).catch(() => null);

    if (!response || !response.ok) {
      return { ok: false, error: `RPC transport unavailable for ${method}` };
    }

    return response.json();
  }

  async health() {
    const response = await fetch(`${studioConfig.gatewayBaseUrl}/health`).catch(() => null);
    if (!response?.ok) {
      return { ok: false, status: 'offline' };
    }
    return response.json();
  }

  async diagnostics() {
    const response = await fetch(`${studioConfig.gatewayBaseUrl}/diagnostics`).catch(() => null);
    if (!response?.ok) {
      return { ok: false, diagnostics: null };
    }
    return response.json();
  }

  async dashboardState() {
    const response = await fetch(`${studioConfig.gatewayBaseUrl}/dashboard/state`).catch(() => null);
    if (!response?.ok) {
      return { ok: false, agents: [], sessions: [] };
    }
    return response.json();
  }

  async listAgents() {
    const viaRpc = await this.call(gatewayMethods.agentsList, {});
    if ((viaRpc as { ok?: boolean }).ok) {
      return viaRpc;
    }

    const state = (await this.dashboardState()) as { agents?: Record<string, unknown>[] | Record<string, unknown> };
    if (Array.isArray(state.agents)) {
      return { ok: true, payload: state.agents };
    }

    const flattened = Object.values((state.agents as Record<string, unknown>) ?? {}).flatMap((value) =>
      Array.isArray(value) ? value : [],
    );

    return { ok: true, payload: flattened };
  }

  async listSessions() {
    const viaRpc = await this.call(gatewayMethods.sessionsList, { limit: 50 });
    if ((viaRpc as { ok?: boolean }).ok) {
      return viaRpc;
    }

    const state = (await this.dashboardState()) as { sessions?: unknown[] };
    return {
      ok: true,
      payload: Array.isArray(state.sessions) ? state.sessions : [],
    };
  }
}
