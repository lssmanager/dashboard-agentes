import { compileFlows } from '../../../../../packages/flow-engine/src';
import { FlowSpec } from '../../../../../packages/core-types/src';
import { flowSpecSchema } from '../../../../../packages/schemas/src';

import { FlowsRepository } from './flows.repository';

export class FlowsService {
  private readonly repository = new FlowsRepository();

  findAll() {
    return this.repository.list();
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  create(flow: FlowSpec) {
    const parsed = flowSpecSchema.parse(flow) as FlowSpec;
    const items = this.repository.list();
    if (items.some((item) => item.id === parsed.id)) {
      throw new Error(`Flow already exists: ${parsed.id}`);
    }
    this.repository.saveAll([...items, parsed]);
    return parsed;
  }

  update(id: string, updates: Partial<FlowSpec>) {
    const items = this.repository.list();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) {
      return null;
    }

    const parsed = flowSpecSchema.parse({ ...items[index], ...updates, id }) as FlowSpec;
    items[index] = parsed;
    this.repository.saveAll(items);
    return parsed;
  }

  remove(id: string) {
    const items = this.repository.list();
    const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) {
      return false;
    }
    this.repository.saveAll(next);
    return true;
  }

  compile() {
    return compileFlows(this.repository.list());
  }
}
