# Phase 3 Validation Checklist

Use this checklist to confirm the frontend surfaces stay coherent after scope or routing changes.

Execution note:
- Last QA pass in this branch: 2026-04-22.
- Environment limitation: `npm`/`node` were not available in PATH, so automated build/test commands could not be executed from this session.

## Smoke Scope

- [ ] Switch scope between agency, department, workspace, agent, and subagent.
- [ ] Confirm the visible context label updates with the selected lineage.
- [ ] Confirm the Administration and Runs pages both reflect the same selected scope.

## Admin and Studio Continuity

- [ ] Open Administration from a scoped node and verify the current context is preserved.
- [ ] Open Studio from Administration and confirm the same node remains selected.
- [ ] Return from Studio to Administration and confirm the active scope has not drifted.

## Studio Inspector Flow

- [ ] Select a node in Studio.
- [ ] Verify the right inspector updates for the selected node.
- [ ] Confirm the inspector state matches the selection state after changing nodes.

## Runs and Sessions Surfaces

- [ ] Open Runs from the current scope and confirm the surface reads as an Administration surface.
- [ ] Verify run summary cards render for total, running, awaiting approval, and failed states.
- [ ] Open a run and confirm the timeline, approval panel, and step details are visible when present.
- [ ] Confirm Sessions remains visible within Administration when the current scope exposes it.

## Labels and Routes

- [ ] Verify visible labels use canonical names: Administration, Studio, Profiles Hub, Profile, Settings.
- [ ] Confirm the scope/context labels match across Administration and Runs.
- [ ] Confirm route-driven tabs and surface labels stay aligned after refresh.

## Build Check

- [ ] Run `npm run build:web` and confirm the build completes without errors.

## Contract Coverage (P2)

- [x] Overview P2 contracts exist and are wired:
  - `/dashboard/metrics/cost-anomaly-bands`
  - `/dashboard/metrics/fallback-transitions`
  - `/dashboard/metrics/budget-guardrail-simulation`
- [x] Connections P2 contracts exist and are wired:
  - `/dashboard/connections/edge-reliability`
  - `/dashboard/connections/hook-blast-radius`
  - `/dashboard/connections/routing-drift`
- [x] Operations P2 contracts exist and are wired:
  - `/dashboard/operations/approval-forecast`
  - `/dashboard/operations/policy-conflicts`
  - `/dashboard/operations/runtime-recovery-simulation`
- [x] Editor P2 contracts exist and are wired:
  - `/editor/prompt-graph`
  - `/editor/section-dependency-impact`
  - `/editor/rollback-risk`
