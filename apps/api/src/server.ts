import cors from 'cors';
import express from 'express';

import { registerRoutes } from './routes';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  registerRoutes(app);

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ ok: false, error: error.message });
  });

  return app;
}
