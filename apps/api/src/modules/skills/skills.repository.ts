import path from 'node:path';

import { SkillSpec } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';

export class SkillsRepository {
  private readonly store = new JsonFileStore<SkillSpec[]>(
    path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'skills.spec.json'),
    [],
  );

  list() {
    return this.store.read();
  }

  findById(id: string) {
    return this.list().find((item) => item.id === id) ?? null;
  }

  saveAll(skills: SkillSpec[]) {
    return this.store.write(skills);
  }
}
