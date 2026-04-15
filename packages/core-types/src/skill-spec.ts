export interface SkillFunctionSpec {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface SkillPluginMetadata {
  provider: string;
  pluginId: string;
  displayName?: string;
  version?: string;
}

export interface SkillSpec {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  permissions: string[];
  functions: SkillFunctionSpec[];
  plugin?: SkillPluginMetadata;
  files?: string[];
  dependencies?: string[];
  createdAt?: string;
  updatedAt?: string;
}
