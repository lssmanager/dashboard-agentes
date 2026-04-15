import { createServer } from './server';
import { studioConfig } from './config';

const app = createServer();

app.listen(studioConfig.port, () => {
  // eslint-disable-next-line no-console
  console.log(`OpenClaw Studio API listening on ${studioConfig.port}`);
});
