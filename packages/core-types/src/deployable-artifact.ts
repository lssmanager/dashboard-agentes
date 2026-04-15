export type DeployableArtifactType =
  | 'workspace'
  | 'agent'
  | 'flow'
  | 'skill'
  | 'routing'
  | 'profile'
  | 'policy'
  | 'prompt-file';

export interface DeployableArtifact {
  type: DeployableArtifactType;
  id: string;
  name: string;
  content: string;
  path: string;
  mediaType?: 'text/markdown' | 'application/json' | 'text/plain' | 'text/yaml';
  sourceHash?: string;
}

export interface ArtifactDiff {
  path: string;
  status: 'added' | 'updated' | 'deleted' | 'unchanged';
  before?: string;
  after?: string;
}

export interface CompileResult {
  artifacts: DeployableArtifact[];
  diagnostics: string[];
}
