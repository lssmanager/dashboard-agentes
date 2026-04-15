import path from 'node:path';

import { FlowSpec } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';

export class FlowsRepository {
  private readonly store = new JsonFileStore<FlowSpec[]>(
    path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'flows.spec.json'),
    [],
  );

  list() {
    return this.store.read();
  }

  findById(id: string) {
    return this.list().find((item) => item.id === id) ?? null;
  }

  saveAll(flows: FlowSpec[]) {
    return this.store.write(flows);
  }
}
