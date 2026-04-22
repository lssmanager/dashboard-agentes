import express, { Router } from 'express';
import request from 'supertest';

import { RuntimeInspectionService } from '../src/modules/runtime/runtime-inspection.service';
import { registerRuntimeInspectionRoutes } from '../src/modules/runtime/runtime-inspection.controller';

function buildApp() {
  const app = express();
  app.use(express.json());
  const router = Router();
  registerRuntimeInspectionRoutes(router);
  app.use(router);
  return app;
}

describe('Runtime inspection routes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns capabilities payload when service succeeds', async () => {
    jest.spyOn(RuntimeInspectionService.prototype, 'getCapabilityMatrix').mockResolvedValue({
      source: 'gateway_capabilities',
      topology: {
        connect: true,
        disconnect: true,
        pause: true,
        reactivate: true,
        redirect: true,
        continue: true,
      },
      inspection: { sessions: true, channels: true, topology: true },
    } as any);

    const app = buildApp();
    const res = await request(app).get('/runtime/capabilities');

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('gateway_capabilities');
  });

  it('returns 503 structured error when service fails', async () => {
    jest.spyOn(RuntimeInspectionService.prototype, 'getSessions').mockRejectedValue(
      new Error('gateway timeout'),
    );

    const app = buildApp();
    const res = await request(app).get('/runtime/sessions');

    expect(res.status).toBe(503);
    expect(res.body).toEqual(
      expect.objectContaining({
        ok: false,
        code: 'RUNTIME_INSPECTION_UNAVAILABLE',
        surface: 'sessions',
      }),
    );
    expect(res.body.error).toContain('gateway timeout');
  });
});

