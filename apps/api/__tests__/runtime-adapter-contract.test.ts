import { OpenClawRuntimeAdapter } from '../src/modules/runtime/adapters/openclaw-runtime.adapter';

describe('OpenClawRuntimeAdapter contract', () => {
  it('exposes read-only runtime inspection contracts', async () => {
    const gatewayMock = {
      health: jest.fn().mockResolvedValue({ ok: true, status: 'online' }),
      diagnostics: jest.fn().mockResolvedValue({ ok: true, details: {} }),
      listSessions: jest.fn().mockResolvedValue({
        ok: true,
        payload: [{ id: 's-1', channel: 'web', status: 'active' }],
      }),
      getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue({
        source: 'gateway_capabilities',
        topology: {
          connect: true,
          disconnect: true,
          pause: true,
          reactivate: true,
          redirect: true,
          continue: true,
        },
        inspection: { sessions: true, channels: true, topology: true },
      }),
      inspectSessions: jest.fn().mockResolvedValue([
        { ref: { id: 's-1', channel: 'web' }, status: 'active' },
      ]),
      inspectChannels: jest.fn().mockResolvedValue([
        { channel: 'web', sessions: 1, activeSessions: 1 },
      ]),
      call: jest.fn().mockResolvedValue({ ok: true }),
    };

    const adapter = new OpenClawRuntimeAdapter(gatewayMock as any);

    const snapshot = await adapter.getRuntimeSnapshot();
    const capabilities = await adapter.getCapabilities();
    const sessions = await adapter.inspectSessions();
    const channels = await adapter.inspectChannels();

    expect(snapshot.health.ok).toBe(true);
    expect(capabilities.topology.connect).toBe(true);
    expect(Array.isArray(sessions)).toBe(true);
    expect(Array.isArray(channels)).toBe(true);
    expect(gatewayMock.health).toHaveBeenCalled();
    expect(gatewayMock.inspectSessions).toHaveBeenCalled();
  });

  it('returns fail-closed unsupported_by_runtime without invoking topology rpc', async () => {
    const gatewayMock = {
      health: jest.fn(),
      diagnostics: jest.fn(),
      listSessions: jest.fn(),
      getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue({
        source: 'unknown',
        topology: {
          connect: false,
          disconnect: false,
          pause: false,
          reactivate: false,
          redirect: false,
          continue: false,
        },
        inspection: { sessions: true, channels: false, topology: false },
      }),
      inspectSessions: jest.fn().mockResolvedValue([]),
      inspectChannels: jest.fn().mockResolvedValue([]),
      call: jest.fn(),
    };

    const adapter = new OpenClawRuntimeAdapter(gatewayMock as any);
    const result = await adapter.executeTopologyAction('connect', {
      from: { level: 'workspace', id: 'workspace-1' },
      to: { level: 'agent', id: 'agent-1' },
    });

    expect(result.status).toBe('unsupported_by_runtime');
    expect(result.runtimeSupported).toBe(false);
    expect(gatewayMock.call).not.toHaveBeenCalled();
  });

  it('returns fail-closed capability matrix when capability endpoint fails', async () => {
    const gatewayMock = {
      health: jest.fn(),
      diagnostics: jest.fn(),
      listSessions: jest.fn(),
      getRuntimeCapabilityMatrix: jest.fn().mockRejectedValue(new Error('gateway down')),
      inspectSessions: jest.fn().mockResolvedValue([]),
      inspectChannels: jest.fn().mockResolvedValue([]),
      call: jest.fn(),
    };

    const adapter = new OpenClawRuntimeAdapter(gatewayMock as any);
    const capabilities = await adapter.getCapabilities();

    expect(capabilities.source).toBe('unknown');
    expect(capabilities.topology.connect).toBe(false);
    expect(capabilities.inspection.sessions).toBe(false);
  });

  it('returns empty sessions/channels when inspection endpoints fail', async () => {
    const gatewayMock = {
      health: jest.fn(),
      diagnostics: jest.fn(),
      listSessions: jest.fn(),
      getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue({
        source: 'gateway_capabilities',
        topology: {
          connect: true,
          disconnect: true,
          pause: true,
          reactivate: true,
          redirect: true,
          continue: true,
        },
        inspection: { sessions: true, channels: true, topology: true },
      }),
      inspectSessions: jest.fn().mockRejectedValue(new Error('sessions unavailable')),
      inspectChannels: jest.fn().mockRejectedValue(new Error('channels unavailable')),
      call: jest.fn(),
    };

    const adapter = new OpenClawRuntimeAdapter(gatewayMock as any);
    const sessions = await adapter.inspectSessions();
    const channels = await adapter.inspectChannels();

    expect(sessions).toEqual([]);
    expect(channels).toEqual([]);
  });
});
