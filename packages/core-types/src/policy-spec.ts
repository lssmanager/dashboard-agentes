export interface PolicyModelConstraint {
  allow: string[];
  deny?: string[];
}

export interface PolicySpec {
  id: string;
  name: string;
  description?: string;
  toolAllowlist: string[];
  toolDenylist: string[];
  channelRules: Record<string, unknown>;
  sandboxMode?: 'strict' | 'relaxed';
  maxTokensPerTurn?: number;
  modelConstraint?: PolicyModelConstraint;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}
