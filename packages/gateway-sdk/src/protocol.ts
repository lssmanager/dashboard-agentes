import { GatewayRpcEnvelope } from './types';

export interface GatewayRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface GatewayResponse<T = unknown> {
  id: string;
  ok: boolean;
  payload?: T;
  error?: string;
}

export interface GatewayEvent<T = unknown> {
  event: string;
  payload?: T;
}

export interface GatewayTransport {
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
}

export interface GatewayCallResult<T = unknown> extends GatewayRpcEnvelope<T> {}
