import { SkillSpec } from '../../core-types/src';
import { skillSpecSchema } from '../../schemas/src';

export class SkillRegistry {
  private readonly byId = new Map<string, SkillSpec>();

  register(skill: SkillSpec): SkillSpec {
    const parsed = skillSpecSchema.parse(skill);
    this.byId.set(parsed.id, parsed as SkillSpec);
    return parsed as SkillSpec;
  }

  registerMany(skills: SkillSpec[]): SkillSpec[] {
    return skills.map((skill) => this.register(skill));
  }

  list(): SkillSpec[] {
    return [...this.byId.values()];
  }

  get(id: string): SkillSpec | undefined {
    return this.byId.get(id);
  }
}
