import { RoutineSpec } from '../../../../../packages/core-types/src';
import { loadRoutinesCatalog } from '../../../../../packages/profile-engine/src';
import { routineSpecSchema } from '../../../../../packages/schemas/src';

export class RoutinesService {
  private cache: RoutineSpec[] | null = null;

  async getAll(basePath: string = process.cwd()): Promise<RoutineSpec[]> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const routines = await loadRoutinesCatalog(basePath);
      // Validate each routine against schema
      const validated = routines.map((r) => routineSpecSchema.parse(r));
      this.cache = validated;
      return validated;
    } catch (err) {
      console.error(
        `Failed to load routines catalog: ${err instanceof Error ? err.message : String(err)}`,
      );
      // Return empty array if loading fails
      return [];
    }
  }

  async getById(id: string, basePath: string = process.cwd()): Promise<RoutineSpec | null> {
    const routines = await this.getAll(basePath);
    return routines.find((r) => r.id === id) || null;
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
