import { TopologyService } from '../src/modules/topology/topology.service';

describe('TopologyService fail-closed behavior', () => {
  it('propagates unsupported_by_runtime from runtime adapter', async () => {
    const runtimeAdapterMock = {
      name: 'mock-runtime',
      getRuntimeSnapshot: jest.fn(),
      getCapabilities: jest.fn(),
      inspectSessions: jest.fn(),
      inspectChannels: jest.fn(),
      inspectTopologyLinks: jest.fn(),
      executeTopologyAction: jest.fn().mockResolvedValue({
        action: 'pause',
        status: 'unsupported_by_runtime',
        runtimeSupported: false,
        message: 'Topology action "pause" is unsupported by runtime',
        requestedAt: new Date().toISOString(),
        errorCode: 'UNSUPPORTED_BY_RUNTIME',
      }),
    };

    const service = new TopologyService(runtimeAdapterMock as any);
    const result = await service.executeAction('pause', {
      from: { level: 'workspace', id: 'workspace-1' },
      to: { level: 'agent', id: 'agent-1' },
    });

    expect(result.status).toBe('unsupported_by_runtime');
    expect(result.runtimeSupported).toBe(false);
    expect(runtimeAdapterMock.executeTopologyAction).toHaveBeenCalled();
  });
});
