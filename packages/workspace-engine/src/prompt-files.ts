import { DeployableArtifact } from '../../core-types/src';

export function artifactsToPromptFiles(artifacts: DeployableArtifact[]): Record<string, string> {
  return artifacts
    .filter((artifact) => artifact.type === 'prompt-file')
    .reduce<Record<string, string>>((acc, artifact) => {
      acc[artifact.path] = artifact.content;
      return acc;
    }, {});
}
