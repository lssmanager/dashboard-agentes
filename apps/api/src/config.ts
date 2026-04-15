import path from 'node:path';

export const studioConfig = {
  port: Number(process.env.STUDIO_API_PORT ?? process.env.PORT ?? 3400),
  apiPrefix: process.env.STUDIO_API_PREFIX ?? '/api/studio/v1',
  gatewayBaseUrl: process.env.GATEWAY_ADAPTER_URL ?? 'http://localhost:3000/api',
  workspaceRoot: process.env.OPENCLAW_WORKSPACE_ROOT ?? path.resolve(process.cwd()),
};
