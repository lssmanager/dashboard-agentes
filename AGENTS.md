# AGENTS.md

## Mission
This repository must evolve OpenClaw Studio into a full multi-level control plane, not a simple agent editor.

Studio must converge toward these product surfaces:
- Agency Builder / Setup Helper
- Workspace Studio
- Agency Topology
- Builder Agent Function
- Observability / Debug / Replay
- Core Files Diff / Apply / Rollback

## Canonical hierarchy
Agency
  Department
    Workspace
      Agent
        Subagent

Cross-cutting capabilities:
- Skills
- Tools
- Flows
- Handoffs
- Channels
- Core files

## Execution rule
Only these levels can receive direct inbound messages and trigger execution:
- Agency
- Department
- Workspace

Agents and Subagents execute delegated work only.

## Canonical Studio behavior
- Agency is the top-level sandbox.
- Departments and Workspaces can connect freely only inside the same Agency.
- Topology actions are real runtime actions:
  - connect
  - disconnect
  - pause
  - reactivate
  - redirect
  - continue
- Studio must support bidirectional propagation:
  - top-down
  - bottom-up

## Core files affected by Studio
Studio changes may affect or propose diffs for:
- BOOTSTRAP
- IDENTITY
- TOOLS
- USER
- HEARTBEAT
- MEMORY
- SOUL
- AGENT.md / AGENTS.md

## Required change lifecycle
Do not write major behavioral changes blindly.

The required lifecycle is:
1. preview
2. diff proposal
3. apply
4. rollback

## Non-goals
- Do not reduce Studio to a simple agent editor.
- Do not hardcode Studio around a single selected agent.
- Do not treat Skills and Tools as simple checkboxes.
- Do not break preview → diff → apply → rollback.
- Do not ship UI-only topology controls that do not affect runtime.
- Do not duplicate catalog data if reference propagation is the intended model.

## Product invariants
- Skills and Tools are profile-shaping inputs, not only permissions.
- Assigning Skills/Tools can modify the operational profile of Agency, Department, Workspace, Agent, or Subagent.
- Builder Agent Function must explain visually what an entity does, how it works, what it receives, what it outputs, and what files it proposes to change.
- Agency Topology and Workspace Studio are separate views.
- Observability and replay are first-class features, not optional extras.

## Repo zones
- apps/api/src/modules/** => backend contracts, orchestration, runtime, replay, observability, diff/apply/rollback
- apps/web/src/features/** => Agency Builder, Workspace Studio, Agency Topology, Builder Agent Function, Debug UI
- packages/** => reusable engines, graph state, propagation, shared schemas
- templates/** => agency profiles, reusable presets, setup seeds
- skills/** => Codex skills and workflow helpers
- docs/** => specs, canonical model, architecture, contracts

## Entity targets
Backend changes should eventually support:
- AgencySpec
- DepartmentSpec
- WorkspaceSpec
- AgentSpec
- SubagentSpec or AgentSpec(kind=subagent)
- SkillSpec
- ToolSpec
- ConnectionSpec
- HandoffPolicy
- ChannelBinding
- RunSpec
- RunStep
- TraceEvent
- CoreFileDiff
- RollbackSnapshot

## Required commands
Run these whenever relevant:
- npm install
- npm run build
- npm test

If a deeper AGENTS.md adds checks, run those too.

## Delivery rules
- Prefer small, reviewable patches.
- Keep API and UI contracts aligned.
- Update docs whenever the entity model changes.
- Keep naming consistent with the canonical hierarchy.
- Add or update tests for behavior changes.
- Preserve backward compatibility where practical unless the task explicitly allows breaking changes.

## Definition of Done
A change is done only if:
1. it matches the canonical Studio model,
2. build and tests pass,
3. UI and API contracts remain aligned,
4. docs are updated if entities or flows changed,
5. the patch is scoped and reviewable.