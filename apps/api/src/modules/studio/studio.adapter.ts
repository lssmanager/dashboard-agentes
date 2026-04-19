import type {
  CanonicalStudioState,
  ChannelBinding,
  ConnectionSpec,
  RuntimeCapabilityMatrix,
  SessionState,
  TopologyLinkState,
  TopologyRuntimeAction,
} from '../../../../../packages/core-types/src';

import type { LegacyStudioStateDto } from './dto/studio-state.dto';

const CORE_FILE_TARGETS = [
  'BOOTSTRAP',
  'IDENTITY',
  'TOOLS',
  'USER',
  'HEARTBEAT',
  'MEMORY',
  'SOUL',
  'AGENT_MD',
] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function buildConnections(
  agencyId: string,
  departmentId: string,
  workspaceId: string,
  legacy: LegacyStudioStateDto,
): ConnectionSpec[] {
  const timestamp = nowIso();
  const rootConnections: ConnectionSpec[] = [
    {
      id: `${agencyId}->${departmentId}`,
      agencyId,
      from: { level: 'agency', id: agencyId },
      to: { level: 'department', id: departmentId },
      state: 'connected',
      direction: 'bidirectional',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: `${departmentId}->${workspaceId}`,
      agencyId,
      from: { level: 'department', id: departmentId },
      to: { level: 'workspace', id: workspaceId },
      state: 'connected',
      direction: 'bidirectional',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const workspaceToAgents = legacy.agents
    .filter((agent) => agent.kind !== 'subagent')
    .map<ConnectionSpec>((agent) => ({
      id: `${workspaceId}->${agent.id}`,
      agencyId,
      from: { level: 'workspace', id: workspaceId },
      to: { level: 'agent', id: agent.id },
      state: agent.isEnabled === false ? 'paused' : 'connected',
      direction: 'bidirectional',
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

  const agentToSubagents = legacy.agents
    .filter((agent) => agent.kind === 'subagent' && agent.parentAgentId)
    .map<ConnectionSpec>((subagent) => ({
      id: `${subagent.parentAgentId}->${subagent.id}`,
      agencyId,
      from: { level: 'agent', id: subagent.parentAgentId as string },
      to: { level: 'subagent', id: subagent.id },
      state: subagent.isEnabled === false ? 'paused' : 'connected',
      direction: 'bidirectional',
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

  return [...rootConnections, ...workspaceToAgents, ...agentToSubagents];
}

export function adaptLegacyStudioStateToCanonical(
  legacy: LegacyStudioStateDto,
  options?: {
    capabilityMatrix?: RuntimeCapabilityMatrix;
  },
): CanonicalStudioState {
  const workspaceId = legacy.workspace?.id ?? 'workspace-default';
  const workspaceName = legacy.workspace?.name ?? 'Default Workspace';
  const generatedAt = legacy.generatedAt || nowIso();

  const agencyId = 'agency-default';
  const departmentId = legacy.workspace?.owner
    ? `department-${legacy.workspace.owner.toLowerCase().replace(/\s+/g, '-')}`
    : 'department-default';

  const workspace = legacy.workspace
    ? {
      ...legacy.workspace,
      departmentId,
    }
    : {
      id: workspaceId,
      slug: workspaceId,
      name: workspaceName,
      description: 'Generated from legacy workspace state',
      owner: 'OpenClaw Studio',
      defaultModel: undefined,
      agentIds: legacy.agents.map((agent) => agent.id),
      skillIds: legacy.skills.map((skill) => skill.id),
      flowIds: legacy.flows.map((flow) => flow.id),
      profileIds: legacy.profiles.map((profile) => profile.id),
      policyRefs: [],
      routingRules: [],
      routines: [],
      tags: ['compat-adapter'],
      createdAt: generatedAt,
      updatedAt: generatedAt,
      departmentId,
    };

  const agents = legacy.agents.filter((agent) => agent.kind !== 'subagent');
  const subagents = legacy.agents.filter((agent) => agent.kind === 'subagent');
  const capabilityMatrix: RuntimeCapabilityMatrix = options?.capabilityMatrix ?? {
    source: 'unknown',
    topology: {
      connect: false,
      disconnect: false,
      pause: false,
      reactivate: false,
      redirect: false,
      continue: false,
    },
    inspection: {
      sessions: true,
      channels: false,
      topology: false,
    },
  };

  const supportedActions = (Object.entries(capabilityMatrix.topology) as Array<[TopologyRuntimeAction, boolean]>)
    .filter(([, supported]) => supported)
    .map(([action]) => action);

  const sessionsPayload = Array.isArray(legacy.runtime.sessions.payload) ? legacy.runtime.sessions.payload : [];
  const sessions: SessionState[] = sessionsPayload.map((session, index) => {
    const value = session as Record<string, unknown>;
    return {
      ref: {
        id: typeof value.id === 'string' ? value.id : `session-${index}`,
        channel: typeof value.channel === 'string' ? value.channel : undefined,
        workspaceId: workspace.id,
        departmentId,
        agencyId,
      },
      status:
        value.status === 'active'
          ? 'active'
          : value.status === 'paused'
            ? 'paused'
            : value.status === 'closed'
              ? 'closed'
              : 'unknown',
      lastEventAt: typeof value.updatedAt === 'string' ? value.updatedAt : generatedAt,
      metadata: value,
    };
  });

  const channelBindings: ChannelBinding[] = legacy.agents.flatMap((agent) =>
    (agent.channelBindings ?? []).map((binding) => ({
      id: binding.id,
      channel: binding.channel,
      route: binding.route,
      enabled: binding.enabled,
      sourceLevel: agent.kind === 'subagent' ? 'subagent' : 'agent',
      sourceId: agent.id,
    })),
  );

  const connections = buildConnections(agencyId, departmentId, workspace.id, legacy);
  const links: TopologyLinkState[] = connections.map((connection) => ({
    linkId: connection.id,
    runtimeState: connection.state,
    runtimeSupported: supportedActions.length > 0,
    lastObservedAt: nowIso(),
  }));

  return {
    agency: {
      id: agencyId,
      name: 'OpenClaw Agency',
      description: 'Canonical agency generated from legacy Studio state',
      departmentIds: [departmentId],
      tags: ['compat-adapter'],
    },
    departments: [
      {
        id: departmentId,
        agencyId,
        name: legacy.workspace?.owner ?? 'Default Department',
        description: `Department containing workspace ${workspace.name}`,
        workspaceIds: [workspace.id],
        tags: ['compat-adapter'],
      },
    ],
    workspaces: [workspace],
    agents,
    subagents,
    catalog: {
      skills: legacy.skills,
      tools: [],
    },
    flows: legacy.flows,
    topology: {
      connections,
      links,
      failClosed: true,
      supportedActions,
    },
    runtimeControl: {
      capabilityMatrix,
      sessions,
      channelBindings,
    },
    coreFiles: {
      targets: [...CORE_FILE_TARGETS],
      supportedLifecycle: ['preview', 'diff', 'apply', 'rollback'],
    },
    runtime: legacy.runtime,
    compatibility: {
      strategy: 'compat_adapter',
      source: 'legacy_studio_state',
      adaptedAt: nowIso(),
    },
    generatedAt,
  };
}
