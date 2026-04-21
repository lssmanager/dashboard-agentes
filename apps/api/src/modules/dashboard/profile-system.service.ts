import path from 'node:path';

import type { CanonicalNodeLevel, CanonicalStudioState, ProfileSpec } from '../../../../../packages/core-types/src';

import { studioConfig } from '../../config';
import { JsonFileStore } from '../../lib/file-store';
import { ProfilesService } from '../profiles/profiles.service';
import type {
  BindProfileRequestDto,
  EffectiveProfileDto,
  ProfileOverrideRequestDto,
  ScopeDto,
  UnbindProfileRequestDto,
} from './dashboard.dto';

type ProfileBinding = {
  level: CanonicalNodeLevel;
  id: string;
  profileId: string;
  boundAt: string;
};

type ProfileOverride = {
  level: CanonicalNodeLevel;
  id: string;
  model?: string;
  skills?: string[];
  routines?: string[];
  tags?: string[];
  updatedAt: string;
};

type ProfileState = {
  bindings: ProfileBinding[];
  overrides: ProfileOverride[];
};

const profileStateStore = new JsonFileStore<ProfileState>(
  path.join(studioConfig.workspaceRoot, '.openclaw-studio', 'profile-state.json'),
  { bindings: [], overrides: [] },
);

export class DashboardProfileService {
  private readonly profiles = new ProfilesService();

  async getCatalog(): Promise<ProfileSpec[]> {
    return this.profiles.getAll(studioConfig.workspaceRoot);
  }

  async getEffectiveProfile(scope: ScopeDto, lineage: Array<{ level: CanonicalNodeLevel; id: string }>): Promise<EffectiveProfileDto> {
    const catalog = await this.getCatalog();
    const state = profileStateStore.read();

    const applied = this.findAppliedBinding(state.bindings, scope, lineage);
    const profile = applied ? catalog.find((item) => item.id === applied.profileId) ?? null : null;
    const override = this.findOverride(state.overrides, scope.level, scope.id);

    const baseModel = profile?.defaultModel ?? null;
    const baseSkills = profile?.defaultSkills ?? [];
    const baseRoutines = profile?.routines ?? [];
    const baseTags = profile?.tags ?? [];

    return {
      catalogProfile: profile
        ? {
            id: profile.id,
            name: profile.name,
            description: profile.description,
          }
        : null,
      appliedAtLevel: applied?.level ?? null,
      inheritedFrom:
        applied && applied.level !== scope.level
          ? [{ level: applied.level, id: applied.id }]
          : [],
      overrides: {
        model: override?.model,
        skills: override?.skills,
        routines: override?.routines,
        tags: override?.tags,
      },
      effectiveModel: override?.model ?? baseModel,
      effectiveSkills: override?.skills ?? baseSkills,
      effectiveRoutines: override?.routines ?? baseRoutines,
      effectiveTags: override?.tags ?? baseTags,
    };
  }

  bindProfile(input: BindProfileRequestDto) {
    const state = profileStateStore.read();
    const nextBindings = state.bindings.filter((item) => !(item.level === input.level && item.id === input.id));
    nextBindings.push({
      level: input.level,
      id: input.id,
      profileId: input.profileId,
      boundAt: new Date().toISOString(),
    });

    profileStateStore.write({ ...state, bindings: nextBindings });
    return { ok: true };
  }

  unbindProfile(input: UnbindProfileRequestDto) {
    const state = profileStateStore.read();
    const nextBindings = state.bindings.filter((item) => !(item.level === input.level && item.id === input.id));
    profileStateStore.write({ ...state, bindings: nextBindings });
    return { ok: true };
  }

  setOverride(input: ProfileOverrideRequestDto) {
    const state = profileStateStore.read();
    const next = state.overrides.filter((item) => !(item.level === input.level && item.id === input.id));

    next.push({
      level: input.level,
      id: input.id,
      model: input.overrides.model,
      skills: input.overrides.skills,
      routines: input.overrides.routines,
      tags: input.overrides.tags,
      updatedAt: new Date().toISOString(),
    });

    profileStateStore.write({ ...state, overrides: next });
    return { ok: true };
  }

  private findAppliedBinding(bindings: ProfileBinding[], scope: ScopeDto, lineage: Array<{ level: CanonicalNodeLevel; id: string }>) {
    const direct = bindings.find((item) => item.level === scope.level && item.id === scope.id);
    if (direct) return direct;

    for (let index = lineage.length - 1; index >= 0; index -= 1) {
      const candidate = lineage[index];
      const inherited = bindings.find((item) => item.level === candidate.level && item.id === candidate.id);
      if (inherited) return inherited;
    }

    return null;
  }

  private findOverride(overrides: ProfileOverride[], level: CanonicalNodeLevel, id: string) {
    return overrides.find((item) => item.level === level && item.id === id) ?? null;
  }
}

