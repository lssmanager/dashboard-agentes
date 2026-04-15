import path from 'node:path';

import { WorkspaceSpec } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';

export class WorkspacesRepository {
  private readonly store = new JsonFileStore<WorkspaceSpec | null>(
    path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'workspace.spec.json'),
    null,
  );

  getCurrent() {
    return this.store.read();
  }

  save(workspace: WorkspaceSpec) {
    return this.store.write(workspace);
  }
}
