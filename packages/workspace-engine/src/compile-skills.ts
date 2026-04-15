import { SkillSpec } from '../../core-types/src';

export function compileSkills(skills: SkillSpec[]) {
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    version: skill.version,
    category: skill.category,
    permissions: skill.permissions,
    plugin: skill.plugin,
    functions: skill.functions,
    dependencies: skill.dependencies ?? [],
  }));
}
