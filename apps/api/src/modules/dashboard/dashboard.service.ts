import type { CanonicalStudioState, TopologyRuntimeAction } from '../../../../../packages/core-types/src';

import { HooksService } from '../hooks/hooks.service';
import { BudgetsService } from '../budgets/budgets.service';
import { PoliciesService } from '../policies/policies.service';
import { RoutingService } from '../routing/routing.service';
import { RunsService } from '../runs/runs.service';
import { StudioService } from '../studio/studio.service';
import { TopologyService } from '../topology/topology.service';
import { VersionsService } from '../versions/versions.service';
import type {
  DashboardConnectionsDto,
  DashboardInspectorDto,
  DashboardOperationsDto,
  DashboardOperationsPendingActionsDto,
  DashboardOperationsBudgetsDto,
  DashboardOperationsPoliciesDto,
  DashboardOperationsGovernanceStateDto,
  DashboardOperationsRecentRunsDto,
  DashboardOperationsRuntimeStateDto,
  DashboardOverviewDto,
  DashboardRunsDto,
  RuntimeCommandRequestDto,
  RuntimeCommandResultDto,
  MetricsKpisDto,
  MetricsRunsDto,
  MetricsTokensDto,
  MetricsSessionsDto,
  MetricsBudgetDto,
  MetricsModelMixDto,
  MetricsLatencyDto,
  ConnectionsMeteringDto,
  ConnectionsRadialDto,
  ConnectionsDependencyGraphDto,
  ConnectionsTopologyDto,
  ConnectionsFlowGraphDto,
  TimeSeriesPoint,
} from './dashboard.dto';
import { DashboardProfileService } from './profile-system.service';
import { DashboardScopeResolver } from './scope-resolver.service';

export class DashboardService {
  private readonly studioService = new StudioService();
  private readonly scopeResolver = new DashboardScopeResolver();
  private readonly runsService = new RunsService();
  private readonly hooksService = new HooksService();
  private readonly budgetsService = new BudgetsService();
  private readonly policiesService = new PoliciesService();
  private readonly routingService = new RoutingService();
  private readonly versionsService = new VersionsService();
  private readonly profileService = new DashboardProfileService();
  private readonly topologyService = new TopologyService();

  async getOverview(input: { level?: string; id?: string }): Promise<DashboardOverviewDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const hooks = this.hooksService.findAll();
    const runs = this.filterRunsByScope(canonical, resolved.workspaceIds, resolved.agentIds);
    const versions = this.versionsService.listSnapshots();

    const activeSessions = resolved.sessions.filter((item) => item.status === 'active').length;
    const pausedSessions = resolved.sessions.filter((item) => item.status === 'paused').length;

    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      kpis: {
        departments: this.countDepartments(canonical, resolved.workspaceIds),
        workspaces: resolved.workspaceIds.length,
        agents: this.countAgents(canonical, resolved.workspaceIds),
        subagents: this.countSubagents(canonical, resolved.workspaceIds),
        profiles: (await this.profileService.getCatalog()).length,
        skills: canonical.catalog.skills.length,
        tools: canonical.catalog.tools.length,
      },
      runtimeHealth: {
        ok: Boolean(canonical.runtime.health.ok),
        source: canonical.runtimeControl.capabilityMatrix.source,
        supportedTopologyActions: canonical.topology.supportedActions.length,
      },
      sessionsSummary: {
        mode: resolved.capabilities.sessionsMode,
        total: resolved.sessions.length,
        active: activeSessions,
        paused: pausedSessions,
      },
      runsSummary: {
        mode: resolved.capabilities.runsMode,
        total: runs.length,
        running: runs.filter((item) => item.status === 'running').length,
        waitingApproval: runs.filter((item) => item.status === 'waiting_approval').length,
        failed: runs.filter((item) => item.status === 'failed').length,
      },
      channelsSummary: {
        totalBindings: this.filterChannelBindings(canonical, resolved.workspaceIds, resolved.agentIds).length,
        enabledBindings: this.filterChannelBindings(canonical, resolved.workspaceIds, resolved.agentIds).filter((item) => item.enabled).length,
        uniqueChannels: [
          ...new Set(this.filterChannelBindings(canonical, resolved.workspaceIds, resolved.agentIds).map((item) => item.channel)),
        ],
      },
      hooksCoverage: {
        totalHooks: hooks.length,
        enabledHooks: hooks.filter((item) => item.enabled).length,
        eventsCovered: [...new Set(hooks.filter((item) => item.enabled).map((item) => item.event))],
      },
      versionSummary: {
        totalSnapshots: versions.length,
        latestSnapshotId: versions[0]?.id ?? null,
        latestSnapshotAt: versions[0]?.createdAt ?? null,
        latestLabel: versions[0]?.label ?? null,
      },
      capabilities: resolved.capabilities,
    };
  }

  async getConnections(input: { level?: string; id?: string }): Promise<DashboardConnectionsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);

    const edges = this.filterConnections(canonical, resolved.workspaceIds, resolved.agentIds, resolved.scope);
    const routing = this.routingService.getCompiledRouting();
    const hooks = this.hooksService.findAll();

    const nodeMap = new Map<string, { id: string; level: any; label: string }>();
    for (const edge of edges) {
      nodeMap.set(`${edge.from.level}:${edge.from.id}`, {
        id: edge.from.id,
        level: edge.from.level,
        label: this.resolveNodeLabel(canonical, edge.from.level, edge.from.id),
      });
      nodeMap.set(`${edge.to.level}:${edge.to.id}`, {
        id: edge.to.id,
        level: edge.to.level,
        label: this.resolveNodeLabel(canonical, edge.to.level, edge.to.id),
      });
    }

    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      nodes: Array.from(nodeMap.values()),
      edges,
      routingRules: routing.rules.map((r: any) => ({
        id: r.id,
        from: r.from,
        to: r.to,
        when: r.when,
        priority: typeof r.priority === 'number' ? r.priority : 0,
      })),
      channelBindings: this.filterChannelBindings(canonical, resolved.workspaceIds, resolved.agentIds),
      hookBindings: hooks.map((item) => ({
        id: item.id,
        event: item.event,
        action: item.action,
        enabled: item.enabled,
        priority: item.priority,
      })),
      dependencySummary: {
        totalEdges: edges.length,
        connectedEdges: edges.filter((item) => item.state === 'connected').length,
        pausedEdges: edges.filter((item) => item.state === 'paused').length,
        disconnectedEdges: edges.filter((item) => item.state === 'disconnected').length,
      },
    };
  }

  async getInspector(input: { level?: string; id?: string }): Promise<DashboardInspectorDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const effectiveProfile = await this.profileService.getEffectiveProfile(resolved.scope, resolved.lineage);

    const entityLabel = this.resolveNodeLabel(canonical, resolved.scope.level, resolved.scope.id);
    const workspace = this.resolveWorkspace(canonical, resolved.scope, resolved.workspaceIds);
    const agent = canonical.agents.find((item) => item.id === resolved.scope.id) ?? canonical.subagents.find((item) => item.id === resolved.scope.id) ?? null;

    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      entityMeta: {
        name: entityLabel,
        level: resolved.scope.level,
        description: workspace?.description ?? agent?.description,
        owner: workspace?.owner,
        tags: workspace?.tags ?? agent?.tags ?? [],
      },
      effectiveConfigSummary: {
        model: effectiveProfile.effectiveModel ?? workspace?.defaultModel ?? agent?.model ?? null,
        skills: effectiveProfile.effectiveSkills.length > 0 ? effectiveProfile.effectiveSkills : agent?.skillRefs ?? [],
        policies: [],
        routingRules: workspace?.routingRules?.length ?? 0,
      },
      assignedProfiles: effectiveProfile.catalogProfile
        ? [
            {
              id: effectiveProfile.catalogProfile.id,
              name: effectiveProfile.catalogProfile.name,
              source: 'binding',
            },
          ]
        : (workspace?.profileIds ?? []).map((id) => ({ id, name: id, source: 'workspace' as const })),
      toolBindings: canonical.catalog.tools.map((item) => ({
        id: item.id,
        name: item.name,
        source: 'catalog' as const,
        enabled: true,
      })),
      skillBindings: canonical.catalog.skills.map((item) => ({
        id: item.id,
        name: item.name,
        source: agent?.skillRefs?.includes(item.id) ? ('agent' as const) : ('catalog' as const),
        enabled: true,
      })),
      recentChanges: [
        {
          at: canonical.generatedAt,
          type: 'scope-refresh',
          message: `Inspector refreshed for ${resolved.scope.level}:${resolved.scope.id}`,
        },
      ],
    };
  }

  async getOperations(input: { level?: string; id?: string }): Promise<DashboardOperationsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const runs = this.filterRunsByScope(canonical, resolved.workspaceIds, resolved.agentIds);

    const recentRuns = runs
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 12)
      .map((run) => ({
        id: run.id,
        flowId: run.flowId,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        costUsd: run.steps.reduce((sum, step) => sum + (step.costUsd ?? 0), 0),
      }));

    const approvalQueue = runs.flatMap((run) =>
      run.steps
        .filter((step) => step.status === 'waiting_approval')
        .map((step) => ({
          runId: run.id,
          stepId: step.id,
          nodeId: step.nodeId,
          requestedAt: step.startedAt ?? run.startedAt,
        })),
    );

    const versions = this.versionsService.listSnapshots();

    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      recentRuns,
      recentSessions: resolved.sessions
        .slice(0, 12)
        .map((session) => ({
          id: session.ref.id,
          status: session.status,
          channel: session.ref.channel,
          lastEventAt: session.lastEventAt,
        })),
      pendingActions: this.buildPendingActions(canonical, approvalQueue.length),
      approvalQueue,
      deploymentState: {
        latestSnapshots: versions.slice(0, 5).map((item) => ({
          id: item.id,
          label: item.label,
          createdAt: item.createdAt,
        })),
        timeline: versions.slice(0, 8).map((item, index) => ({
          at: item.createdAt,
          type: index === 0 ? 'publish' : 'diff',
          detail: item.label ? `Snapshot ${item.label}` : `Snapshot ${item.id}`,
        })),
      },
    };
  }

  async getOperationsRuntimeState(input: { level?: string; id?: string }): Promise<DashboardOperationsRuntimeStateDto> {
    const operations = await this.getOperations(input);
    return {
      scope: operations.scope,
      lineage: operations.lineage,
      recentSessions: operations.recentSessions,
    };
  }

  async getOperationsRecentRuns(input: { level?: string; id?: string }): Promise<DashboardOperationsRecentRunsDto> {
    const operations = await this.getOperations(input);
    return {
      scope: operations.scope,
      lineage: operations.lineage,
      recentRuns: operations.recentRuns,
    };
  }

  async getOperationsPendingActions(input: { level?: string; id?: string }): Promise<DashboardOperationsPendingActionsDto> {
    const operations = await this.getOperations(input);
    return {
      scope: operations.scope,
      lineage: operations.lineage,
      pendingActions: operations.pendingActions,
      approvalQueue: operations.approvalQueue,
    };
  }

  async getOperationsBudgets(input: { level?: string; id?: string }): Promise<DashboardOperationsBudgetsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      mode: 'governance_v1_legacy_store',
      scopeFilterApplied: false,
      budgets: this.budgetsService.findAll(),
    };
  }

  async getOperationsPolicies(input: { level?: string; id?: string }): Promise<DashboardOperationsPoliciesDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      mode: 'governance_v1_legacy_store',
      scopeFilterApplied: false,
      policies: this.policiesService.findAll(),
    };
  }

  async getOperationsGovernanceState(input: { level?: string; id?: string }): Promise<DashboardOperationsGovernanceStateDto> {
    const budgetsProjection = await this.getOperationsBudgets(input);
    const policiesProjection = await this.getOperationsPolicies(input);
    return {
      scope: budgetsProjection.scope,
      lineage: budgetsProjection.lineage,
      mode: 'governance_v1_legacy_store',
      scopeFilterApplied: false,
      budgetsCount: budgetsProjection.budgets.length,
      policiesCount: policiesProjection.policies.length,
      message:
        'Governance store is active in V1 legacy mode: data is available for Operations surfaces while scope-filtered inheritance is pending.',
    };
  }

  async getRuns(input: { level?: string; id?: string }, options?: { limit?: number }): Promise<DashboardRunsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const safeLimit =
      typeof options?.limit === 'number' && Number.isFinite(options.limit)
        ? Math.max(1, Math.min(Math.floor(options.limit), 200))
        : undefined;

    const scopedRuns = this.filterRunsByScope(canonical, resolved.workspaceIds, resolved.agentIds)
      .slice()
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return {
      scope: resolved.scope,
      lineage: resolved.lineage,
      mode: resolved.capabilities.runsMode,
      projection: 'dashboard_scoped_v1',
      total: scopedRuns.length,
      runs: safeLimit ? scopedRuns.slice(0, safeLimit) : scopedRuns,
    };
  }

  async getEffectiveProfile(input: { level?: string; id?: string }) {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    return this.profileService.getEffectiveProfile(resolved.scope, resolved.lineage);
  }

  bindProfile(input: { level: any; id: string; profileId: string }) {
    return this.profileService.bindProfile(input);
  }

  unbindProfile(input: { level: any; id: string }) {
    return this.profileService.unbindProfile(input);
  }

  setProfileOverride(input: { level: any; id: string; overrides: { model?: string; skills?: string[]; routines?: string[]; tags?: string[] } }) {
    return this.profileService.setOverride(input);
  }

  async executeRuntimeCommand(input: RuntimeCommandRequestDto): Promise<RuntimeCommandResultDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);

    const from = { level: resolved.scope.level, id: resolved.scope.id };
    const target = input.target;
    const action = input.action as TopologyRuntimeAction;

    const result = await this.topologyService.executeAction(action, {
      from,
      to: target,
      metadata: {
        source: 'dashboard.operations',
      },
    });

    return {
      command: action,
      scope: resolved.scope,
      result,
    };
  }

  private resolveNodeLabel(canonical: CanonicalStudioState, level: string, id: string): string {
    if (level === 'agency') return canonical.agency.name;
    if (level === 'department') return canonical.departments.find((item) => item.id === id)?.name ?? id;
    if (level === 'workspace') return canonical.workspaces.find((item) => item.id === id)?.name ?? id;
    if (level === 'agent') return canonical.agents.find((item) => item.id === id)?.name ?? id;
    return canonical.subagents.find((item) => item.id === id)?.name ?? id;
  }

  private resolveWorkspace(canonical: CanonicalStudioState, scope: { level: string; id: string }, workspaceIds: string[]) {
    if (scope.level === 'workspace') {
      return canonical.workspaces.find((item) => item.id === scope.id) ?? null;
    }
    return canonical.workspaces.find((item) => workspaceIds.includes(item.id)) ?? null;
  }

  private filterConnections(canonical: CanonicalStudioState, workspaceIds: string[], agentIds: string[], scope: { level: string; id: string }) {
    const workspaceSet = new Set(workspaceIds);
    const agentSet = new Set(agentIds);

    if (scope.level === 'agency') {
      return canonical.topology.connections;
    }

    if (scope.level === 'department') {
      return canonical.topology.connections.filter(
        (item) =>
          item.from.id === scope.id ||
          item.to.id === scope.id ||
          workspaceSet.has(item.from.id) ||
          workspaceSet.has(item.to.id),
      );
    }

    if (scope.level === 'workspace') {
      return canonical.topology.connections.filter(
        (item) => item.from.id === scope.id || item.to.id === scope.id || workspaceSet.has(item.from.id) || workspaceSet.has(item.to.id),
      );
    }

    return canonical.topology.connections.filter(
      (item) => agentSet.has(item.from.id) || agentSet.has(item.to.id),
    );
  }

  private filterChannelBindings(canonical: CanonicalStudioState, workspaceIds: string[], agentIds: string[]) {
    const workspaceSet = new Set(workspaceIds);
    const agentSet = new Set(agentIds);

    return canonical.runtimeControl.channelBindings.filter((binding) => {
      if (binding.sourceLevel === 'workspace') {
        return workspaceSet.has(binding.sourceId);
      }
      if (binding.sourceLevel === 'agent' || binding.sourceLevel === 'subagent') {
        return agentSet.has(binding.sourceId);
      }
      return true;
    });
  }

  private filterRunsByScope(canonical: CanonicalStudioState, workspaceIds: string[], agentIds: string[]) {
    const workspaceSet = new Set(workspaceIds);
    const agentSet = new Set(agentIds);
    return this.runsService.findAll().filter((run) =>
      workspaceSet.has(run.workspaceId) || run.steps.some((step) => step.agentId && agentSet.has(step.agentId)),
    );
  }

  private countDepartments(canonical: CanonicalStudioState, workspaceIds: string[]) {
    const workspaceSet = new Set(workspaceIds);
    return canonical.departments.filter((item) => item.workspaceIds.some((id) => workspaceSet.has(id))).length;
  }

  private countAgents(canonical: CanonicalStudioState, workspaceIds: string[]) {
    const workspaceSet = new Set(workspaceIds);
    return canonical.agents.filter((item) => workspaceSet.has(item.workspaceId)).length;
  }

  private countSubagents(canonical: CanonicalStudioState, workspaceIds: string[]) {
    const workspaceSet = new Set(workspaceIds);
    return canonical.subagents.filter((item) => workspaceSet.has(item.workspaceId)).length;
  }

  private buildPendingActions(canonical: CanonicalStudioState, pendingApprovals: number) {
    const pending: DashboardOperationsDto['pendingActions'] = [];

    if (!canonical.runtime.health.ok) {
      pending.push({
        id: 'runtime-health',
        type: 'runtime',
        severity: 'critical',
        message: 'Runtime health is degraded. Verify gateway and active adapters.',
      });
    }

    if (pendingApprovals > 0) {
      pending.push({
        id: 'approval-queue',
        type: 'approval',
        severity: 'warning',
        message: `${pendingApprovals} step(s) waiting for approval.`,
      });
    }

    if (canonical.topology.supportedActions.length === 0) {
      pending.push({
        id: 'runtime-capability',
        type: 'capability',
        severity: 'info',
        message: 'Runtime topology actions are unavailable for current adapter.',
      });
    }

    return pending;
  }

  // ── Analytics Metrics ─────────────────────────────────────────────────────

  private windowPoints(window: string): number {
    const map: Record<string, number> = { '1H': 12, '4H': 16, '6H': 12, '8H': 16, '12H': 12, '24H': 24, '3D': 18, '7D': 28, '15D': 30, '1M': 30, '2M': 24, '3M': 36, '1Y': 52 };
    return map[window] ?? 24;
  }

  private syntheticTs(points: number, window: string): string[] {
    const now = Date.now();
    const windowMs: Record<string, number> = { '1H': 3600e3, '4H': 4*3600e3, '6H': 6*3600e3, '8H': 8*3600e3, '12H': 12*3600e3, '24H': 24*3600e3, '3D': 3*86400e3, '7D': 7*86400e3, '15D': 15*86400e3, '1M': 30*86400e3, '2M': 60*86400e3, '3M': 90*86400e3, '1Y': 365*86400e3 };
    const ms = windowMs[window] ?? 24*3600e3;
    const step = ms / (points - 1);
    return Array.from({ length: points }, (_, i) => new Date(now - ms + i * step).toISOString());
  }

  private smoothRandom(base: number, variance: number, points: number): number[] {
    const result: number[] = [];
    let v = base;
    for (let i = 0; i < points; i++) {
      v = Math.max(0, v + (Math.random() - 0.5) * variance);
      result.push(Math.round(v));
    }
    return result;
  }

  async getMetricsKpis(input: { level?: string; id?: string; window?: string }): Promise<MetricsKpisDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const win = input.window ?? '24H';
    const pts = Math.min(8, this.windowPoints(win));
    const ts = this.syntheticTs(pts, win);
    const agents = this.countAgents(canonical, resolved.workspaceIds);
    const channels = resolved.sessions.length > 0 ? resolved.sessions.filter(s => (s as any).channel).length : 0;
    const runs = this.filterRunsByScope(canonical, resolved.workspaceIds, resolved.agentIds);
    const snapshots = this.versionsService.listSnapshots().length;

    const mkTrend = (base: number): TimeSeriesPoint[] => this.smoothRandom(Math.max(base, 1), base * 0.3, pts).map((v, i) => ({ ts: ts[i], value: v }));

    return {
      scope: resolved.scope,
      window: win,
      agents:   { current: agents, delta: Math.round((Math.random() - 0.4) * 2), trend: mkTrend(agents) },
      sessions: { current: resolved.sessions.length, delta: Math.round((Math.random() - 0.4) * 3), trend: mkTrend(Math.max(resolved.sessions.length, 1)) },
      runs:     { current: runs.length, delta: Math.round((Math.random() - 0.4) * 5), trend: mkTrend(Math.max(runs.length, 1)) },
      channels: { current: channels, delta: 0, trend: mkTrend(Math.max(channels, 1)) },
      running:          runs.filter(r => r.status === 'running').length,
      awaitingApproval: runs.filter(r => r.status === 'waiting_approval').length,
      paused:           resolved.sessions.filter(s => s.status === 'paused').length,
      snapshots,
    };
  }

  async getMetricsRuns(input: { level?: string; id?: string; window?: string; granularity?: string }): Promise<MetricsRunsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const win = input.window ?? '24H';
    const pts = this.windowPoints(win);
    const ts = this.syntheticTs(pts, win);
    const runs = this.filterRunsByScope(canonical, resolved.workspaceIds, resolved.agentIds);
    const base = Math.max(runs.length, 2);
    const totals = this.smoothRandom(base, base * 0.4, pts);
    const series = totals.map((total, i) => {
      const failed = Math.round(total * (Math.random() * 0.15));
      return { ts: ts[i], total, failed, errorRate: total > 0 ? Math.round((failed / total) * 100) : 0 };
    });
    const totalSum = series.reduce((a, r) => a + r.total, 0);
    const failedSum = series.reduce((a, r) => a + r.failed, 0);
    return { scope: resolved.scope, window: win, granularity: input.granularity ?? 'auto', series, totals: { total: totalSum, failed: failedSum, errorRate: totalSum > 0 ? Math.round((failedSum / totalSum) * 100) : 0 } };
  }

  async getMetricsTokens(input: { level?: string; id?: string; window?: string; granularity?: string }): Promise<MetricsTokensDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const win = input.window ?? '24H';
    const pts = this.windowPoints(win);
    const ts = this.syntheticTs(pts, win);
    const agentCount = Math.max(this.countAgents(canonical, resolved.workspaceIds), 1);
    const promptBase = agentCount * 4800;
    const completionBase = agentCount * 1200;
    const prompts = this.smoothRandom(promptBase, promptBase * 0.3, pts);
    const completions = this.smoothRandom(completionBase, completionBase * 0.25, pts);
    const series = prompts.map((prompt, i) => ({ ts: ts[i], prompt, completion: completions[i] }));
    return { scope: resolved.scope, window: win, granularity: input.granularity ?? 'auto', series, totals: { prompt: series.reduce((a, r) => a + r.prompt, 0), completion: series.reduce((a, r) => a + r.completion, 0) } };
  }

  async getMetricsSessions(input: { level?: string; id?: string; window?: string; granularity?: string }): Promise<MetricsSessionsDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const win = input.window ?? '7D';
    const pts = this.windowPoints(win);
    const ts = this.syntheticTs(pts, win);
    const base = Math.max(resolved.sessions.length, 2);
    const actives = this.smoothRandom(base, base * 0.35, pts);
    const completed = this.smoothRandom(Math.round(base * 1.5), base * 0.4, pts);
    const series = actives.map((active, i) => ({ ts: ts[i], active, completed: completed[i] }));
    return { scope: resolved.scope, window: win, granularity: input.granularity ?? 'auto', series, totals: { active: series.reduce((a, r) => a + r.active, 0), completed: series.reduce((a, r) => a + r.completed, 0) } };
  }

  async getMetricsBudget(input: { level?: string; id?: string; window?: string }): Promise<MetricsBudgetDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const rawBudgets = this.budgetsService.findAll();
    const budgets = rawBudgets.map((b: any) => {
      const limitUsd = b.limitUsd ?? 100;
      const usedUsd = b.currentUsageUsd ?? Math.round(limitUsd * Math.random() * 0.8);
      const pctUsed = Math.round((usedUsd / limitUsd) * 100);
      return {
        id: b.id,
        name: b.name ?? b.id,
        limitUsd,
        usedUsd,
        softCapUsd: Math.round(limitUsd * 0.75),
        hardCapUsd: limitUsd,
        pctUsed,
        status: (pctUsed >= 90 ? 'critical' : pctUsed >= 70 ? 'warning' : 'ok') as 'ok' | 'warning' | 'critical',
        periodDays: b.periodDays ?? 30,
      };
    });
    return { scope: resolved.scope, window: input.window ?? '30D', budgets, totalLimitUsd: budgets.reduce((a, b) => a + b.limitUsd, 0), totalUsedUsd: budgets.reduce((a, b) => a + b.usedUsd, 0) };
  }

  async getMetricsModelMix(input: { level?: string; id?: string; window?: string }): Promise<MetricsModelMixDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const agents = canonical.agents.filter(a => resolved.workspaceIds.includes(a.workspaceId));
    const modelMap = new Map<string, number>();
    for (const agent of agents) {
      const m = agent.model ?? 'unknown';
      modelMap.set(m, (modelMap.get(m) ?? 0) + 1);
    }
    if (modelMap.size === 0) modelMap.set('gpt-4o', 1);
    const total = [...modelMap.values()].reduce((a, v) => a + v, 0);
    const models = [...modelMap.entries()].map(([model, count]) => ({
      model, count, pct: Math.round((count / total) * 100),
      costUsd: Math.round(count * (Math.random() * 12 + 2) * 100) / 100,
    }));
    return { scope: resolved.scope, window: input.window ?? '24H', models };
  }

  async getMetricsLatency(input: { level?: string; id?: string; window?: string }): Promise<MetricsLatencyDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const agents = canonical.agents.filter(a => resolved.workspaceIds.includes(a.workspaceId));
    const modelSet = new Set(agents.map(a => a.model ?? 'unknown'));
    if (modelSet.size === 0) modelSet.add('gpt-4o');
    const models = [...modelSet].map(model => ({
      model,
      p50ms: Math.round(200 + Math.random() * 600),
      p95ms: Math.round(800 + Math.random() * 2400),
    }));
    return { scope: resolved.scope, window: input.window ?? '24H', models };
  }

  async getConnectionsMetering(input: { level?: string; id?: string; window?: string }): Promise<ConnectionsMeteringDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const edges = canonical.topology.connections.length;
    const connected = canonical.topology.links.filter(l => l.runtimeState === 'connected').length;
    const hooks = this.hooksService.findAll();
    const enabledHooks = hooks.filter((h: any) => h.enabled !== false).length;
    const routing = this.routingService.findAll();
    return {
      scope: resolved.scope,
      window: input.window ?? '24H',
      meters: {
        supportedEdges:   { value: connected, max: Math.max(edges, 1), pct: edges > 0 ? Math.round((connected / edges) * 100) : 0 },
        hookCoverage:     { value: enabledHooks, max: Math.max(hooks.length, 1), pct: hooks.length > 0 ? Math.round((enabledHooks / hooks.length) * 100) : 0 },
        routingStability: { value: routing.length, max: Math.max(routing.length, 1), pct: 100 },
        handoffPressure:  { value: resolved.sessions.length, max: Math.max(resolved.sessions.length + 3, 5), pct: Math.min(100, Math.round((resolved.sessions.length / 5) * 100)) },
      },
    };
  }

  async getConnectionsRadial(input: { level?: string; id?: string; window?: string }): Promise<ConnectionsRadialDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const hooks = this.hooksService.findAll();
    const enabledHooks = hooks.filter((h: any) => h.enabled !== false).length;
    const allBindings = canonical.runtimeControl.channelBindings;
    const enabled = allBindings.filter(b => b.enabled).length;
    return {
      scope: resolved.scope, window: input.window ?? '24H',
      edges:    { total: canonical.topology.connections.length, connected: canonical.topology.links.filter(l => l.runtimeState === 'connected').length, paused: canonical.topology.links.filter(l => l.runtimeState === 'paused').length, disconnected: canonical.topology.links.filter(l => l.runtimeState === 'disconnected').length },
      hooks:    { total: hooks.length, enabled: enabledHooks },
      channels: { total: allBindings.length, enabled },
    };
  }

  async getConnectionsDependencyGraph(input: { level?: string; id?: string; window?: string }): Promise<ConnectionsDependencyGraphDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const agentSet = new Set(resolved.agentIds);
    const agents = canonical.agents.filter(a => agentSet.has(a.id));
    const skills = canonical.catalog.skills;
    const nodes: ConnectionsDependencyGraphDto['nodes'] = [];
    const edges: ConnectionsDependencyGraphDto['edges'] = [];
    for (const agent of agents.slice(0, 12)) {
      nodes.push({ id: `agent:${agent.id}`, label: agent.name, type: 'agent' });
      for (const skillRef of (agent.skillRefs ?? []).slice(0, 4)) {
        const skill = skills.find(s => s.id === skillRef);
        const skillNodeId = `skill:${skillRef}`;
        if (!nodes.find(n => n.id === skillNodeId)) nodes.push({ id: skillNodeId, label: skill?.name ?? skillRef, type: 'skill' });
        edges.push({ from: `agent:${agent.id}`, to: skillNodeId, label: 'uses' });
      }
    }
    if (nodes.length === 0) nodes.push({ id: 'no-data', label: 'No entities in scope', type: 'empty' });
    return { scope: resolved.scope, nodes, edges };
  }

  async getConnectionsTopology(input: { level?: string; id?: string; window?: string }): Promise<ConnectionsTopologyDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const agentSet = new Set(resolved.agentIds);
    const agents = canonical.agents.filter(a => agentSet.has(a.id));
    const nodes: ConnectionsTopologyDto['nodes'] = [];
    const edges: ConnectionsTopologyDto['edges'] = [];
    const cols = Math.ceil(Math.sqrt(agents.length + 1));
    nodes.push({ id: 'workspace', label: canonical.workspace?.name ?? 'Workspace', type: 'workspace', x: 400, y: 280 });
    agents.slice(0, 16).forEach((agent, i) => {
      const angle = (2 * Math.PI * i) / Math.max(agents.length, 1);
      const r = Math.min(200, 80 + agents.length * 12);
      nodes.push({ id: agent.id, label: agent.name, type: agent.kind ?? 'agent', x: Math.round(400 + r * Math.cos(angle)), y: Math.round(280 + r * Math.sin(angle)), meta: agent.model });
      edges.push({ from: 'workspace', to: agent.id });
    });
    const links = canonical.topology.links.slice(0, 20);
    for (const link of links) {
      const conn = canonical.topology.connections.find(c => c.id === link.linkId);
      if (conn && nodes.find(n => n.id === conn.sourceId) && nodes.find(n => n.id === conn.targetId)) {
        edges.push({ from: conn.sourceId, to: conn.targetId, label: link.runtimeState });
      }
    }
    return { scope: resolved.scope, nodes, edges };
  }

  async getConnectionsFlowGraph(input: { level?: string; id?: string; window?: string }): Promise<ConnectionsFlowGraphDto> {
    const canonical = await this.studioService.getCanonicalState();
    const resolved = this.scopeResolver.resolve(canonical, input);
    const agentSet = new Set(resolved.agentIds);
    const agents = canonical.agents.filter(a => agentSet.has(a.id));
    const nodes = [
      { id: 'input', label: 'Input', value: 100 },
      ...agents.slice(0, 6).map(a => ({ id: a.id, label: a.name, value: Math.round(80 + Math.random() * 40) })),
      { id: 'output', label: 'Output', value: 95 },
    ];
    const links: ConnectionsFlowGraphDto['links'] = [];
    if (nodes.length > 1) {
      links.push({ source: 'input', target: nodes[1].id, value: 80 });
      for (let i = 1; i < nodes.length - 1; i++) {
        links.push({ source: nodes[i].id, target: nodes[Math.min(i + 1, nodes.length - 1)].id, value: Math.round(60 + Math.random() * 30) });
      }
    }
    return { scope: resolved.scope, nodes, links };
  }
}

