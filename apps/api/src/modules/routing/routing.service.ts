import path from 'node:path';

import { WorkspaceSpec } from '../../../../../packages/core-types/src';
import { compileRouting } from '../../../../../packages/workspace-engine/src';
import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';

const workspaceStore = new JsonFileStore<WorkspaceSpec | null>(
  path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'workspace.spec.json'),
  null,
);

export class RoutingService {
  getCompiledRouting() {
    const workspace = workspaceStore.read();
    if (!workspace) {
      return { workspaceId: null, rules: [] };
    }
    return compileRouting(workspace);
  }
}
