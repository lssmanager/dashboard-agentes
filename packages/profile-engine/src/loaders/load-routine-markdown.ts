import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface RoutineInfo {
  id: string;
  name: string;
  path: string;
  content: string;
}

function extractHeading(markdown: string): string {
  const firstLine = markdown.split('\n')[0];
  return firstLine.replace(/^#+\s+/, '').trim() || 'Untitled Routine';
}

export async function loadRoutineMarkdown(
  routineId: string,
  basePath: string,
): Promise<RoutineInfo> {
  const routinePath = join(basePath, 'templates', 'workspaces', 'chief-of-staff', 'routines', `${routineId}.md`);

  let content: string;
  try {
    content = await readFile(routinePath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read routine markdown: ${routinePath}`);
  }

  const name = extractHeading(content);

  return {
    id: routineId,
    name,
    path: routinePath,
    content,
  };
}
