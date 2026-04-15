import fs from 'node:fs';
import path from 'node:path';

export interface WriteWorkspaceInput {
  promptFiles: Record<string, string>;
  specs?: Record<string, unknown>;
}

export interface WriteWorkspaceResult {
  writtenPromptFiles: string[];
  writtenSpecs: string[];
}

export function writeWorkspace(workspacePath: string, input: WriteWorkspaceInput): WriteWorkspaceResult {
  fs.mkdirSync(workspacePath, { recursive: true });

  const writtenPromptFiles: string[] = [];
  for (const [fileName, content] of Object.entries(input.promptFiles)) {
    fs.writeFileSync(path.join(workspacePath, fileName), content, 'utf-8');
    writtenPromptFiles.push(fileName);
  }

  const writtenSpecs: string[] = [];
  if (input.specs) {
    const specsDir = path.join(workspacePath, '.openclaw-studio');
    fs.mkdirSync(specsDir, { recursive: true });

    for (const [name, value] of Object.entries(input.specs)) {
      fs.writeFileSync(path.join(specsDir, `${name}.json`), JSON.stringify(value, null, 2), 'utf-8');
      writtenSpecs.push(`${name}.json`);
    }
  }

  return { writtenPromptFiles, writtenSpecs };
}
