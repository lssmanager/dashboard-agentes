import { Router } from 'express';

import { CanonicalNodeLevel } from '../../../../../packages/core-types/src';
import { BuilderAgentService } from './builder-agent.service';

function isCanonicalLevel(value: string): value is CanonicalNodeLevel {
  return ['agency', 'department', 'workspace', 'agent', 'subagent'].includes(value);
}

export function registerBuilderAgentRoutes(router: Router) {
  const service = new BuilderAgentService();

  router.get('/builder-agent/function', async (req, res) => {
    const levelRaw = (req.query.level as string | undefined) ?? 'workspace';
    const id = (req.query.id as string | undefined) ?? '';
    const level = levelRaw.toLowerCase();

    if (!isCanonicalLevel(level)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid level "${levelRaw}". Use agency|department|workspace|agent|subagent`,
      });
    }

    try {
      const response = await service.getFunctionSummary(level, id);
      return res.json(response);
    } catch (error) {
      return res.status(404).json({
        ok: false,
        error: (error as Error).message,
      });
    }
  });
}
