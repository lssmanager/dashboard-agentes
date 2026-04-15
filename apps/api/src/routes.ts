import { Express, Router } from 'express';

import { studioConfig } from './config';
import { registerAgentsRoutes } from './modules/agents/agents.controller';
import { registerDeployRoutes } from './modules/deploy/deploy.controller';
import { registerFlowsRoutes } from './modules/flows/flows.controller';
import { registerGatewayRoutes } from './modules/gateway/gateway.controller';
import { registerPoliciesRoutes } from './modules/policies/policies.controller';
import { registerProfilesRoutes } from './modules/profiles/profiles.controller';
import { registerRoutinesRoutes } from './modules/routines/routines.controller';
import { registerRoutingRoutes } from './modules/routing/routing.controller';
import { registerSkillsRoutes } from './modules/skills/skills.controller';
import { registerStudioRoutes } from './modules/studio/studio.controller';
import { registerWorkspacesRoutes } from './modules/workspaces/workspaces.controller';

export function registerRoutes(app: Express) {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'openclaw-studio-api', timestamp: new Date().toISOString() });
  });

  registerStudioRoutes(router);
  registerWorkspacesRoutes(router);
  registerAgentsRoutes(router);
  registerSkillsRoutes(router);
  registerFlowsRoutes(router);
  registerPoliciesRoutes(router);
  registerProfilesRoutes(router);
  registerRoutinesRoutes(router);
  registerRoutingRoutes(router);
  registerDeployRoutes(router);
  registerGatewayRoutes(router);

  app.use(studioConfig.apiPrefix, router);
}
