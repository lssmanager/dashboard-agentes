import fs from 'node:fs';
import path from 'node:path';

import { openClawPromptTemplateFiles } from './templates';

export interface ReadWorkspaceResult {
  promptFiles: Record<string, string>;
  specs: Record<string, unknown>;
}

export function readWorkspace(workspacePath: string): ReadWorkspaceResult {
  const promptFiles: Record<string, string> = {};

  for (const fileName of openClawPromptTemplateFiles) {
    const filePath = path.join(workspacePath, fileName);
    promptFiles[fileName] = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  }

  const specsPath = path.join(workspacePath, '.openclaw-studio');
  const specs: Record<string, unknown> = {};

  if (fs.existsSync(specsPath)) {
    for (const item of fs.readdirSync(specsPath)) {
      if (!item.endsWith('.json')) {
        continue;
      }
      const fullPath = path.join(specsPath, item);
      try {
        specs[item] = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      } catch {
        specs[item] = null;
      }
    }
  }

  return { promptFiles, specs };
}
