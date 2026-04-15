import { Router } from 'express';

import { SkillsService } from './skills.service';

export function registerSkillsRoutes(router: Router) {
  const service = new SkillsService();

  router.get('/skills', (_req, res) => {
    res.json(service.findAll());
  });

  router.get('/skills/:id', (req, res) => {
    const item = service.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ ok: false, error: 'Skill not found' });
    }
    return res.json(item);
  });

  router.post('/skills', (req, res) => {
    try {
      return res.status(201).json(service.create(req.body));
    } catch (error) {
      return res.status(422).json({ ok: false, error: (error as Error).message });
    }
  });

  router.put('/skills/:id', (req, res) => {
    try {
      const item = service.update(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ ok: false, error: 'Skill not found' });
      }
      return res.json(item);
    } catch (error) {
      return res.status(422).json({ ok: false, error: (error as Error).message });
    }
  });

  router.delete('/skills/:id', (req, res) => {
    const removed = service.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ ok: false, error: 'Skill not found' });
    }
    return res.status(204).send();
  });
}
