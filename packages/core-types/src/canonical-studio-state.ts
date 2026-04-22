import { AgentSpec } from './agent-spec';
import { FlowSpec } from './flow-spec';
import { SkillSpec } from './skill-spec';
import { ToolSpec } from './tool-spec';
import { WorkspaceSpec } from './workspace-spec';

export type CanonicalNodeLevel = 'agency' | 'department' | 'workspace' | 'agent' | 'subagent';

export type TopologyRuntimeAction =
  | 'connect'
  | 'disconnect'
  | 'pause'
  | 'reactivate'
  | 'redirect'
  | 'continue';

export type TopologyActionStatus = 'applied' | 'partial' | 'unsupported_by_runtime' | 'rejected';
export type SessionExecutionState = 'active' | 'idle' | 'paused' | 'closed' | 'unknown';

export type CoreFileTarget =
  | 'BOOTSTRAP'
  | 'IDENTITY'
  | 'TOOLS'
  | 'USER'
  | 'HEARTBEAT'
  | 'MEMORY'
  | 'SOUL'
  | 'AGENT_MD';

export interface AgencySpec {
  id: string;
  name: string;
  description?: string;
  departmentIds: string[];
  tags: string[];
}

export interface DepartmentSpec {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  workspaceIds: string[];
  tags: string[];
}

export interface CanonicalWorkspaceSpec extends WorkspaceSpec {
  departmentId: string;
}

export interface TopologyNodeRef {
  level: CanonicalNodeLevel;
  id: string;
}

export interface ConnectionSpec {
  id: string;
  agencyId: string;
  from: TopologyNodeRef;
  to: TopologyNodeRef;
  state: 'connected' | 'disconnected' | 'paused';
  direction: 'unidirectional' | 'bidirectional';
  createdAt: string;
  updatedAt: string;
}

export interface TopologyActionRequest {
  action: TopologyRuntimeAction;
  from: TopologyNodeRef;
  to?: TopologyNodeRef;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface TopologyActionResult {
  action: TopologyRuntimeAction;
  status: TopologyActionStatus;
  message: string;
  runtimeSupported: boolean;
  requestedAt: string;
  appliedAt?: string;
  errorCode?: string;
}

export interface ChannelBinding {
  id: string;
  channel: string;
  route: string;
  enabled: boolean;
  sourceLevel: CanonicalNodeLevel;
  sourceId: string;
}

export interface SessionRef {
  id: string;
  channel?: string;
  workspaceId?: string;
  departmentId?: string;
  agencyId?: string;
}

export interface SessionState {
  ref: SessionRef;
  status: SessionExecutionState;
  lastEventAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeCapabilityMatrix {
  source: 'gateway_capabilities' | 'status_inference' | 'unknown';
  topology: {
    connect: boolean;
    disconnect: boolean;
    pause: boolean;
    reactivate: boolean;
    redirect: boolean;
    continue: boolean;
  };
  inspection: {
    sessions: boolean;
    channels: boolean;
    topology: boolean;
  };
}

export interface TopologyLinkState {
  linkId: string;
  runtimeState: 'connected' | 'disconnected' | 'paused' | 'unknown';
  runtimeSupported: boolean;
  lastObservedAt: string;
}

export interface CoreFileDiff {
  path: string;
  status: 'added' | 'updated' | 'deleted' | 'unchanged';
  before?: string;
  after?: string;
}

export interface CoreFilesLifecycleState {
  targets: CoreFileTarget[];
  supportedLifecycle: Array<'preview' | 'diff' | 'apply' | 'rollback'>;
}

export interface BuilderAgentFunctionOutput {
  entityId: string;
  entityLevel: CanonicalNodeLevel;
  entityName: string;
  whatItDoes: string;
  inputs: string[];
  outputs: string[];
  skills: string[];
  tools: string[];
  collaborators: string[];
  proposedCoreFileDiffs: CoreFileDiff[];
}

export interface ReplayMetadata {
  topologyEvents: Array<Record<string, unknown>>;
  handoffs: Array<Record<string, unknown>>;
  redirects: Array<Record<string, unknown>>;
  stateTransitions: Array<Record<string, unknown>>;
  replay: {
    sourceRunId?: string;
    replayType?: string;
  };
}

export interface CanonicalStudioState {
  agency: AgencySpec;
  departments: DepartmentSpec[];
  workspaces: CanonicalWorkspaceSpec[];
  agents: AgentSpec[];
  subagents: AgentSpec[];
  catalog: {
    skills: SkillSpec[];
    tools: ToolSpec[];
  };
  flows: FlowSpec[];
  topology: {
    connections: ConnectionSpec[];
    links: TopologyLinkState[];
    failClosed: true;
    supportedActions: TopologyRuntimeAction[];
  };
  runtimeControl: {
    capabilityMatrix: RuntimeCapabilityMatrix;
    sessions: SessionState[];
    channelBindings: ChannelBinding[];
  };
  coreFiles: CoreFilesLifecycleState;
  runtime: {
    health: { ok: boolean; [key: string]: unknown };
    diagnostics: Record<string, unknown>;
    sessions: { ok: boolean; payload?: unknown[] };
  };
  compatibility: {
    strategy: 'compat_adapter';
    source: 'legacy_studio_state';
    adaptedAt: string;
  };
  generatedAt: string;
}
