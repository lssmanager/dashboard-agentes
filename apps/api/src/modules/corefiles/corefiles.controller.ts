import { Router } from 'express';

import { DeployableArtifact } from '../../../../../packages/core-types/src';
import { CorefilesService } from './corefiles.service';

export function registerCorefilesRoutes(router: Router) {
  const service = new CorefilesService();

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
}
