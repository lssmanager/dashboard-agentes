import { Router } from 'express';

import { PoliciesService } from './policies.service';

export function registerPoliciesRoutes(router: Router) {
  const service = new PoliciesService();

  router.get('/policies', (_req, res) => {
    res.json(service.findAll());
  });

  router.get('/policies/:id', (req, res) => {
    const item = service.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'Policy not found' });
    }
    return res.json(item);
  });

  router.post('/policies', (req, res) => {
    try {
      return res.status(201).json(service.create(req.body));
    } catch (error) {
      return res.status(422).json({ ok: false, error: (error as Error).message });
    }
  });

  router.put('/policies/:id', (req, res) => {
    try {
      const item = service.update(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ ok: false, error: 'Policy not found' });
      }
      return res.json(item);
    } catch (error) {
      return res.status(422).json({ ok: false, error: (error as Error).message });
    }
  });

  router.delete('/policies/:id', (req, res) => {
    const removed = service.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ ok: false, error: 'Policy not found' });
    }
    return res.status(204).send();
  });
}
