export type AgentVisibility = 'private' | 'workspace' | 'public';
export type AgentExecutionMode = 'direct' | 'orchestrated' | 'handoff';
export type AgentKind = 'agent' | 'subagent' | 'orchestrator';

export interface AgentTrigger {
  type: 'event' | 'schedule' | 'manual' | 'webhook';
  config?: Record<string, unknown>;
}

export interface AgentPermission {
  tools?: string[];
  channels?: string[];
  models?: string[];
  maxTokensPerTurn?: number;
}

export interface AgentHandoffRule {
  id: string;
  targetAgentId: string;
  when: string;
  description?: string;
  priority?: number;
}

export interface AgentChannelBinding {
  id: string;
  channel: string;
  route: string;
  enabled: boolean;
}

export interface AgentPolicyBinding {
  policyId: string;
  mode: 'enforce' | 'warn';
}

export interface AgentIdentity {
  name: string;
  creature?: string;
  role?: string;
  description?: string;
  vibe?: string;
  emoji?: string;
  avatar?: string;
}

export interface AgentBehavior {
  systemPrompt?: string;
  personalityGuide?: string;
  operatingPrinciples?: string[];
  boundaries?: string[];
  privacyRules?: string[];
  continuityRules?: string[];
  responseStyle?: string;
}

export interface AgentHumanContext {
  humanName?: string;
  addressAs?: string;
  pronouns?: string;
  timezone?: string;
  notes?: string;
  context?: string;
}

export interface AgentSkillsTools {
  assignedSkills?: string[];
  enabledTools?: string[];
  localNotes?: string;
  deviceAliases?: Record<string, string>;
  sshAliases?: Record<string, string>;
  ttsPreferences?: Record<string, string>;
  environmentNotes?: string;
}

export interface AgentHandoffs {
  allowedTargets?: string[];
  fallbackAgent?: string;
  escalationPolicy?: string;
  approvalLane?: string;
  delegationNotes?: string;
  internalActionsAllowed?: string[];
  externalActionsRequireApproval?: string[];
  publicPostingRequiresApproval?: boolean;
}

export interface AgentRoutingChannels {
  allowedChannels?: string[];
  defaultChannel?: string;
  fallbackChannel?: string;
  groupChatMode?: 'silent_by_default' | 'respond_when_mentioned' | 'active';
  reactionPolicy?: 'enabled' | 'disabled' | 'limited';
  maxReactionsPerMessage?: number;
  avoidTripleTap?: boolean;
  platformFormattingRules?: string;
  responseTriggerPolicy?: string;
}

export interface AgentHooks {
  heartbeat?: {
    enabled: boolean;
    promptSource: 'HEARTBEAT.md' | 'inline' | 'disabled';
    checkEmail?: boolean;
    checkCalendar?: boolean;
    checkWeather?: boolean;
    checkMentions?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  lifecycleHooks?: string[];
  cronHooks?: { schedule: string; task: string }[];
  proactiveChecks?: string[];
}

export interface AgentOperations {
  startup?: {
    readSoul: boolean;
    readUser: boolean;
    readDailyMemory: boolean;
    readLongTermMemoryInMainSessionOnly: boolean;
  };
  memoryPolicy?: {
    dailyNotesEnabled: boolean;
    longTermMemoryEnabled: boolean;
    memoryScope: 'main_session_only' | 'shared_safe' | 'disabled';
    compactionPolicy?: string;
  };
  safety?: {
    destructiveCommandsRequireApproval: boolean;
    externalActionsRequireApproval: boolean;
    privateDataProtection: boolean;
    recoverableDeletePreferred: boolean;
  };
  retryPolicy?: string;
  runtimeHealthNotes?: string;
}

export interface AgentReadiness {
  identityComplete: boolean;
  behaviorComplete: boolean;
  toolsAssigned: boolean;
  routingConfigured: boolean;
  hooksConfigured: boolean;
  operationsConfigured: boolean;
  versionsReady: boolean;
  state?: AgentReadinessState;
}

export type AgentReadinessState =
  | 'missing_identity'
  | 'missing_behavior'
  | 'missing_model'
  | 'missing_channel_binding'
  | 'missing_memory_policy'
  | 'missing_safety_policy'
  | 'ready_to_publish';

export interface SkillsToolsResolverResponse {
  scope: { level: 'agency' | 'department' | 'workspace' | 'agent' | 'subagent'; id: string; name: string; path: string[] };
  sources: {
    profileDefaults: string[];
    agencyEnabled: string[];
    inherited: string[];
    localOverrides: string[];
  };
  skills: Array<{
    id: string;
    name: string;
    description: string;
    source: 'profile' | 'agency' | 'workspace' | 'global' | 'local';
    state: 'available' | 'selected' | 'required' | 'blocked' | 'disabled';
    blockedReason?: string;
  }>;
  tools: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    source: 'profile' | 'agency' | 'workspace' | 'global' | 'local';
    state: 'available' | 'selected' | 'required' | 'blocked' | 'disabled';
    blockedReason?: string;
  }>;
  effective: {
    skills: string[];
    tools: string[];
  };
}

export interface EditorSkillsToolsQueryDto {
  level: 'agency' | 'department' | 'workspace' | 'agent' | 'subagent';
  id: string;
}

export interface EditorSkillsToolsPatchDto {
  level: 'agency' | 'department' | 'workspace' | 'agent' | 'subagent';
  id: string;
  skills?: {
    select?: string[];
    deselect?: string[];
    require?: string[];
    disable?: string[];
  };
  tools?: {
    select?: string[];
    deselect?: string[];
    require?: string[];
    disable?: string[];
  };
}

export interface AgentReadinessResponseDto {
  agentId: string;
  state: AgentReadinessState;
  checks: Omit<AgentReadiness, 'state'>;
  missingFields: string[];
  score: number;
}

export interface GenerateCoreFilesResponseDto {
  agentId: string;
  generatedAt: string;
  files: Record<string, string>;
  diagnostics?: string[];
}

export interface AgentSpec {
  id: string;
  parentWorkspaceId?: string;
  parentAgentId?: string;
  profileId?: string;
  kind: AgentKind;
  identity?: AgentIdentity;
  behavior?: AgentBehavior;
  humanContext?: AgentHumanContext;
  skillsTools?: AgentSkillsTools;
  handoffs?: AgentHandoffs;
  routingChannels?: AgentRoutingChannels;
  hooks?: AgentHooks;
  operations?: AgentOperations;
  readiness?: AgentReadiness;
  // Derived/back-compat fields kept for current runtime readers.
  workspaceId?: string;
  name?: string;
  role?: string;
  description?: string;
  instructions?: string;
  model?: string;
  skillRefs?: string[];
  tags?: string[];
  visibility?: AgentVisibility;
  executionMode?: AgentExecutionMode;
  context?: string[];
  triggers?: AgentTrigger[];
  permissions?: AgentPermission;
  handoffRules?: AgentHandoffRule[];
  channelBindings?: AgentChannelBinding[];
  policyBindings?: AgentPolicyBinding[];
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
