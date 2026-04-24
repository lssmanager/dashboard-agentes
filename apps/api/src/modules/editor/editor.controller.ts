import { Router } from 'express';

import type { EditorSkillsToolsPatchDto } from '../dashboard/dashboard.dto';
import { validateMetricsQuery } from '../dashboard/dto/metrics-query.dto';

import { EditorService } from './editor.service';

export function registerEditorRoutes(router: Router) {
  const service = new EditorService();

  router.get('/editor/skills-tools', async (req, res) => {
    const query = validateMetricsQuery(req.query as Record<string, unknown>, { allowGranularity: false });
    if (!query.ok || !query.value) {
      return res.status(400).json({
        ok: false,
        code: 'INVALID_QUERY',
        errors: query.errors,
      });
    }
    return res.json(await service.getSkillsTools(query.value));
  });

  router.patch('/editor/skills-tools', async (req, res) => {
    const payload = req.body as EditorSkillsToolsPatchDto;
    if (!payload?.level || !payload?.id) {
      return res.status(400).json({ ok: false, error: 'level and id are required' });
    }
    return res.json(await service.patchSkillsTools(payload));
  });
}

