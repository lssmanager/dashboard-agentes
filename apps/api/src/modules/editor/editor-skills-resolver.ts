import type { CanonicalStudioState } from '../../../../../packages/core-types/src';

import type { EditorSkillsToolsDto } from '../dashboard/dashboard.dto';

type ResolveInput = {
  canonical: CanonicalStudioState;
  scope: EditorSkillsToolsDto['scope'];
  profileDefaults: string[];
};

export class EditorSkillsResolver {
  resolve(input: ResolveInput): EditorSkillsToolsDto {
    const actor =
      input.canonical.agents.find((item) => item.id === input.scope.id) ??
      input.canonical.subagents.find((item) => item.id === input.scope.id) ??
      null;

    const selectedSkills = new Set(actor?.skillRefs ?? []);
    const selectedTools = new Set<string>((actor?.permissions?.tools ?? []).filter((item): item is string => typeof item === 'string'));

    const skillItems: EditorSkillsToolsDto['skills'] = input.canonical.catalog.skills.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      source: input.profileDefaults.includes(item.id) ? 'profile' : 'global',
      state: selectedSkills.has(item.id) ? 'selected' : 'available',
      blockedReason: undefined,
    }));

    const toolItems: EditorSkillsToolsDto['tools'] = input.canonical.catalog.tools.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      type: (item as { type?: string; category?: string }).type ?? item.category ?? 'tool',
      source: 'global',
      state: selectedTools.has(item.id) ? 'selected' : 'available',
      blockedReason: undefined,
    }));

    return {
      scope: input.scope,
      sources: {
        profileDefaults: input.profileDefaults,
        agencyEnabled: input.canonical.catalog.skills.map((item) => item.id),
        inherited: [],
        localOverrides: actor?.skillRefs ?? [],
      },
      skills: skillItems,
      tools: toolItems,
      effective: {
        skills: [...selectedSkills],
        tools: [...selectedTools],
      },
    };
  }
}

