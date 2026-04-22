# Phase 3 Validation Checklist

Use this checklist to confirm the frontend surfaces stay coherent after scope or routing changes.

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
