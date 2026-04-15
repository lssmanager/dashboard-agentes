import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ProfileSpec } from '../../../core-types/src';

interface ProfileSidecar {
  id: string;
  name: string;
  category?: 'operations' | 'support' | 'engineering' | 'monitoring';
  description?: string;
  defaultModel?: string;
  defaultSkills: string[];
  defaultPolicies?: string[];
  routines: string[];
  tags?: string[];
}

function extractHeadingContent(markdown: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=##|$)`);
  const match = markdown.match(regex);
  return match ? match[1].trim() : '';
}

function extractRoutinesList(content: string): string[] {
  const lines = content.split('\n');
  const routines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      routines.push(trimmed.substring(2).trim());
    }
  }
  return routines;
}

export async function loadProfileFromMarkdown(
  profileId: string,
  basePath: string,
): Promise<ProfileSpec> {
  const mdPath = join(basePath, 'templates', 'profiles', `${profileId}.md`);
  const jsonPath = join(basePath, 'templates', 'profiles', `${profileId}.json`);

  // Read markdown
  let markdownContent = '';
  try {
    markdownContent = await readFile(mdPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read profile markdown: ${mdPath}`);
  }

  // Read JSON sidecar
  let sidecar: ProfileSidecar;
  try {
    const jsonContent = await readFile(jsonPath, 'utf-8');
    sidecar = JSON.parse(jsonContent);
  } catch (err) {
    throw new Error(
      `Failed to read or parse profile sidecar: ${jsonPath}. Ensure ${profileId}.json exists with all required fields.`,
    );
  }

  // Validate sidecar ID matches filename
  if (sidecar.id !== profileId) {
    throw new Error(
      `Profile sidecar ID mismatch: filename is '${profileId}' but sidecar has id='${sidecar.id}'`,
    );
  }

  // Extract markdown sections
  const mdTitle = markdownContent.split('\n')[0].replace(/^#\s+/, '').trim();
  const mdDescription = extractHeadingContent(markdownContent, 'Purpose');
  const mdRoutinesContent = extractHeadingContent(markdownContent, 'Suggested Routines');
  const mdRoutines = extractRoutinesList(mdRoutinesContent);

  // Merge: JSON is primary source, markdown enriches description
  const merged: ProfileSpec = {
    id: sidecar.id,
    name: sidecar.name || mdTitle || profileId,
    description: mdDescription || sidecar.description || '',
    category: sidecar.category,
    defaultModel: sidecar.defaultModel,
    defaultSkills: sidecar.defaultSkills || [],
    defaultPolicies: sidecar.defaultPolicies,
    routines: sidecar.routines && sidecar.routines.length > 0 ? sidecar.routines : mdRoutines,
    tags: sidecar.tags,
  };

  return merged;
}
