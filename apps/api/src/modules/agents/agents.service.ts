import { AgentSpec } from '../../../../../packages/core-types/src';
import { agentSpecSchema } from '../../../../../packages/schemas/src';

import { AgentsRepository } from './agents.repository';

export class AgentsService {
  private readonly repository = new AgentsRepository();

  findAll() {
    return this.repository.list();
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  create(agent: AgentSpec) {
    const parsed = agentSpecSchema.parse(agent) as AgentSpec;
    const agents = this.repository.list();

    if (agents.some((item) => item.id === parsed.id)) {
      throw new Error(`Agent already exists: ${parsed.id}`);
    }

    this.repository.saveAll([...agents, parsed]);
    return parsed;
  }

  update(id: string, updates: Partial<AgentSpec>) {
    const agents = this.repository.list();
    const index = agents.findIndex((agent) => agent.id === id);
    if (index < 0) {
      return null;
    }

    const parsed = agentSpecSchema.parse({ ...agents[index], ...updates, id }) as AgentSpec;
    agents[index] = parsed;
    this.repository.saveAll(agents);
    return parsed;
  }

  remove(id: string) {
    const agents = this.repository.list();
    const next = agents.filter((item) => item.id !== id);
    if (next.length === agents.length) {
      return false;
    }
    this.repository.saveAll(next);
    return true;
  }
}
