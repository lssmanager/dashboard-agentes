import { Router } from 'express';

import { StudioService } from './studio.service';

export function registerStudioRoutes(router: Router) {
  const service = new StudioService();

  router.get('/studio/state', async (_req, res) => {
    res.json(await service.getState());
  });

  router.get('/studio/canonical-state', async (_req, res) => {
    res.json(await service.getCanonicalState());
  });
}
