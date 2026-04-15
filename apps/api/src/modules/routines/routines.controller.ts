import { Router } from 'express';

import { RoutinesService } from './routines.service';

export function registerRoutinesRoutes(router: Router) {
  const service = new RoutinesService();

  router.get('/routines', async (_req, res) => {
    try {
      const routines = await service.getAll();
      res.json(routines);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: 'Failed to load routines', details: message });
    }
  });
}
