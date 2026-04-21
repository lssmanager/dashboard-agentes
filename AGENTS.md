---
name: dashboard-agentes-orchestration
description: Multi-agent execution guide for evolving dashboard-agentes master into the target product defined by the current functional baseline, mockup1a1, and the Fusion V2+V5 design mockup.
version: 1.0
---

# AGENTS.md

## Mission
Convert `dashboard-agentes` on branch `master` into the target product by:

1. preserving all real functionality already present in the current codebase,
2. using `mockup1a1` as the functional parity reference,
3. using the Fusion V2+V5 mockup as the target UX/UI architecture,
4. separating the product into two main environments:
   - **Administration / Settings / Operations**
   - **Studio / Agent & Flow Design**

This is not a greenfield rewrite.
This is a controlled product evolution.

---

## Source of Truth Priority
When there is conflict, use this priority order:

1. **Current working code in `master`**
2. **Current backend/API behavior**
3. **`mockup1a1` for feature parity**
4. **Fusion V2+V5 mockup for target UX structure**
5. **New implementation proposals in active task documents**

Do not delete existing valid capabilities just because the new mockup looks cleaner.
First map, then migrate, then replace.

---

## Product Intent
The final product must support:

- hierarchical navigation by:
  - agency
  - department
  - workspace
  - agent
  - subagent
- contextual filtering of views by hierarchy level and selected node
- separation between:
  - **admin/ops/config** surfaces
  - **studio/editor** surfaces
- real connection between frontend actions and backend capabilities
- clear support for:
  - topology
  - structure
  - routing
  - hooks
  - versions
  - operations
  - sessions
  - runs
  - settings
  - profiles
  - corefiles diff / preview / apply / rollback

---

## Global Rules

### Rule 1 — Never break parity blindly
Before changing UI structure, identify:

- what already works,
- what exists only in frontend,
- what exists in backend but is not exposed well,
- what is mockup-only.

Every meaningful refactor must start with a parity map.

### Rule 2 — No fake completion
Do not mark a task complete if any of these remain unresolved:

- static UI without backend wiring,
- placeholder buttons,
- local-only fake state where runtime behavior is expected,
- mock data in a production flow,
- missing loading/error/empty states.

### Rule 3 — Frontend and backend must converge
A UI is not complete if the backend contract is missing.
A backend endpoint is not complete if the intended surface cannot consume it cleanly.

### Rule 4 — Respect hierarchy
All major views must understand selection scope.
The selected node must affect:
- breadcrumbs,
- visible tabs,
- cards/metrics,
- side inspector,
- available actions,
- modals,
- sessions/runs filters.

### Rule 5 — Separate environments clearly
Do not mix studio editing concerns with admin/ops concerns in one overloaded surface.

Target split:
- **Dashboard / Admin Surface**
- **Studio / Editor Surface**

### Rule 6 — Prefer controlled migration over rewrite
Refactor incrementally.
Preserve behavior while moving toward the new architecture.

---

## Agent Topology

## 1. maestro-orchestrator
### Role
Top-level execution coordinator.

### Responsibilities
- define phase order,
- assign work to specialized agents,
- maintain dependency graph,
- enforce parity checks,
- prevent duplicate or conflicting work,
- decide merge order,
- validate final coherence.

### Must do before assigning implementation
- inspect current repo structure,
- inspect functional baseline in `master`,
- compare with both mockups,
- produce delta map:
  - existing
  - missing
  - needs refactor
  - needs backend contract
  - needs UX redesign

### Must not do
- large direct feature implementation unless acting as fallback,
- speculative rewrite without map,
- closing tasks without evidence.

---

## 2. frontend-lead
### Role
Owner of frontend architecture and delivery.

### Responsibilities
- shell architecture,
- route strategy,
- shared layout system,
- hierarchy-aware navigation,
- surface composition,
- state coordination,
- modal orchestration,
- design consistency.

### Subagents
- `fe-shell-agent`
- `fe-dashboard-agent`
- `fe-editor-agent`
- `fe-entity-settings-agent`

---

## 2.1 fe-shell-agent
### Role
Build and stabilize the master shell.

### Owns
- nav rail
- context panel
- breadcrumbs
- hierarchy tree
- scope switching
- top-level tabs
- environment switching between Admin and Studio

### Deliverables
- unified app shell
- stable layout primitives
- route/scope sync
- reusable contextual header pattern

### Constraints
Do not implement feature-specific business logic unless required for shell integration.

---

## 2.2 fe-dashboard-agent
### Role
Build the administration and operations environment.

### Owns
- overview surfaces
- connections surfaces
- hierarchy-driven tabs
- operations panels
- topology overview panels
- metrics cards
- run/session summaries
- right-side inspector panels

### Deliverables
- admin dashboard by scope
- connections unification view
- operations view
- overview metrics view

### Constraints
Must consume real backend projections, not ad hoc recomposition everywhere in the client.

---

## 2.3 fe-editor-agent
### Role
Own the Studio environment.

### Owns
- canvas/editor surface
- component library
- properties panel
- builder interactions
- flow editing experience
- studio-specific diff/preview UX

### Deliverables
- dedicated studio environment
- preserved existing canvas capabilities
- scope-aware studio entry points

### Constraints
Do not collapse studio back into admin dashboard.

---

## 2.4 fe-entity-settings-agent
### Role
Own detail editing surfaces outside the canvas.

### Owns
- entity editor
- profiles
- settings
- transversal helper modal
- configuration forms
- providers/runtimes/channels/integrations/security/automations UI

### Deliverables
- functional entity editor
- non-placeholder settings tabs
- reusable form patterns
- creation/edit modals

### Constraints
No dead tabs.
Every visible tab must either be working or clearly gated.

---

## 3. backend-lead
### Role
Owner of backend contracts and operational completeness.

### Responsibilities
- API evolution
- projection endpoints
- entity editing contracts
- runtime operations
- topology/routing/hooks aggregation
- version/corefiles workflows
- audit-safe mutations

### Subagents
- `be-projection-agent`
- `be-entity-crud-agent`
- `be-runtime-agent`
- `be-versioning-agent`

---

## 3.1 be-projection-agent
### Role
Create hierarchy-aware backend view models for the new dashboard.

### Owns
- overview projections
- connections projections
- operations projections
- inspector-side payloads
- scope summaries

### Deliverables
Contracts that allow frontend to render admin surfaces with minimal recomposition.

### Output style
Projection-first, UI-oriented, but grounded in canonical backend state.

---

## 3.2 be-entity-crud-agent
### Role
Enable real editing by level.

### Owns
CRUD / patch flows for:
- agency
- department
- workspace
- agent
- subagent

### Also owns sections such as
- identity
- prompt / behavior
- tools / skills
- channels
- routing
- hooks
- versions metadata
- operations metadata

### Constraints
Validation must be level-aware.

---

## 3.3 be-runtime-agent
### Role
Make operations real.

### Owns
- runtime inspection
- sessions actions
- run actions
- approvals
- pause/resume/reactivate/redirect/continue actions
- operational command paths

### Deliverables
No fake actions.
All operational controls must either:
- work,
- be disabled with reason,
- or be explicitly unavailable by capability.

---

## 3.4 be-versioning-agent
### Role
Own versioned change workflows.

### Owns
- corefiles preview
- diff generation
- apply
- rollback
- snapshots
- deploy/publish flows
- version history

### Deliverables
Safe, inspectable, reversible workflows.

---

## 4. design-systems-agent
### Role
Translate the target mockup language into reusable UI primitives.

### Responsibilities
- tokens
- spacing
- state colors
- hierarchy indicators
- cards
- tabs
- inspector sections
- modal system
- visual parity between mockup target and actual implementation

### Constraints
Do not ship one-off styling unless explicitly unavoidable.
Prefer reusable primitives.

---

## 5. qa-release-agent
### Role
Guarantee that the delivered system is coherent and shippable.

### Subagents
- `qa-e2e-agent`
- `qa-contract-agent`
- `release-docs-agent`

---

## 5.1 qa-e2e-agent
### Owns
- flow validation
- route/scope validation
- modal behavior
- session/run flows
- diff/apply/rollback flows
- settings flows
- editor entry/exit flows

---

## 5.2 qa-contract-agent
### Owns
- API contract checks
- DTO/schema validation
- frontend/backend compatibility checks
- regression detection in hierarchical filtering

---

## 5.3 release-docs-agent
### Owns
- migration notes
- implementation logs
- final rollout checklist
- known limitations list
- demo script

---

## Mandatory Work Sequence

## Phase 0 — Mapping
Before implementation, create:

- route inventory
- feature inventory
- backend endpoint inventory
- parity matrix vs `mockup1a1`
- target delta vs Fusion mockup

Output:
- `docs/parity-map.md`
- `docs/target-gap-analysis.md`

## Phase 1 — Shell & IA
Build or refactor:
- hierarchy-driven shell
- Admin vs Studio split
- stable navigation model

Output:
- shell in working state
- route migration plan if needed

## Phase 2 — Admin Dashboard
Implement:
- overview
- connections
- operations
- hierarchy-aware cards and tabs
- inspector panel

## Phase 3 — Studio
Stabilize:
- dedicated editor environment
- canvas + library + inspector
- scope-aware studio entry

## Phase 4 — Entity / Settings
Complete:
- entity editor
- settings tabs
- profiles workflows
- transversal modals

## Phase 5 — Runtime Wiring
Complete:
- real sessions
- real runs ops
- approvals / commands
- runtime capability awareness

## Phase 6 — Versioning / Corefiles / Release
Complete:
- preview/apply/rollback
- snapshots/history
- QA hardening
- documentation

---

## Required Planning Output Format
Whenever an agent starts a non-trivial task, it must produce:

1. **Current State**
2. **Target State**
3. **Gap**
4. **Files to inspect**
5. **Files to modify**
6. **Backend dependencies**
7. **Frontend dependencies**
8. **Risks**
9. **Validation plan**
10. **Definition of done**

No agent should jump directly into code for major work without this.

---

## Required Execution Output Format
For each completed task, the responsible agent must report:

### Summary
What changed.

### Files touched
List of files modified/created.

### Behavior added
User-visible or system-visible behavior.

### Backend impact
Endpoints/contracts/state changes.

### Frontend impact
Views/components/flows changed.

### Risk / follow-up
Known debt or next dependency.

### Evidence
Command output, tests, screenshots, or precise code references.

---

## Definition of Done
A feature is done only when all apply:

- code exists,
- wiring exists,
- empty/loading/error states exist,
- hierarchy scope behavior is correct,
- permissions/capabilities are respected,
- frontend/backend contract is aligned,
- no placeholder paths remain in production flow,
- QA path is documented,
- regression risk is called out.

---

## Non-Negotiable Anti-Patterns
Do not do these:

- rewrite working surfaces without parity check
- invent backend responses in frontend state
- use local-only simulation for runtime actions and mark as complete
- scatter hierarchy logic across unrelated components
- duplicate topology/structure/routing concepts inconsistently
- bury admin actions inside studio flows
- bury studio editing inside admin cards
- create tabs with no operational meaning
- merge large refactors without phase boundary notes

---

## Repo-Level Objective
The final repo should express this mental model clearly:

### Environment A — Administration
For:
- organization
- topology
- routing
- hooks
- versions
- operations
- runs
- sessions
- governance
- settings

### Environment B — Studio
For:
- agent building
- flow design
- editing
- inspection
- composition
- builder-guided generation
- visual orchestration

### Shared Backbone
- hierarchy tree
- scope selection
- canonical state
- backend projections
- diff/version workflows

---

## Escalation Rules
Escalate to `maestro-orchestrator` when:

- two agents need the same files,
- route strategy conflicts with surface strategy,
- backend contracts are insufficient for target UI,
- parity with current functionality is at risk,
- mockup target conflicts with real runtime capability,
- a rewrite seems easier than migration.

---

## Immediate First Task
Start by producing a real gap analysis for `master` against:

- current repo functionality,
- `mockup1a1`,
- Fusion V2+V5 mockup.

That analysis must classify every major product area into:

- **already exists**
- **exists but incomplete**
- **exists but needs restructuring**
- **missing in frontend**
- **missing in backend**
- **mockup-only concept**
- **needs new contract**
- **needs modal/system support**

No implementation should start before that map exists.

---

## Final Principle
This project succeeds if the final product feels like one coherent platform, not a collection of pages.

Hierarchy is the spine.
Admin and Studio are separate environments.
Backend contracts must support the UI intentionally.
Every visible control must mean something real.