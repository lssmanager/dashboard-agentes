import { SkillSpec } from '../../../../../packages/core-types/src';
import { skillSpecSchema } from '../../../../../packages/schemas/src';

import { SkillsRepository } from './skills.repository';

export class SkillsService {
  private readonly repository = new SkillsRepository();

  findAll() {
    return this.repository.list();
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  create(skill: SkillSpec) {
    const parsed = skillSpecSchema.parse(skill) as SkillSpec;
    const skills = this.repository.list();

    if (skills.some((item) => item.id === parsed.id)) {
      throw new Error(`Skill already exists: ${parsed.id}`);
    }

    this.repository.saveAll([...skills, parsed]);
    return parsed;
  }

  update(id: string, updates: Partial<SkillSpec>) {
    const current = this.repository.list();
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) {
      return null;
    }

    const parsed = skillSpecSchema.parse({ ...current[index], ...updates, id }) as SkillSpec;
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
