import { AgentsService } from '../agents/agents.service';
import { DashboardProfileService } from '../dashboard/profile-system.service';
import { DashboardScopeResolver } from '../dashboard/scope-resolver.service';
import type { EditorSkillsToolsDto, EditorSkillsToolsPatchDto } from '../dashboard/dashboard.dto';
import type { MetricsQueryDto } from '../dashboard/dto/metrics-query.dto';
import { StudioService } from '../studio/studio.service';

import { EditorSkillsResolver } from './editor-skills-resolver';

export class EditorService {
  private readonly studioService = new StudioService();
  private readonly scopeResolver = new DashboardScopeResolver();
  private readonly profileService = new DashboardProfileService();
  private readonly agentsService = new AgentsService();
  private readonly skillsResolver = new EditorSkillsResolver();

  async getSkillsTools(input: MetricsQueryDto): Promise<EditorSkillsToolsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const effectiveProfile = await this.profileService.getEffectiveProfile(resolved.scope, resolved.lineage);

    return this.skillsResolver.resolve({
      canonical,
      scope: resolved.scope,
      profileDefaults: effectiveProfile.effectiveSkills ?? [],
    });
  }

  async patchSkillsTools(input: EditorSkillsToolsPatchDto): Promise<{ ok: boolean; updatedAgentId?: string; message?: string }> {
    const canonical = await this.studioService.getCanonicalState();
    const actor =
      canonical.agents.find((item) => item.id === input.id) ??
      canonical.subagents.find((item) => item.id === input.id) ??
      null;

    if (!actor) {
      return { ok: false, message: 'skills/tools patch is only supported for agent/subagent scopes' };
    }

    const nextSkills = new Set(actor.skillRefs ?? []);
    const nextTools = new Set<string>((actor.permissions?.tools ?? []).filter((item): item is string => typeof item === 'string'));
    const blockedSkills = new Set(input.skills?.disable ?? []);
    const blockedTools = new Set(input.tools?.disable ?? []);

    for (const id of input.skills?.select ?? []) {
      if (!blockedSkills.has(id)) nextSkills.add(id);
    }
    for (const id of input.skills?.require ?? []) {
      if (!blockedSkills.has(id)) nextSkills.add(id);
    }
    for (const id of input.skills?.deselect ?? []) {
      nextSkills.delete(id);
    }

    for (const id of input.tools?.select ?? []) {
      if (!blockedTools.has(id)) nextTools.add(id);
    }
    for (const id of input.tools?.require ?? []) {
      if (!blockedTools.has(id)) nextTools.add(id);
    }
    for (const id of input.tools?.deselect ?? []) {
      nextTools.delete(id);
    }

    const updated = this.agentsService.update(actor.id, {
      skillRefs: [...nextSkills],
      permissions: {
        ...(actor.permissions ?? {}),
        tools: [...nextTools],
      },
    });

    if (!updated) {
      return { ok: false, message: 'failed to update agent assignments' };
    }

    return { ok: true, updatedAgentId: updated.id };
  }
}

