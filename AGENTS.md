---
name: dashboard-agentes-phase-2-consolidation
description: Phase 2 consolidation guide for dashboard-agentes. Preserve validated strengths, deepen architecture, improve IA and shell ergonomics, productize analytics and governance, and prevent shallow or partial implementations.
version: 2.3
status: active
---

# AGENTS.md — Phase 2 Consolidation

## Core Mission
This phase exists to convert the current application from a **working multi-surface dashboard** into a **coherent operator platform** with three strong environments:

1. **Administration**  
   Scope-based operational console for monitoring, governance, runtime control, analytics, runs, sessions, connections, settings, and scoped profile application.

2. **Studio**  
   Dedicated immersive environment for visual composition, builder workflows, routing/flow design, node manipulation, and canvas-based editing.

3. **Editor**  
   Deep configuration surface for entity-level editing: identity, prompting, actions, routing, hooks, versions, dependencies, operations, and inheritance/override inspection.

This is **not** a mockup-copy exercise.  
This is **not** a broad rewrite.  
This is a **structural consolidation phase**.

The goal is to:
- preserve what is already strong,
- correct weak IA decisions,
- improve screen-space usage,
- deepen operational functionality,
- and create enough technical depth that the product no longer feels partial.

---

# 1. Phase Intent

## This phase IS
- a deep architectural consolidation
- a layout and information-architecture refinement phase
- a scope-driven UX hardening phase
- a governance and analytics expansion phase
- a shell/system design phase
- a productization phase for shallow but promising surfaces

## This phase is NOT
- a greenfield rewrite
- a "just polish it" pass
- a short types/wrappers-only sprint
- a visual-only effort disconnected from backend contracts
- a sequence of isolated patch jobs
- a placeholder-first implementation strategy

Any work that only adds:
- route renames,
- DTO stubs,
- wrappers,
- placeholder charts,
- fake controls,
- static cards,
without materially changing product depth or behavior
**does not count as Phase 2 completion**.

---

# 2. Frozen Product Decisions

These decisions are already made. Do not reinterpret them casually.

## 2.1 Global left rail
The global left rail must contain only:

- `Administration`
- `Studio`
- `Editor`
- `Profiles Hub`
- `Settings`

### Explicitly removed from the global primary rail
- `Runs`
- `Sessions`

These become **scope-level tabs inside Administration**.

---

## 2.2 Hierarchy remains a primary product element
Hierarchy is not optional chrome.
Hierarchy is part of the product's mental model.

It must remain visible and must evolve into:
- resizable
- collapsible
- persistent
- optionally compact/icon-based
- fast to scan
- fast to reopen
- usable without full text saturation

It must **not** be removed in favor of hidden menus or deeply nested route-only navigation.

---

## 2.3 Preserve the Studio / Administration split
Do **not** collapse Studio back into an admin-style page.

### What this means
- **Administration** remains the operator console for monitoring, governance, connections, runtime, runs, sessions, settings, and scope-level operational controls.
- **Studio** remains a dedicated editor environment for visual composition, canvas workflows, routing design, node editing, topology-aware flow work, and builder interactions.

### What is allowed
- make Studio cleaner
- make Studio denser
- make Studio more immersive
- reduce wasted vertical space
- increase canvas area
- make Studio toolbar icon-first
- make library and inspector collapsible
- add floating helpers or side tool strips
- improve Admin ↔ Studio continuity

### What is not allowed
- reverting Studio to stacked dashboard cards
- moving the canvas back into Administration as the main editing surface
- removing the dedicated Studio environment
- making Administration and Studio visually/functionally indistinguishable

---

## 2.4 Inspector pattern stays
The right-side inspector pattern is strong and must remain.

It should expand with:
- richer widgets
- node state
- runtime state
- dependency summaries
- diff/publish/approval context
- scoped actions
- inheritance/effective config
- selected object details

Do not replace inspector-based workflows with modal-only flows unless strictly justified.

---

## 2.5 Profiles stays first-class
Profiles is not a generic asset bucket.

### Global
- `Profiles Hub`

### Scoped
- `Profile` tab

Do not collapse Profiles into:
- Assets
- Catalog
- Misc reusable data

Profiles represent reusable behavior/configuration packages and must remain explicit.

---

## 2.6 Governance moves to Operations
`Cost Budgets` and `Policies` do **not** belong under `Settings > Security`.

They must move into:
- `Administration > Operations`
or
- `Administration > Operations > Governance`

They must support:
- Agency
- Department
- Workspace
- Agent
- Subagent
- optional per-model overrides

---

## 2.7 Editor remains as deep editing route
Do not remove Editor because some of its concepts overlap with Administration.

### Administration
- operational control
- analytics
- monitoring
- governance
- runtime actions
- scoped summaries

### Editor
- deep editing
- prompts
- routing
- hooks
- versions
- dependency editing
- inheritance inspection
- section-by-section configuration

Both are needed.

---

# 3. Protected Strengths — Do Not Break

The following are current strengths and must be preserved unless a clearly better replacement exists.

## 3.1 Current positive strengths
- IDE-like left rail
- visible hierarchy panel
- dark design language
- card-based inspector organization
- Studio zoom/pan interaction
- current Administration / Studio split
- Profiles Hub concept
- scoped Profile tab concept
- scope-aware navigation foundation
- improved runtime result semantics in backend
- canvas-based editing already working
- presence of operational tabs and right-side summaries
- route compatibility already improved in master

## 3.2 Protected technical behaviors
Do not casually break:
- scope persistence
- selected lineage continuity
- route compatibility
- canvas selection behavior
- inspector selection sync
- runtime action semantics
- profile inheritance/effective state logic
- current dark theme tokens unless intentionally extended

## 3.3 Explicit anti-regressions
Do NOT:
- reintroduce giant Studio hero cards
- hide hierarchy completely
- move Runs/Sessions back to the global rail
- move budgets/policies back to Security
- flatten Studio into Administration
- replace real interaction with static mock cards
- claim completion on shallow UI scaffolding

---

# 4. What MUST be Expanded in Phase 2

## 4.1 Shell system
The shell must become a true operator/editor shell.

### Required improvements
- resizable hierarchy panel
- collapsible hierarchy panel
- persisted widths
- persisted collapsed state
- optional compact mode
- Studio-specific edge bleed / space optimization
- better horizontal space management
- reduced text saturation where icon navigation is better
- tooltips for icon-first controls

### Strong preference
Adopt editor-like interaction patterns:
- split panes
- handle-based resizing
- remembered panel widths
- compact icon rows
- contextual tooltips instead of always-visible labels

---

### Panel collapse / layout control language

The shell must support an IDE-like panel control model with compact, icon-first controls.

#### Interaction rule
Panel visibility and panel mode must be controllable primarily through compact icon buttons — **not** through text-only buttons.

#### Required panel control icons
Use a compact icon language for:
- left panel expanded
- left panel collapsed
- right panel expanded
- right panel collapsed
- dual-panel mode when applicable
- overflow / more actions menu

#### UX behavior
- icons must have tooltips on hover
- icons must have active/inactive states
- icons must be visually minimal and low-noise
- icon controls must not consume large horizontal space
- icon controls must remain understandable without persistent text labels
- text may appear on hover, in tooltip, or in contextual helper copy — but never as the primary mechanism

#### Panels affected
These controls apply to:
- Hierarchy panel
- Studio library panel
- Studio inspector panel
- optional dual-panel editor modes
- any Administration side panel that becomes collapsible/resizable

#### Panels with mandatory persistent state
- Hierarchy
- Studio Library
- Studio Inspector
- optional Administration Inspector

#### Functional requirements
- collapse/expand must be immediate
- width state must persist across sessions
- collapsed state must persist across sessions
- compact mode must preserve recoverability (user can always reopen)
- keyboard accessibility must remain intact
- icon state must clearly show which side is open/closed

#### Implementation constraint
Do **not** implement panel collapse only through large textual buttons such as "Hide panel", "Open panel", or similar. Compact icon-first controls are the default pattern. Text labels are supplementary — tooltip or hover-revealed only.

#### Design intent
The shell should feel closer to an IDE/workbench (VS Code, Photoshop, n8n) and less like a static dashboard with fixed sidebars.

---

## 4.2 Studio
Studio must become more immersive and use the screen better.

### Required improvements
- larger effective canvas area
- reduced vertical waste
- compact command deck
- icon-first toolbar with tooltip
- collapsible library
- collapsible inspector
- stronger builder/action affordances
- stronger visual representation of runtime operations:
  - connect
  - disconnect
  - pause
  - reactivate
  - redirect
  - continue
  - human approval
- better selected-node → inspector flow
- stronger non-builder modes inside the Studio environment
- better context clarity:
  - active scope
  - active agent
  - selected node
  - mode
  - runtime state

### Studio should feel closer to:
- VS Code side panel logic
- Photoshop collapsible tools
- n8n / Flowise editor ergonomics
- modern IDE/workbench behavior

It should NOT feel like:
- stacked admin cards above a canvas
- a dashboard page with a graph at the bottom

---

## 4.3 Administration
Administration must become the actual operator console.

### Required improvements
- more visual Overview
- more visual Connections
- stronger Operations governance
- scope-aware Runs and Sessions tabs
- stronger status semantics
- richer charting
- time-window driven metric panels
- more meaningful empty/degraded/offline handling

Administration should be where an operator can:
- inspect health
- understand cost
- understand routing
- inspect runtime degradations
- track recent runs
- review session pressure
- manage policies and approvals
- understand connection health quickly

---

## 4.4 Settings
Settings must be narrowed and improved.

### Settings should contain
- providers
- runtimes
- channels
- integrations
- auth/access/security concerns
- automations
- technical hooks where appropriate

### Settings should NOT contain
- cost governance
- budget caps
- approval budget rules
- escalation policies
- operational spend rules
- anything that belongs to runtime governance

Those belong to Operations.

---

## 4.5 Editor
Editor must evolve from useful scaffold to deep configuration tool.

### Minimum sections
- Identity
- Prompting / Behavior
- Skills / Tools
- Routing / Channels / Handoffs
- Hooks
- Versions
- Operations
- Dependencies
- Inheritance / Overrides

### Minimum supporting visuals
- readiness radar
- section stepper
- inheritance/override matrix
- versions timeline
- possibly dependency tree

Editor must clearly distinguish:
- locked
- inherited
- local override
- editable
- read-only because canonical source is elsewhere

---

# 5. Information Architecture Rules

## 5.1 Global navigation
Global rail:
- Administration
- Studio
- Editor
- Profiles Hub
- Settings

## 5.2 Scoped tabs inside Administration
Tabs vary by level, but the allowed model is:

- Overview
- Connections
- Operations
- Runs
- Sessions
- Settings
- Profile

### Typical rule
#### Agency / Department
- Overview
- Connections
- Operations
- Runs
- Sessions
- Settings
- optional Profile summary/defaults

#### Workspace / Agent / Subagent
- Overview
- Connections
- Operations
- Runs
- Sessions
- Settings
- Profile

## 5.3 Route compatibility
Legacy routes may remain internally for compatibility, but:
- visible labels must follow the new IA
- nav highlighting must map correctly
- redirects must be stable
- the user should not feel old/new route drift

---

# 6. Chart and Widget Map — Mandatory Productization

## 6.1 Overview
Overview must support, at minimum:

### KPI cards
- Agents
- Active Sessions
- Runs
- Channels
- Running
- Awaiting Approval
- Paused
- Snapshots

### Visuals P0
- Runs 24h + error rate
- Tokens prompt vs completion
- Sessions over time
- Budget usage gauge/bullet
- Model mix donut
- Model spend treemap or ranked bars
- Latency P50/P95 by model

### Visuals P1
- Sessions heatmap
- Runs ↔ Tokens correlation
- budget projection to soft/hard cap
- richer real-time KPI sparkline cards

---

## 6.2 Connections
Connections must support, at minimum:

### P0
- Meters:
  - Supported edges
  - Hook coverage
  - Routing stability
  - Handoff pressure
- Radial summaries:
  - Edges
  - Hooks
  - Channels
- Dependency graph
- Visual topology graph
- Flow graph / Sankey

### P1
- Org chart Agency → Dept → WS → Agent
- Hierarchy sunburst
- Hierarchy treemap
- Routing decision flowchart

---

## 6.3 Operations
Operations becomes the home for runtime governance and budgets.

### P0
- runtime state machine
- recent runs timeline by status
- alert severity timeline
- KPI mini-cards / sparkline summaries
- budgets gauge
- stacked bar by model / routing role
- governance controls:
  - soft cap
  - hard cap
  - require approval
  - replay budget
  - escalation threshold
  - per-model caps

### P1
- actions heatmap by department
- pending actions stacked bars
- approval queue trends
- reusable bundles vs local overrides
- policy inheritance visuals

---

## 6.4 Editor
Editor should support, at minimum:

### P0
- readiness radar by entity
- section stepper
- inheritance/override matrix
- versions timeline

### P1
- dependency tree
- prompt graph
- action/policy matrix
- diff viewer for inherited vs local values

---

# 7. Workstreams

## 7A. Frontend Workstream

### Primary objectives
1. Turn shell into IDE-like split-pane system with icon-first panel controls
2. Improve Studio space usage and panel ergonomics
3. Move Runs/Sessions into scoped tabs
4. Productize Overview and Connections with charts
5. Deepen Editor UI
6. Clean up Settings IA
7. Preserve current strengths while expanding depth

### Main shell files
- `apps/web/src/layouts/MainLayout.tsx`
- `apps/web/src/components/NavRail.tsx`
- `apps/web/src/components/Header.tsx`
- `apps/web/src/lib/HierarchyContext.tsx`
- `apps/web/src/lib/ScopeViewRegistry.ts`
- `apps/web/src/lib/studioRouting.ts`

### Studio files
- `apps/web/src/features/studio/pages/WorkspaceStudioPage.tsx`
- `apps/web/src/features/studio/components/StudioCanvas.tsx`
- `apps/web/src/features/studio/components/ComponentLibrary.tsx`
- `apps/web/src/features/studio/components/PropertiesPanel.tsx`
- `apps/web/src/features/studio/components/StudioTabBar.tsx`
- `apps/web/src/features/canvas/components/EditableFlowCanvas.tsx`

### Administration files
- `apps/web/src/features/admin/pages/AdministrationPage.tsx`
- `apps/web/src/features/studio/components/admin/*`

### Runs / Sessions
- `apps/web/src/features/runs/pages/RunsPage.tsx`
- `apps/web/src/features/sessions/pages/SessionsPage.tsx`

### Editor / Settings
- `apps/web/src/features/agents/pages/EntityEditorPage.tsx`
- `apps/web/src/features/settings/pages/SettingsPage.tsx`

### Charting guidance
Prefer:
- ECharts for operator charts and dense analytics
- D3 only when necessary for Sankey / highly custom graph layouts
- reusable chart wrappers with consistent empty/offline/degraded states

---

## 7B. Backend Workstream

### Primary objectives
1. Provide scope/window aware metrics projections
2. Provide graph projections for Connections
3. Move governance into Operations contracts
4. Deepen Editor section contracts
5. Support Runs/Sessions as scoped tabs
6. Keep runtime semantics explicit and safe

### Main modules
- `apps/api/src/modules/dashboard/dashboard.controller.ts`
- `apps/api/src/modules/dashboard/dashboard.service.ts`
- `apps/api/src/modules/runtime/*`
- `apps/api/src/modules/topology/*`
- `apps/api/src/modules/profiles/*`
- `apps/api/src/modules/studio/*`

### Required endpoint families

#### Overview metrics
- `/dashboard/metrics/kpis`
- `/dashboard/metrics/runs`
- `/dashboard/metrics/tokens`
- `/dashboard/metrics/sessions`
- `/dashboard/metrics/budget`
- `/dashboard/metrics/model-mix`
- `/dashboard/metrics/latency`
- `/dashboard/metrics/sessions-heatmap`
- `/dashboard/metrics/runs-token-correlation`

#### Connections metrics
- `/dashboard/connections/metering`
- `/dashboard/connections/radial`
- `/dashboard/connections/dependency-graph`
- `/dashboard/connections/topology`
- `/dashboard/connections/flow-graph`
- optional:
  - `/dashboard/connections/org-chart`
  - `/dashboard/connections/hierarchy`

#### Operations / governance
- `/dashboard/operations/budgets`
- `/operations/budgets`
- `/dashboard/operations/policies`
- `/operations/policies`
- `/dashboard/operations/runtime-state`
- `/dashboard/operations/recent-runs`
- `/dashboard/operations/pending-actions`

#### Editor
Provide section-level contracts for:
- identity
- prompting
- actions
- skills/tools
- routing/handoffs
- hooks
- versions
- operations
- dependencies
- inheritance metadata

### Every metrics endpoint must accept
- `level`
- `id`
- `window`
- optional `granularity`

Supported windows should include:
- `1H`
- `4H`
- `6H`
- `8H`
- `12H`
- `24H`
- `3D`
- `7D`
- `15D`
- `1M`
- `2M`
- `3M`
- `1Y`

---

# 8. Governance Rules

## 8.1 Budgets must support scope
Budgets and policies must support:

- Agency
- Department
- Workspace
- Agent
- Subagent

Optional:
- per-model overrides
- role-based spend allocation
- replay/approval limits

## 8.2 Required governance fields
At minimum:
- soft cap
- hard cap
- require approval
- replay budget
- escalation threshold
- per-model caps
- inheritance metadata
- source-of-truth level
- effective value

## 8.3 Governance belongs in Operations
Do not place runtime spend governance back in Security.
Security is for platform security/access concerns, not operational spend control.

---

# 9. Phase 2 Priority Plan

## P0 — mandatory structural work
- shell resizable/collapsible with icon-first panel controls
- Runs/Sessions moved to scoped tabs
- Studio fullscreen/editor-space improvement
- Overview analytics base
- Connections analytics base
- Budgets/Policies moved to Operations
- Editor deepening

## P1 — high-value expansion
- org chart
- hierarchy sunburst / treemap
- actions heatmap
- recent runs advanced visuals
- readiness suite
- advanced cost projections
- richer Studio action overlays

## P2 — refinement
- floating helpers in Studio
- keyboard shortcuts
- layout presets
- user preferences persistence
- additional analytics polish
- advanced personalization

---

# 10. Agent Rules

## Before non-trivial work, every agent must report
1. Current state
2. Target state
3. Files to inspect
4. Files to modify
5. Backend dependencies
6. Frontend dependencies
7. Risks
8. Validation plan
9. Definition of done

## Every agent must avoid
- broad redesign without explicit approval
- destructive changes to protected strengths
- placeholder completions
- cosmetic-only passes presented as product completion
- UI that implies unsupported backend behavior
- fake charts with no real contract path
- moving governance back into Settings/Security
- reintroducing Runs/Sessions into the global rail
- implementing panel collapse through text-only buttons instead of icon-first controls

## Every agent must preserve
- dark theme and design language
- scope continuity
- current positive Studio interaction base
- current positive inspector structure
- current visible hierarchy presence
- route compatibility where feasible
- panel state persistence (width, collapsed/expanded)

---

# 11. Validation Requirements

## Frontend validation
At minimum:
- hierarchy collapse/resize works via icon-first controls
- panel state (width, collapsed) persists across sessions
- Studio uses more screen space
- canvas remains functional
- inspector sync still works
- Runs/Sessions appear as scoped tabs
- Overview/Connections charts respond to scope/window changes
- Operations governance renders correctly by scope
- Editor deeper sections work without regressions
- panel icon controls have tooltips and active/inactive states
- no panel can be left in an unrecoverable hidden state

## Backend validation
At minimum:
- metrics endpoints return stable shapes
- windowing works
- scope resolution is correct
- budgets/policies resolve inheritance properly
- Editor section contracts resolve correctly
- runtime state semantics remain explicit

## Acceptance of degraded/offline state
Offline or degraded runtime must not break charts or tabs.
Instead, charts and widgets must degrade intentionally:
- offline badge
- empty metric state
- zero/unknown handling
- explanatory copy where needed

---

# 12. Definition of Done for Phase 2

Phase 2 is complete only when all of the following are true:

- shell panels are controllable by the user via compact icon-first controls
- hierarchy is collapsible/resizable/persistent
- Studio feels like a real editor and uses space well
- Runs and Sessions are no longer global-rail clutter
- Overview and Connections are visual/operator-grade tabs
- Budgets and Policies live in Operations/Governance
- Editor feels deep rather than shallow
- Settings is cleaned up and no longer mixes operational spend governance
- backend contracts support the operator console honestly
- no major regressions are introduced
- the product feels more like a platform than a collection of pages

---

# 13. Final Principle

Do not rebuild what is already good.

Preserve the strongest parts of the current product:
- IDE-like rail
- hierarchy presence
- inspector pattern
- Studio interaction base
- scope-driven thinking

Then expand around them:
- more flexible shell with icon-first panel controls
- more immersive Studio
- deeper analytics
- clearer governance
- richer editor depth
- stronger operational clarity

---

# 14. Phase 3 — Visualization Reference

Phase 3 visualization work is governed by two companion documents.
All agents working on analytics, charting, or dashboard surfaces must read both before starting.

## Required reading

```
docs/VISUALIZATION_CATALOG_PHASE3.md
docs/PHASE3_EXECUTION_PLAN.md
```

## What these documents define

### VISUALIZATION_CATALOG_PHASE3.md
The master catalog of all official product visualizations.
For each visualization it specifies:
- ID and name
- owning tab
- priority (P0 / P1 / P2)
- backend contract (endpoint + shape)
- required operational states
- UX rules and insights expected

### PHASE3_EXECUTION_PLAN.md
The incremental build plan for the catalog.
Defines:
- execution phases (A through F)
- which visualizations belong to each phase
- recommended build order for frontend and backend teams
- acceptance criteria per delivery slice
- hard rules for what does NOT count as done

## Binding rules for all agents

Every agent working on visualization must follow these rules without exception:

- do not build a chart without a real backend endpoint
- do not use hardcoded or mock data in production
- do not declare a chart complete if it lacks empty/degraded/offline states
- do not build a chart that does not respond to scope (`level` + `id`)
- do not build a chart that ignores `window` when the endpoint requires it
- build P0 visualizations before P1 or P2
- the catalog is the backlog — no visualization should be invented outside it without explicitly extending the catalog first

## Priority order

| Phase | Target | Blocking |
|-------|--------|---------|
| A | Charting infrastructure | yes — all other phases depend on it |
| B | Overview P0 | yes — core operator console |
| C | Connections P0 | yes — topology and flow reading |
| D | Operations P0 | yes — governance and runtime |
| E | Editor P0 | yes — depth and readiness |
| F | P1 enrichment | no — high value but not blocking |