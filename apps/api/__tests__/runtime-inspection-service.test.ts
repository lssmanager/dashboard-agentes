import { RuntimeInspectionService } from '../src/modules/runtime/runtime-inspection.service';

describe('RuntimeInspectionService', () => {
  it('falls back to empty topology input when canonical state load fails', async () => {
    const runtimeAdapterMock = {
      getRuntimeSnapshot: jest.fn(),
      getCapabilities: jest.fn().mockResolvedValue({
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
      }),
      inspectSessions: jest.fn().mockResolvedValue([]),
      inspectChannels: jest.fn().mockResolvedValue([]),
      inspectTopologyLinks: jest.fn().mockResolvedValue([]),
      executeTopologyAction: jest.fn(),
    };

    const service = new RuntimeInspectionService(runtimeAdapterMock as any);
    (service as any).studio = {
      getCanonicalState: jest.fn().mockRejectedValue(new Error('canonical unavailable')),
    };

    const links = await service.getTopologyLinks();

    expect(links).toEqual([]);
    expect(runtimeAdapterMock.inspectTopologyLinks).toHaveBeenCalledWith([]);
  });
});

