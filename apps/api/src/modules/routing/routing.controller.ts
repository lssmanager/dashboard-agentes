import { Router } from 'express';

import { RoutingService } from './routing.service';

export function registerRoutingRoutes(router: Router) {
  const service = new RoutingService();

  router.get('/routing', (_req, res) => {
    res.json(service.getCompiledRouting());
  });
}
