import fs from 'node:fs';
import path from 'node:path';

import { ArtifactDiff, DeployableArtifact } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';

export class DeployDiffService {
  diffArtifacts(artifacts: DeployableArtifact[]): ArtifactDiff[] {
    return artifacts.map((artifact) => {
      const absolutePath = path.join(studioConfig.workspaceRoot, artifact.path);
      const current = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf-8') : undefined;
      if (current === undefined) {
        return { path: artifact.path, status: 'added', after: artifact.content };
      }
      if (current === artifact.content) {
        return { path: artifact.path, status: 'unchanged', before: current, after: artifact.content };
      }
      return { path: artifact.path, status: 'updated', before: current, after: artifact.content };
    });
  }
}
