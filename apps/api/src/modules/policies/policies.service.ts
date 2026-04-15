import { PolicySpec } from '../../../../../packages/core-types/src';
import { policySpecSchema } from '../../../../../packages/schemas/src';

import { PoliciesRepository } from './policies.repository';

export class PoliciesService {
  private readonly repository = new PoliciesRepository();

  findAll() {
    return this.repository.list();
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  create(policy: PolicySpec) {
    const parsed = policySpecSchema.parse(policy) as PolicySpec;
    const current = this.repository.list();
    if (current.some((item) => item.id === parsed.id)) {
      throw new Error(`Policy already exists: ${parsed.id}`);
    }

    this.repository.saveAll([...current, parsed]);
    return parsed;
  }

  update(id: string, updates: Partial<PolicySpec>) {
    const current = this.repository.list();
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) {
      return null;
    }

    const parsed = policySpecSchema.parse({ ...current[index], ...updates, id }) as PolicySpec;
    current[index] = parsed;
    this.repository.saveAll(current);
    return parsed;
  }

  remove(id: string) {
    const current = this.repository.list();
    const next = current.filter((item) => item.id !== id);
    if (next.length === current.length) {
      return false;
    }

    this.repository.saveAll(next);
    return true;
  }
}
