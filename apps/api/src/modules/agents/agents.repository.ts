import path from 'node:path';

import { AgentSpec } from '../../../../../packages/core-types/src';
import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';

const defaultAgents: AgentSpec[] = [];

export class AgentsRepository {
  private readonly store = new JsonFileStore<AgentSpec[]>(
    path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'agents.spec.json'),
    defaultAgents,
  );

  list(): AgentSpec[] {
    return this.store.read();
  }

  findById(id: string): AgentSpec | null {
    return this.list().find((item) => item.id === id) ?? null;
  }

  saveAll(agents: AgentSpec[]): AgentSpec[] {
    return this.store.write(agents);
  }
}
