# Phase 3 Visualization Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-grade visualization catalog for Administration and Studio with real backend contracts, scope-aware filtering, time windows, and operationally meaningful charts.

**Architecture:** Build a shared analytics foundation first (frontend chart system + backend metric contracts), then deliver P0 surfaces in Overview, Connections, Operations, and Editor, and finally enrich with P1 visualizations. Keep all charts fed by real APIs with standardized loading/error/empty/degraded states and strict scope/window behavior.

**Tech Stack:** React + TypeScript (apps/web), Express + TypeScript (apps/api), Zod schemas (packages/schemas), shared DTO/types (apps/web/src/lib/types.ts + packages/core-types), Jest + Supertest (apps/api/__tests__).

---

## Scope split recommendation
This spec spans multiple subsystems (frontend visualization system, backend analytics contracts, and cross-surface UX). Keep one master plan (this file), but execute with separate workers by domain to avoid conflicts:
- FE-Infra + FE-P0/P1 surfaces
- BE-Contracts + BE-Metrics
- QA/Integration validation

---

## File structure and responsibilities

### Frontend shared analytics infrastructure
- Modify: `apps/web/src/lib/api.ts`
  - Add analytics fetchers with `level`, `id`, `window`, `granularity`.
- Modify: `apps/web/src/lib/types.ts`
  - Add typed DTOs for metric series, gauges, distributions, and graph payloads.
- Create: `apps/web/src/features/analytics/components/ChartFrame.tsx`
  - Unified panel frame + states (`loading`, `empty`, `error`, `degraded`, `unsupported`).
- Create: `apps/web/src/features/analytics/components/TimeWindowSelector.tsx`
  - Reusable selector with window presets and granularity compatibility.
- Create: `apps/web/src/features/analytics/components/UnifiedTooltip.tsx`
  - Shared tooltip rendering.
- Create: `apps/web/src/features/analytics/components/UnifiedLegend.tsx`
  - Shared legend behavior and color-system compliance.
- Create: `apps/web/src/features/analytics/hooks/useAnalyticsWindow.ts`
  - URL/query synchronized window state.

### Backend analytics contracts and metrics
- Modify: `apps/api/src/modules/dashboard/dashboard.dto.ts`
  - Add shared metric DTOs and per-surface payload contracts.
- Modify: `apps/api/src/modules/dashboard/dashboard.controller.ts`
  - Add analytics endpoints with query validation (`level`, `id`, `window`, `granularity`).
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
  - Build metric projections for Overview/Connections/Operations/Editor.
- Create: `apps/api/src/modules/dashboard/metrics-window.ts`
  - Window + granularity normalization utilities.
- Create: `apps/api/src/modules/dashboard/metrics-aggregator.ts`
  - Canonical aggregation helpers for run/session/token/cost series.

### Surface-level visualizations
- Modify: `apps/web/src/features/admin/pages/AdministrationPage.tsx`
- Modify: `apps/web/src/features/studio/components/admin/OperationsSurface.tsx`
- Modify: `apps/web/src/features/studio/components/admin/RightInspectorPanel.tsx`
- Modify: `apps/web/src/features/studio/pages/WorkspaceStudioPage.tsx`
- Create: `apps/web/src/features/analytics/surfaces/OverviewAnalytics.tsx`
- Create: `apps/web/src/features/analytics/surfaces/ConnectionsAnalytics.tsx`
- Create: `apps/web/src/features/analytics/surfaces/OperationsAnalytics.tsx`
- Create: `apps/web/src/features/analytics/surfaces/EditorAnalytics.tsx`

### Tests
- Create/Modify: `apps/api/__tests__/dashboard-*.test.ts` (new metric endpoint contracts)
- Create: `apps/web/src/features/analytics/__tests__/` (component state behavior if test harness exists)
- Create: `apps/web/e2e/analytics-smoke.spec.ts` (if Playwright exists; else document manual smoke checklist)

---

## Task 1: Build analytics contract foundation (backend first)

**Files:**
- Create: `apps/api/src/modules/dashboard/metrics-window.ts`
- Create: `apps/api/src/modules/dashboard/metrics-aggregator.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.dto.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.controller.ts`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Test: `apps/api/__tests__/dashboard-metrics-contract.test.ts`

- [ ] **Step 1: Write failing API contract tests for metrics queries**
```ts
it('rejects invalid window/granularity combinations', async () => {
  const res = await request(app).get('/dashboard/metrics/overview?level=workspace&id=ws-1&window=90d&granularity=1m');
  expect(res.status).toBe(400);
});

it('returns scoped metrics for valid query', async () => {
  const res = await request(app).get('/dashboard/metrics/overview?level=workspace&id=ws-1&window=7d&granularity=1h');
  expect(res.status).toBe(200);
  expect(res.body.scope).toEqual({ level: 'workspace', id: 'ws-1' });
});
```

- [ ] **Step 2: Run tests to verify failure**
Run: `npm test -- apps/api/__tests__/dashboard-metrics-contract.test.ts`
Expected: FAIL for missing endpoints/contracts.

- [ ] **Step 3: Add DTOs and normalization helpers**
```ts
export type MetricsWindow = '1h' | '24h' | '7d' | '30d' | '90d';
export type MetricsGranularity = '1m' | '5m' | '15m' | '1h' | '1d';

export interface TimeSeriesPoint { ts: string; value: number; }
export interface MetricSeries { key: string; label: string; points: TimeSeriesPoint[]; }
```

- [ ] **Step 4: Implement controller routes + service projections**
```ts
router.get('/dashboard/metrics/overview', async (req, res) => {
  const query = parseMetricsQuery(req);
  res.json(await service.getOverviewMetrics(query));
});
```

- [ ] **Step 5: Run tests and ensure pass**
Run: `npm test -- apps/api/__tests__/dashboard-metrics-contract.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add apps/api/src/modules/dashboard apps/api/__tests__/dashboard-metrics-contract.test.ts
git commit -m "feat(metrics): add scoped windowed dashboard metric contracts"
```

---

## Task 2: Build frontend analytics infrastructure (shared chart system)

**Files:**
- Create: `apps/web/src/features/analytics/components/ChartFrame.tsx`
- Create: `apps/web/src/features/analytics/components/TimeWindowSelector.tsx`
- Create: `apps/web/src/features/analytics/components/UnifiedTooltip.tsx`
- Create: `apps/web/src/features/analytics/components/UnifiedLegend.tsx`
- Create: `apps/web/src/features/analytics/hooks/useAnalyticsWindow.ts`
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/lib/api.ts`
- Test: `apps/web/src/features/analytics/__tests__/ChartFrame.test.tsx`

- [ ] **Step 1: Write failing UI-state tests for chart wrapper**
```tsx
it('renders loading state', () => {
  render(<ChartFrame state="loading" title="Runs" />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to confirm failure**
Run: `npm test -- apps/web/src/features/analytics/__tests__/ChartFrame.test.tsx`
Expected: FAIL (component missing).

- [ ] **Step 3: Implement shared ChartFrame + window hook**
```tsx
export function ChartFrame({ title, state, children }: Props) {
  if (state === 'loading') return <Panel title={title}>Loading...</Panel>;
  if (state === 'error') return <Panel title={title}>Failed to load metrics</Panel>;
  return <Panel title={title}>{children}</Panel>;
}
```

- [ ] **Step 4: Add typed API clients for metrics endpoints**
```ts
export async function getOverviewMetrics(level: CanonicalNodeLevel, id: string, window: MetricsWindow, granularity: MetricsGranularity) {
  const q = new URLSearchParams({ level, id, window, granularity });
  return parseJson<OverviewMetricsDto>(await fetch(`${API_BASE}/dashboard/metrics/overview?${q}`));
}
```

- [ ] **Step 5: Re-run tests**
Run: `npm test -- apps/web/src/features/analytics/__tests__/ChartFrame.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/features/analytics apps/web/src/lib/api.ts apps/web/src/lib/types.ts
git commit -m "feat(analytics-ui): add shared chart frame and windowed metric clients"
```

---

## Task 3: Deliver Overview P0 visualizations

**Files:**
- Create: `apps/web/src/features/analytics/surfaces/OverviewAnalytics.tsx`
- Modify: `apps/web/src/features/admin/pages/AdministrationPage.tsx`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Test: `apps/api/__tests__/dashboard-overview-metrics.test.ts`

- [ ] **Step 1: Write failing backend test for Overview metric payload**
```ts
expect(res.body).toEqual(expect.objectContaining({
  kpiSparklines: expect.any(Array),
  runsErrorRate: expect.any(Object),
  latency: expect.objectContaining({ p50: expect.any(Array), p95: expect.any(Array) })
}));
```

- [ ] **Step 2: Implement service aggregation for Overview metrics**
```ts
return {
  kpiSparklines,
  runsErrorRate,
  tokenMix,
  sessionsOverTime,
  budgetUsage,
  modelMix,
  latency: { p50, p95 },
};
```

- [ ] **Step 3: Render Overview charts through ChartFrame**
```tsx
<ChartFrame title="Latency P50/P95" state={latencyState}>
  <LatencyLineChart p50={data.latency.p50} p95={data.latency.p95} />
</ChartFrame>
```

- [ ] **Step 4: Validate scope/window behavior**
Run: switch hierarchy level in UI + change window selector.
Expected: endpoint called with updated `level/id/window/granularity`.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/features/analytics/surfaces/OverviewAnalytics.tsx apps/web/src/features/admin/pages/AdministrationPage.tsx apps/api/src/modules/dashboard/dashboard.service.ts apps/api/__tests__/dashboard-overview-metrics.test.ts
git commit -m "feat(overview): ship P0 operational analytics charts"
```

---

## Task 4: Deliver Connections + Operations P0 visualizations

**Files:**
- Create: `apps/web/src/features/analytics/surfaces/ConnectionsAnalytics.tsx`
- Create: `apps/web/src/features/analytics/surfaces/OperationsAnalytics.tsx`
- Modify: `apps/web/src/features/studio/components/admin/OperationsSurface.tsx`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Test: `apps/api/__tests__/dashboard-connections-operations-metrics.test.ts`

- [ ] **Step 1: Write failing tests for Connections + Operations payload contracts**
```ts
expect(body.connections).toEqual(expect.objectContaining({
  dependencyGraph: expect.any(Object),
  sankey: expect.any(Object),
}));
expect(body.operations).toEqual(expect.objectContaining({
  runtimeStateMachine: expect.any(Object),
  costBudgetGauge: expect.any(Object),
}));
```

- [ ] **Step 2: Implement backend projection builders**
```ts
buildConnectionsMetrics(...) // meters, radial summaries, dependency graph, sankey
buildOperationsMetrics(...)  // state machine, timeline, governance, cost profile
```

- [ ] **Step 3: Render P0 Connections + Operations with unified states**
```tsx
<ChartFrame title="Dependency Graph" state={state}><DependencyGraph data={data.dependencyGraph} /></ChartFrame>
<ChartFrame title="Runtime State Machine" state={state}><RuntimeStateMachine data={data.runtimeStateMachine} /></ChartFrame>
```

- [ ] **Step 4: Verify unsupported/degraded behavior**
Run: simulate capability-disabled responses.
Expected: `ChartFrame` shows `unsupported`/`degraded` state, not crash/blank chart.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/features/analytics/surfaces/ConnectionsAnalytics.tsx apps/web/src/features/analytics/surfaces/OperationsAnalytics.tsx apps/web/src/features/studio/components/admin/OperationsSurface.tsx apps/api/src/modules/dashboard/dashboard.service.ts apps/api/__tests__/dashboard-connections-operations-metrics.test.ts
git commit -m "feat(connections-operations): deliver P0 flow and governance visualizations"
```

---

## Task 5: Deliver Editor P0 and P1 enrichment visualizations

**Files:**
- Create: `apps/web/src/features/analytics/surfaces/EditorAnalytics.tsx`
- Modify: `apps/web/src/features/studio/pages/WorkspaceStudioPage.tsx`
- Modify: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Test: `apps/api/__tests__/dashboard-editor-metrics.test.ts`

- [ ] **Step 1: Write failing tests for Editor metrics contract**
```ts
expect(res.body).toEqual(expect.objectContaining({
  readinessRadar: expect.any(Object),
  inheritanceMatrix: expect.any(Object),
  versionsTimeline: expect.any(Array),
}));
```

- [ ] **Step 2: Implement Editor metrics in service**
```ts
return { readinessRadar, sectionStepper, inheritanceMatrix, versionsTimeline };
```

- [ ] **Step 3: Integrate EditorAnalytics into Studio without breaking immersive layout**
```tsx
{activeTab === 'debug' && <EditorAnalytics scope={scope} window={window} granularity={granularity} />}
```

- [ ] **Step 4: Add P1 enrichment slices (sunburst, treemap, heatmaps, correlation)**
```ts
// Keep P1 optional surfaces behind data availability checks
if (data.sessionsHeatmap?.length) renderSessionsHeatmap();
```

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/features/analytics/surfaces/EditorAnalytics.tsx apps/web/src/features/studio/pages/WorkspaceStudioPage.tsx apps/api/src/modules/dashboard/dashboard.service.ts apps/api/__tests__/dashboard-editor-metrics.test.ts
git commit -m "feat(editor-analytics): add P0 structural visuals and P1 enrichments"
```

---

## Task 6: End-to-end validation, QA, and rollout checks

**Files:**
- Create: `docs/PHASE3_VALIDATION_CHECKLIST.md`
- Create/Modify: `apps/api/__tests__/dashboard-metrics-smoke.test.ts`
- Create: `apps/web/e2e/analytics-smoke.spec.ts` (if Playwright available)

- [ ] **Step 1: Add backend smoke tests for all metric endpoints**
```ts
const endpoints = ['/dashboard/metrics/overview', '/dashboard/metrics/connections', '/dashboard/metrics/operations', '/dashboard/metrics/editor'];
for (const ep of endpoints) {
  const res = await request(app).get(`${ep}?level=workspace&id=workspace-1&window=7d&granularity=1h`);
  expect(res.status).toBe(200);
}
```

- [ ] **Step 2: Add frontend smoke scenarios**
```ts
// Scope switch, window switch, and degraded-state rendering
await page.selectOption('[data-testid=scope-select]', 'agent:agent-1');
await page.click('[data-testid=window-7d]');
await expect(page.getByText('Latency P50/P95')).toBeVisible();
```

- [ ] **Step 3: Run full validation commands**
Run:
- `npm run build`
- `npm test`
- `npm test -- apps/api/__tests__/dashboard-metrics-smoke.test.ts`
- `npm run test:e2e` (if configured)
Expected: green build/test or explicit issue list.

- [ ] **Step 4: Publish validation checklist**
```md
- endpoint(s) built
- component(s) built
- states supported
- scope validation
- window validation
- pending risks
```

- [ ] **Step 5: Commit**
```bash
git add docs/PHASE3_VALIDATION_CHECKLIST.md apps/api/__tests__/dashboard-metrics-smoke.test.ts apps/web/e2e/analytics-smoke.spec.ts
git commit -m "test(phase3): add analytics smoke validation and rollout checklist"
```

---

## Non-failure rules (hard gates)
- No chart without real endpoint.
- No hardcoded production chart data.
- No chart without loading/empty/error/degraded/unsupported state.
- No chart that ignores `level/id` scope.
- No chart that ignores `window` when time-series data is expected.

---

## Acceptance criteria by slice
Each delivery slice must include:
- endpoint(s) implemented
- component(s) implemented
- supported states implemented
- visual evidence (screenshot/demo)
- scope validation evidence
- time-window validation evidence
- explicit pending risks

---

## Final expected result
- Administration Overview behaves as an operational console.
- Connections becomes flow/topology visual reading, not static text.
- Operations consolidates runtime governance + budgets/policies.
- Editor has structural visual depth (readiness, inheritance, versions).
- Visualization catalog is layered, contract-driven, and testable.

---

## Self-review
- Spec coverage: all phases A-F mapped to concrete tasks.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: shared DTOs/types aligned between API and web.

---

Plan complete and saved to `docs/PHASE3_EXECUTION_PLAN.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
