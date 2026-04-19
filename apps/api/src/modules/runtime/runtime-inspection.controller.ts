import { Router } from 'express';

import { RuntimeInspectionService } from './runtime-inspection.service';

export function registerRuntimeInspectionRoutes(router: Router) {
  const service = new RuntimeInspectionService();

  router.get('/runtime/capabilities', async (_req, res) => {
    res.json(await service.getCapabilityMatrix());
  });

  router.get('/runtime/sessions', async (_req, res) => {
    res.json(await service.getSessions());
  });

  router.get('/runtime/channels', async (_req, res) => {
    res.json(await service.getChannels());
  });

  router.get('/runtime/topology-links', async (_req, res) => {
    res.json(await service.getTopologyLinks());
  });
}
