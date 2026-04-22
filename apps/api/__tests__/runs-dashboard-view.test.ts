import express, { Router } from 'express';
import request from 'supertest';

import { RunsService } from '../src/modules/runs/runs.service';
import { registerRunsRoutes } from '../src/modules/runs/runs.controller';

function buildApp() {
  const app = express();
  const router = Router();
  registerRunsRoutes(router);
  app.use(router);
  return app;
}

describe('GET /runs?view=dashboard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the minimal dashboard-aligned run projection without changing legacy /runs default behavior', async () => {
    jest.spyOn(RunsService.prototype, 'getDashboardProjection').mockReturnValue([
      {
        id: 'run-1',
        workspaceId: 'workspace-1',
        flowId: 'flow-1',
        status: 'running',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: undefined,
        costUsd: 1.25,
        waitingApprovalCount: 1,
        failedStepCount: 0,
        agentIds: ['agent-1'],
      },
    ] as any);

    const app = buildApp();
    const res = await request(app).get('/runs?view=dashboard&limit=5');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: 'run-1',
        workspaceId: 'workspace-1',
        flowId: 'flow-1',
        status: 'running',
        costUsd: 1.25,
        waitingApprovalCount: 1,
      }),
    );
  });
});
