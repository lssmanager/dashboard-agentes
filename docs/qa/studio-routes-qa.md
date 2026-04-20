# Studio Routes QA (Visual + Functional)

Date: 2026-04-19
Branch: `codex/ui-reconstruction-sprint`

## Scope

Routes reviewed:

- `/`
- `/agency-builder`
- `/workspace-studio`
- `/agency-topology`
- `/operations`
- `/observability`
- `/observability/:runId`
- `/runs`
- `/diagnostics`
- `/sessions`
- `/hooks`
- `/versions`
- `/commands`

Supporting surfaces reviewed:

- `NavRail`
- `ContextPanel`
- `MainLayout`
- `ObservabilityShell`

## QA checks completed

1. Route registration exists in `App.tsx` for all Studio and observability pages.
2. Primary navigation links from `NavRail` point to valid routes.
3. Context panel item clicks now route to item-level targets when available.
4. Workspace Studio avoids full page reloads and uses SPA navigation.
5. Legacy `StudioPage` tab type mismatch fixed (`'canvas'` -> `'builder'`) to avoid compile-time type failure.
6. Observability run detail page now uses shared shell button style for visual consistency.
7. Known text encoding artifacts that affected visible UI strings were removed from touched pages.

## Fixes applied during QA

1. `WorkspaceStudioPage`:
   - Replaced `window.location.href` navigations with router navigation.
2. `StudioPage`:
   - Updated invalid tab seed to `builder`.
   - Replaced `window.location.href` with router navigation.
3. `ContextPanel` + `sidebar-context`:
   - Added optional `path` on sidebar items.
   - Mini-cards now navigate to the item path when defined.
4. `ObservabilityRunPage`:
   - Switched to `consoleToolButtonStyle` for shell consistency.
5. `OverviewPage`:
   - Standardized flow metric separator text.
6. `MainLayout`:
   - Unified header background token usage.

## Limitations

1. Build/test command execution is blocked in this environment because `npm` is unavailable.
2. Browser-level visual validation (real rendering screenshots) was not run in this block.

## Recommended next QA pass

1. Run `npm run build` and `npm test` in CI or a local environment with Node/npm.
2. Execute browser QA screenshots for desktop and mobile breakpoints:
   - 1440px, 1024px, 768px, 390px.
3. Validate keyboard navigation/focus order in:
   - `Workspace Studio` toolbar and tab rail.
   - `Agency Topology` action controls.
   - `Observability` tab family.
