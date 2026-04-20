import { CorefilesService } from '../src/modules/corefiles/corefiles.service';
import { CorefilesFacade } from '../src/modules/corefiles/corefiles.facade';

describe('CorefilesService', () => {
  it('creates a snapshot before applying artifacts', async () => {
    const service = new CorefilesService() as any;
    service.compiler = { compileCurrent: async () => ({ artifacts: [{ id: 'a' }], diagnostics: [] }) };
    service.versionsService = { createSnapshot: jest.fn().mockReturnValue({ id: 'snap-1' }) };
    service.deployService = {
      applyArtifacts: jest.fn().mockReturnValue({ written: 1 }),
      triggerRuntimeReload: jest.fn().mockResolvedValue({ ok: true }),
    };

    const result = await service.apply({ applyRuntime: true });

    expect(service.versionsService.createSnapshot).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.snapshotId).toBe('snap-1');
  });
});

describe('CorefilesFacade', () => {
  it('filters preview by target token', async () => {
    const facade = new CorefilesFacade() as any;
    facade.corefilesService = {
      preview: async () => ({
        artifacts: [],
        diagnostics: [],
        diff: [
          { path: 'IDENTITY.md', status: 'updated' },
          { path: 'MEMORY.md', status: 'updated' },
        ],
      }),
    };

    const result = await facade.preview('IDENTITY');

    expect(result.diff).toHaveLength(1);
    expect(result.diff[0].path).toBe('IDENTITY.md');
  });
});
