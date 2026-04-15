import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ProfileSpec } from '../../../core-types/src';
import { loadProfileFromMarkdown } from './load-profile-markdown';

let catalogCache: Map<string, ProfileSpec[]> = new Map();
let lastBasePath = '';

export async function loadProfilesCatalog(basePath: string): Promise<ProfileSpec[]> {
  // Return cached result if basePath hasn't changed
  if (catalogCache.size > 0 && lastBasePath === basePath) {
    return Array.from(catalogCache.values()).flat();
  }

  catalogCache.clear();
  lastBasePath = basePath;

  const profilesDir = join(basePath, 'templates', 'profiles');
  const profiles: ProfileSpec[] = [];
  const errors: string[] = [];

  try {
    const files = await readdir(profilesDir);
    const mdFiles = files.filter((f) => f.endsWith('.md') && !f.startsWith('.'));

    for (const file of mdFiles) {
      const profileId = file.replace('.md', '');
      try {
        const profile = await loadProfileFromMarkdown(profileId, basePath);
        profiles.push(profile);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to load profile '${profileId}': ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      console.warn('⚠️ Catalog loading completed with errors:', errors);
    }

    // Store in cache
    catalogCache.set(basePath, profiles);
    return profiles;
  } catch (err) {
    throw new Error(
      `Failed to scan profiles directory: ${profilesDir}. ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Invalidate catalog cache (useful when files change on disk)
 */
export function invalidateProfilesCatalog(): void {
  catalogCache.clear();
  lastBasePath = '';
}
