import { performance } from 'node:perf_hooks';

import { studioConfig } from '../../config';
import { GatewayService } from './gateway.service';

export type OpenClawConnectionState = 'connected' | 'degraded' | 'offline' | 'misconfigured';

interface EnvChecklistItem {
  key: string;
  required: boolean;
  configured: boolean;
  source: 'env' | 'default';
  maskedValue?: string;
  reason?: string;
}

function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 4) return '*'.repeat(value.length);
  const suffix = value.slice(-4);
  return `${value.slice(0, 2)}****${suffix}`;
}

function sanitizeValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (/key|secret|token|password/i.test(raw)) {
    return maskSecret(raw);
  }
  if (raw.length <= 10) {
    return `${raw.slice(0, 2)}****`;
  }
  return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
}

export class GatewayConnectionStatusService {
  constructor(private readonly gatewayService: GatewayService) {}

  private buildEnvChecklist(includeMasked: boolean): EnvChecklistItem[] {
    const gatewayFromEnv = process.env.GATEWAY_ADAPTER_URL;
    const workspaceRoot = process.env.OPENCLAW_WORKSPACE_ROOT;
    const apiKey = process.env.OPENCLAW_API_KEY;
    const baseUrl = process.env.OPENCLAW_BASE_URL ?? gatewayFromEnv;
    const workspaceId = process.env.OPENCLAW_WORKSPACE_ID;

    return [
      {
        key: 'OPENCLAW_BASE_URL',
        required: true,
        configured: Boolean(baseUrl),
        source: process.env.OPENCLAW_BASE_URL ? 'env' : gatewayFromEnv ? 'env' : 'default',
        maskedValue: includeMasked ? sanitizeValue(baseUrl) : undefined,
        reason: baseUrl ? undefined : 'Missing base URL for OpenClaw gateway',
      },
      {
        key: 'GATEWAY_ADAPTER_URL',
        required: true,
        configured: Boolean(gatewayFromEnv) || Boolean(studioConfig.gatewayBaseUrl),
        source: gatewayFromEnv ? 'env' : 'default',
        maskedValue: includeMasked ? sanitizeValue(gatewayFromEnv ?? studioConfig.gatewayBaseUrl) : undefined,
        reason: gatewayFromEnv ? undefined : 'Using default localhost adapter URL',
      },
      {
        key: 'OPENCLAW_WORKSPACE_ROOT',
        required: true,
        configured: Boolean(workspaceRoot) || Boolean(studioConfig.workspaceRoot),
        source: workspaceRoot ? 'env' : 'default',
        maskedValue: includeMasked ? sanitizeValue(workspaceRoot ?? studioConfig.workspaceRoot) : undefined,
      },
      {
        key: 'OPENCLAW_API_KEY',
        required: false,
        configured: Boolean(apiKey),
        source: apiKey ? 'env' : 'default',
        maskedValue: includeMasked && apiKey ? maskSecret(apiKey) : undefined,
        reason: apiKey ? undefined : 'Optional unless your OpenClaw deployment requires auth',
      },
      {
        key: 'OPENCLAW_WORKSPACE_ID',
        required: false,
        configured: Boolean(workspaceId),
        source: workspaceId ? 'env' : 'default',
        maskedValue: includeMasked ? sanitizeValue(workspaceId) : undefined,
        reason: workspaceId ? undefined : 'Optional. Used for fixed workspace routing',
      },
    ];
  }

  async getConnectionStatus(includeMasked = false) {
    const startedAt = performance.now();
    const [healthRaw, diagnosticsRaw] = await Promise.all([
      this.gatewayService.health(),
      this.gatewayService.diagnostics(),
    ]);
    const elapsedMs = Math.max(1, Math.round(performance.now() - startedAt));

    const envChecklist = this.buildEnvChecklist(includeMasked);
    const missingRequiredEnv = envChecklist.filter((item) => item.required && !item.configured);

    const healthOk = Boolean((healthRaw as { ok?: boolean })?.ok);
    const diagnosticsOk = Boolean((diagnosticsRaw as { ok?: boolean })?.ok);

    const failureReasons: string[] = [];
    if (missingRequiredEnv.length > 0) {
      failureReasons.push(`Missing required environment keys: ${missingRequiredEnv.map((item) => item.key).join(', ')}`);
    }
    if (!healthOk) {
      failureReasons.push('Gateway health check failed or gateway is unreachable');
    }
    if (!diagnosticsOk) {
      failureReasons.push('Gateway diagnostics endpoint failed or returned unavailable payload');
    }
    if (elapsedMs > 3000) {
      failureReasons.push(`Gateway response latency is high (${elapsedMs}ms)`);
    }

    let state: OpenClawConnectionState = 'connected';
    if (missingRequiredEnv.length > 0) {
      state = 'misconfigured';
    } else if (!healthOk && !diagnosticsOk) {
      state = 'offline';
    } else if (!healthOk || !diagnosticsOk || elapsedMs > 3000) {
      state = 'degraded';
    }

    const successCriteria = [
      { id: 'health_ok', label: 'Gateway health endpoint returns ok', passed: healthOk },
      { id: 'diagnostics_ok', label: 'Gateway diagnostics endpoint returns ok', passed: diagnosticsOk },
      { id: 'env_ready', label: 'Required OpenClaw environment keys are configured', passed: missingRequiredEnv.length === 0 },
      { id: 'latency_budget', label: 'Connection check latency under 3000ms', passed: elapsedMs <= 3000 },
    ];

    return {
      state,
      checkedAt: new Date().toISOString(),
      autoCheckIntervalMs: 30000,
      latencyMs: elapsedMs,
      summary: {
        healthOk,
        diagnosticsOk,
      },
      successCriteria,
      failureReasons,
      envChecklist,
      health: healthRaw,
      diagnostics: diagnosticsRaw,
    };
  }
}

