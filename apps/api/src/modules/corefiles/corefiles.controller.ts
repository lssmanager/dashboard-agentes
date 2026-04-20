import { Router } from 'express';

import { DeployableArtifact } from '../../../../../packages/core-types/src';
import { CorefilesFacade } from './corefiles.facade';
import { CorefilesService } from './corefiles.service';

export function registerCorefilesRoutes(router: Router) {
  const service = new CorefilesService();
  const facade = new CorefilesFacade();

  router.get('/corefiles/preview', async (_req, res) => {
    res.json(await service.preview());
  });

  router.get('/corefiles/diff', async (req, res) => {
    const snapshotId = req.query.snapshotId as string | undefined;
    const result = await service.diff(snapshotId);
    if ((result as { ok?: boolean }).ok === false) {
      return res.status(404).json(result);
    }
    return res.json(result);
  });

  router.post('/corefiles/apply', async (req, res) => {
    const payload = req.body as { artifacts?: DeployableArtifact[]; applyRuntime?: boolean };
    const result = await service.apply(payload);
    if (!result.ok) {
      return res.status(422).json(result);
    }
    return res.json(result);
  });

  router.post('/corefiles/rollback', (req, res) => {
    const snapshotId = req.body?.snapshotId as string | undefined;
    if (!snapshotId) {
      return res.status(400).json({ ok: false, error: 'snapshotId is required' });
    }

    const result = service.rollback(snapshotId);
    if (!result.ok) {
      return res.status(404).json(result);
    }
    return res.json(result);
  });

  router.get('/corefiles/:target/preview', async (req, res) => {
    const target = req.params.target;
    res.json(await facade.preview(target));
  });

  router.get('/corefiles/:target/diff', async (req, res) => {
    const target = req.params.target;
    const snapshotId = req.query.snapshotId as string | undefined;
    const result = await facade.diff(target, snapshotId);
    if ((result as { ok?: boolean }).ok === false) {
      return res.status(404).json(result);
    }
    return res.json(result);
  });

  router.post('/corefiles/:target/apply', async (req, res) => {
    const target = req.params.target;
    const applyRuntime = Boolean(req.body?.applyRuntime);
    const result = await facade.apply(target, { applyRuntime });
    if (!result.ok) {
      return res.status(422).json(result);
    }
    return res.json(result);
  });

  router.post('/corefiles/:target/rollback', (req, res) => {
    const snapshotId = req.body?.snapshotId as string | undefined;
    if (!snapshotId) {
      return res.status(400).json({ ok: false, error: 'snapshotId is required' });
    }
    const result = facade.rollback(snapshotId);
    if (!result.ok) {
      return res.status(404).json(result);
    }
    return res.json(result);
  });

  router.get('/corefiles/snapshots', (_req, res) => {
    res.json(facade.listSnapshots());
  });
}
