import path from 'node:path';

import { PolicySpec } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';

export class PoliciesRepository {
  private readonly store = new JsonFileStore<PolicySpec[]>(
    path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'policies.spec.json'),
    [],
  );

  list() {
    return this.store.read();
  }

  findById(id: string) {
    return this.list().find((item) => item.id === id) ?? null;
  }

  saveAll(items: PolicySpec[]) {
    return this.store.write(items);
  }
}
