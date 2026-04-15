import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { RoutineSpec } from '../../../core-types/src';
import { loadRoutineMarkdown } from './load-routine-markdown';

let routinesCatalogCache: Map<string, RoutineSpec[]> = new Map();
let lastBasePath = '';

function extractHeading(markdown: string): string {
  const firstLine = markdown.split('\n')[0];
  return firstLine.replace(/^#+\s+/, '').trim() || 'Untitled Routine';
}

export async function loadRoutinesCatalog(basePath: string): Promise<RoutineSpec[]> {
  // Return cached result if basePath hasn't changed
  if (routinesCatalogCache.size > 0 && lastBasePath === basePath) {
    return Array.from(routinesCatalogCache.values()).flat();
  }

  routinesCatalogCache.clear();
  lastBasePath = basePath;

  const routinesDir = join(basePath, 'templates', 'workspaces', 'chief-of-staff', 'routines');
  const routines: RoutineSpec[] = [];
  const errors: string[] = [];

  try {
    const files = await readdir(routinesDir);
    const mdFiles = files.filter((f) => f.endsWith('.md') && !f.startsWith('.'));

    for (const file of mdFiles) {
      const routineId = file.replace('.md', '');
      try {
        const routineInfo = await loadRoutineMarkdown(routineId, basePath);
        const name = extractHeading(routineInfo.content);

        const routine: RoutineSpec = {
          id: routineId,
          name,
          description: `Routine: ${name}`,
          promptTemplate: routineInfo.content,
          steps: [],
        };

        routines.push(routine);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to load routine '${routineId}': ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      console.warn('⚠️ Routines catalog loading completed with errors:', errors);
    }

    // Store in cache
    routinesCatalogCache.set(basePath, routines);
    return routines;
  } catch (err) {
    throw new Error(
      `Failed to scan routines directory: ${routinesDir}. ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Invalidate routines catalog cache (useful when files change on disk)
 */
export function invalidateRoutinesCatalog(): void {
  routinesCatalogCache.clear();
  lastBasePath = '';
}
