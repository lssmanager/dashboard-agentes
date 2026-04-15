import fs from 'node:fs';
import path from 'node:path';

import { DeployableArtifact } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';
import { GatewayService } from '../gateway/gateway.service';

export class DeployService {
  private readonly gatewayService = new GatewayService();

  applyArtifacts(artifacts: DeployableArtifact[]) {
    for (const artifact of artifacts) {
      const absolutePath = path.join(studioConfig.workspaceRoot, artifact.path);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, artifact.content, 'utf-8');
    }

    return {
      ok: true,
      written: artifacts.map((artifact) => artifact.path),
      at: new Date().toISOString(),
    };
  }

  async triggerRuntimeReload() {
    return this.gatewayService.call('status', {});
  }
}
