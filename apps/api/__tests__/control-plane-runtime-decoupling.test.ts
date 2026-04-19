import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

describe('Control-plane services are decoupled from concrete gateway service', () => {
  const targetFiles = [
    'src/modules/studio/studio.service.ts',
    'src/modules/topology/topology.service.ts',
    'src/modules/runtime/runtime-inspection.service.ts',
  ];

  it('does not import GatewayService directly in control-plane services', () => {
    for (const relativePath of targetFiles) {
      const absolutePath = path.join(ROOT, relativePath);
      const source = fs.readFileSync(absolutePath, 'utf-8');

      expect(source).not.toContain('../gateway/gateway.service');
      expect(source).not.toContain('new GatewayService(');
      expect(source).toContain('runtimeAdapter');
    }
  });
});
