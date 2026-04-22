import { OpenClawRuntimeAdapter } from '../src/modules/runtime/adapters/openclaw-runtime.adapter';

/**
 * Extended runtime adapter contract tests.
 * Covers applied + rejected (with reason extraction) in addition to
 * the unsupported_by_runtime fail-closed case in runtime-adapter-contract.test.ts.
 */

const FULL_CAPABILITY_MATRIX = {
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
};

const NO_CAPABILITY_MATRIX = {
  source: 'unknown',
  topology: {
    connect: false,
    disconnect: false,
    pause: false,
    reactivate: false,
    redirect: false,
    continue: false,
  },
  inspection: { sessions: false, channels: false, topology: false },
};

const SAMPLE_PAYLOAD = {
  from: { level: 'workspace' as const, id: 'workspace-1' },
  to: { level: 'agent' as const, id: 'agent-1' },
};

function makeGateway(overrides: Partial<{
  getRuntimeCapabilityMatrix: () => Promise<unknown>;
  call: () => Promise<unknown>;
}> = {}) {
  return {
    health: jest.fn().mockResolvedValue({ ok: true }),
    diagnostics: jest.fn().mockResolvedValue({ ok: true }),
    listSessions: jest.fn().mockResolvedValue({ ok: true, payload: [] }),
    getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue(FULL_CAPABILITY_MATRIX),
    inspectSessions: jest.fn().mockResolvedValue([]),
    inspectChannels: jest.fn().mockResolvedValue([]),
    call: jest.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  };
}

describe('OpenClawRuntimeAdapter – applied state', () => {
  it('returns applied with appliedAt when gateway responds ok:true', async () => {
    const gateway = makeGateway();
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('applied');
    expect(result.runtimeSupported).toBe(true);
    expect(result.action).toBe('connect');
    expect(typeof result.appliedAt).toBe('string');
    expect(result.requestedAt).toBeTruthy();
    expect(gateway.call).toHaveBeenCalledWith('topology.connect', {
      from: SAMPLE_PAYLOAD.from,
      to: SAMPLE_PAYLOAD.to,
      reason: undefined,
      metadata: undefined,
    });
  });

  it('calls the correct rpc method for each topology action', async () => {
    const actionRpcPairs: Array<[string, string]> = [
      ['connect',    'topology.connect'],
      ['disconnect', 'topology.disconnect'],
      ['pause',      'topology.pause'],
      ['reactivate', 'topology.reactivate'],
      ['redirect',   'topology.redirect'],
      ['continue',   'topology.continue'],
    ];

    for (const [action, expectedRpc] of actionRpcPairs) {
      const gateway = makeGateway();
      const adapter = new OpenClawRuntimeAdapter(gateway as any);
      await adapter.executeTopologyAction(action as any, SAMPLE_PAYLOAD);
      expect(gateway.call).toHaveBeenCalledWith(expectedRpc, expect.any(Object));
    }
  });

  it('includes reason and metadata in rpc payload when provided', async () => {
    const gateway = makeGateway();
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    await adapter.executeTopologyAction('pause', {
      ...SAMPLE_PAYLOAD,
      reason: 'maintenance window',
      metadata: { initiatedBy: 'ops-team' },
    });

    expect(gateway.call).toHaveBeenCalledWith('topology.pause', {
      from: SAMPLE_PAYLOAD.from,
      to: SAMPLE_PAYLOAD.to,
      reason: 'maintenance window',
      metadata: { initiatedBy: 'ops-team' },
    });
  });
});

describe('OpenClawRuntimeAdapter – partial state', () => {
  it('preserves explicit partial status from runtime responses', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: true,
        status: 'partial',
        message: 'Connection applied, but target remained paused',
        code: 'TARGET_REMAINED_PAUSED',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('partial');
    expect(result.runtimeSupported).toBe(true);
    expect(result.message).toContain('target remained paused');
    expect(result.errorCode).toBe('TARGET_REMAINED_PAUSED');
  });
});

describe('OpenClawRuntimeAdapter – rejected state', () => {
  it('returns rejected when gateway responds ok:false', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({ ok: false }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.runtimeSupported).toBe(true);
    expect(result.errorCode).toBe('RUNTIME_REJECTED');
  });

  it('extracts reason from gateway message field', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: false,
        message: 'Connection already active',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.message).toContain('Connection already active');
  });

  it('extracts reason from gateway reason field when message is absent', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: false,
        reason: 'Agent in wrong state for this transition',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('disconnect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.message).toContain('Agent in wrong state for this transition');
  });

  it('extracts reason from gateway error field when message and reason are absent', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: false,
        error: 'Target agent not found',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('pause', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.message).toContain('Target agent not found');
  });

  it('uses generic rejection message when gateway provides no extractable reason', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({ ok: false }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('reactivate', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.message).toContain('"reactivate"');
    expect(result.errorCode).toBe('RUNTIME_REJECTED');
  });

  it('extracts custom errorCode from gateway code field', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: false,
        message: 'Not allowed',
        code: 'TOPOLOGY_FORBIDDEN',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('redirect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.errorCode).toBe('TOPOLOGY_FORBIDDEN');
  });

  it('prefers message over reason when both are present', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: false,
        message: 'Primary message',
        reason: 'Secondary reason',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('continue', SAMPLE_PAYLOAD);

    expect(result.status).toBe('rejected');
    expect(result.message).toContain('Primary message');
    expect(result.message).not.toContain('Secondary reason');
  });
});

describe('OpenClawRuntimeAdapter – unsupported_by_runtime state', () => {
  it('preserves explicit unsupported_by_runtime from runtime responses', async () => {
    const gateway = makeGateway({
      call: jest.fn().mockResolvedValue({
        ok: false,
        status: 'unsupported_by_runtime',
        message: 'Runtime disabled topology.connect for this deployment',
        code: 'CAPABILITY_DISABLED_AT_RUNTIME',
      }),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('unsupported_by_runtime');
    expect(result.runtimeSupported).toBe(false);
    expect(result.message).toContain('disabled topology.connect');
    expect(result.errorCode).toBe('CAPABILITY_DISABLED_AT_RUNTIME');
  });

  it('returns unsupported_by_runtime and does not call gateway when action is disabled', async () => {
    const gateway = makeGateway({
      getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue(NO_CAPABILITY_MATRIX),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const result = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);

    expect(result.status).toBe('unsupported_by_runtime');
    expect(result.runtimeSupported).toBe(false);
    expect(result.errorCode).toBe('UNSUPPORTED_BY_RUNTIME');
    expect(gateway.call).not.toHaveBeenCalled();
  });

  it('gates each action independently by capability flag', async () => {
    // Only 'pause' is disabled — all others should call through
    const partialMatrix = {
      ...FULL_CAPABILITY_MATRIX,
      topology: { ...FULL_CAPABILITY_MATRIX.topology, pause: false },
    };
    const gateway = makeGateway({
      getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue(partialMatrix),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const pauseResult = await adapter.executeTopologyAction('pause', SAMPLE_PAYLOAD);
    expect(pauseResult.status).toBe('unsupported_by_runtime');
    expect(gateway.call).not.toHaveBeenCalled();

    const connectResult = await adapter.executeTopologyAction('connect', SAMPLE_PAYLOAD);
    expect(connectResult.status).toBe('applied');
    expect(gateway.call).toHaveBeenCalledTimes(1);
  });
});

describe('OpenClawRuntimeAdapter – inspectTopologyLinks', () => {
  it('marks links as runtimeSupported=true when any topology capability is on', async () => {
    const gateway = makeGateway();
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const links = await adapter.inspectTopologyLinks([
      { id: 'link-1', from: { level: 'workspace', id: 'workspace-1' }, to: { level: 'agent', id: 'agent-1' }, state: 'connected' },
    ]);

    expect(links[0].runtimeSupported).toBe(true);
    expect(links[0].linkId).toBe('link-1');
    expect(links[0].runtimeState).toBe('connected');
    expect(typeof links[0].lastObservedAt).toBe('string');
  });

  it('marks links as runtimeSupported=false when all topology capabilities are off', async () => {
    const gateway = makeGateway({
      getRuntimeCapabilityMatrix: jest.fn().mockResolvedValue(NO_CAPABILITY_MATRIX),
    });
    const adapter = new OpenClawRuntimeAdapter(gateway as any);

    const links = await adapter.inspectTopologyLinks([
      { id: 'link-2', from: { level: 'workspace', id: 'workspace-1' }, to: { level: 'agent', id: 'agent-1' }, state: 'paused' },
    ]);

    expect(links[0].runtimeSupported).toBe(false);
  });
});
