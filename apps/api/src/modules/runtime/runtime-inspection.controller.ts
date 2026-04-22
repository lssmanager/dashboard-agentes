import { type Response, Router } from 'express';

import { RuntimeInspectionService } from './runtime-inspection.service';

export function registerRuntimeInspectionRoutes(router: Router) {
  const service = new RuntimeInspectionService();

  async function handleInspection<T>(surface: string, load: () => Promise<T>, res: Response) {
    try {
      res.json(await load());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Runtime inspection unavailable';
      res.status(503).json({
        ok: false,
        code: 'RUNTIME_INSPECTION_UNAVAILABLE',
        surface,
        error: message,
      });
    }
  }

  router.get('/runtime/capabilities', async (_req, res) => {
    await handleInspection('capabilities', () => service.getCapabilityMatrix(), res);
  });

  router.get('/runtime/sessions', async (_req, res) => {
    await handleInspection('sessions', () => service.getSessions(), res);
  });

  router.get('/runtime/channels', async (_req, res) => {
    await handleInspection('channels', () => service.getChannels(), res);
  });

  router.get('/runtime/topology-links', async (_req, res) => {
    await handleInspection('topology-links', () => service.getTopologyLinks(), res);
  });
}
