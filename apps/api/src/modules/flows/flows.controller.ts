import { Router } from 'express';

import { FlowsService } from './flows.service';

export function registerFlowsRoutes(router: Router) {
  const service = new FlowsService();

  router.get('/flows', (_req, res) => {
    res.json(service.findAll());
  });

  router.get('/flows/:id', (req, res) => {
    const item = service.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'Flow not found' });
    }
    return res.json(item);
  });

  router.post('/flows', (req, res) => {
    try {
      return res.status(201).json(service.create(req.body));
    } catch (error) {
      return res.status(422).json({ ok: false, error: (error as Error).message });
    }
  });

  router.put('/flows/:id', (req, res) => {
    try {
      const item = service.update(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ ok: false, error: 'Flow not found' });
      }
      return res.json(item);
    } catch (error) {
      return res.status(422).json({ ok: false, error: (error as Error).message });
    }
  });

  router.delete('/flows/:id', (req, res) => {
    const removed = service.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ ok: false, error: 'Flow not found' });
    }
    return res.status(204).send();
  });

  router.get('/flows/compiled', (_req, res) => {
    res.json(service.compile());
  });
}
