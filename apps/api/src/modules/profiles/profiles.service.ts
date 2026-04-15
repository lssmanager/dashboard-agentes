import { profileSpecSchema } from '../../../../../packages/schemas/src';
import { loadProfilesCatalog } from '../../../../../packages/profile-engine/src';
import { ProfileSpec } from '../../../../../packages/core-types/src';

export class ProfilesService {
  private cache: ProfileSpec[] | null = null;

  async getAll(basePath: string = process.cwd()): Promise<ProfileSpec[]> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const profiles = await loadProfilesCatalog(basePath);
      // Validate each profile against schema
      const validated = profiles.map((p) => profileSpecSchema.parse(p));
      this.cache = validated;
      return validated;
    } catch (err) {
      console.error(
        `Failed to load profiles catalog: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Return empty array if loading fails
      return [];
    }
  }

  async getById(id: string, basePath: string = process.cwd()): Promise<ProfileSpec | null> {
    const profiles = await this.getAll(basePath);
    return profiles.find((p) => p.id === id) || null;
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
