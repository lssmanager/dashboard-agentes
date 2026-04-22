import express, { Router } from 'express';
import request from 'supertest';

import { TopologyService } from '../src/modules/topology/topology.service';
import { registerTopologyRoutes } from '../src/modules/topology/topology.controller';

function buildApp() {
  const app = express();
  app.use(express.json());

  const router = Router();
  registerTopologyRoutes(router);
  app.use(router);

  return app;
}

const VALID_PAYLOAD = {
  from: { level: 'workspace', id: 'workspace-1' },
  to: { level: 'agent', id: 'agent-1' },
};

describe('POST /topology/:action operational HTTP semantics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns HTTP 200 for unsupported_by_runtime', async () => {
    jest.spyOn(TopologyService.prototype, 'executeAction').mockResolvedValue({
      action: 'connect',
      status: 'unsupported_by_runtime',
      runtimeSupported: false,
      message: 'Topology action "connect" is unsupported by runtime',
      requestedAt: new Date().toISOString(),
      errorCode: 'UNSUPPORTED_BY_RUNTIME',
    } as any);

    const app = buildApp();
    const res = await request(app).post('/topology/connect').send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('unsupported_by_runtime');
    expect(res.body.errorCode).toBe('UNSUPPORTED_BY_RUNTIME');
  });

  it('returns HTTP 200 for partial runtime outcomes', async () => {
    jest.spyOn(TopologyService.prototype, 'executeAction').mockResolvedValue({
      action: 'redirect',
      status: 'partial',
      runtimeSupported: true,
      message: 'Redirect applied for primary target, fallback target remains pending',
      requestedAt: new Date().toISOString(),
      errorCode: 'FALLBACK_PENDING',
    } as any);

    const app = buildApp();
    const res = await request(app).post('/topology/redirect').send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('partial');
    expect(res.body.message).toContain('fallback target');
  });

  it('returns HTTP 400 for invalid topology payloads', async () => {
    const app = buildApp();
    const res = await request(app).post('/topology/connect').send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('rejected');
    expect(res.body.errorCode).toBe('INVALID_TOPOLOGY_REQUEST');
  });
});
