# AGENTS.md — Frontend Studio scope

## Scope
This file applies to:
- apps/web/src/features/**

## Mission
Implement Studio as five coherent visual surfaces:
- Agency Builder
- Workspace Studio
- Agency Topology
- Builder Agent Function
- Observability / Debug / Replay

## UI rules
- Do not collapse Studio into a single canvas.
- Keep macro and micro views distinct.
- Builder Agent Function must visibly explain what an entity does.
- Diff preview must be first-class UI, not hidden.
- Topology controls must reflect real runtime intent.
- Skills and Tools must be visually distinct entities.
- Do not design the product as a flat list of forms.
- Keep hierarchy visible at all times.

## UX rules
- Prefer explicit hierarchy:
  - Agency
  - Department
  - Workspace
  - Agent
  - Subagent
- Support preview → diff → apply → rollback directly in UI.
- Keep state and contracts aligned with backend.
- Use reusable components over one-off page code.
- Preserve separation between:
  - Agency Builder
  - Agency Topology
  - Workspace Studio
  - Observability / Debug

## Expected UI areas
- agency-builder
- workspace-studio
- topology
- builder-agent-function
- debug
- diff-preview
- component-library
- properties-panel

## Interaction expectations
- Builder Agent Function must show:
  - what the entity does
  - tasks
  - inputs
  - outputs
  - skills
  - tools
  - collaborators
  - proposed file changes
- Agency Topology must support:
  - connect
  - disconnect
  - pause
  - reactivate
  - redirect
- Workspace Studio must support:
  - orchestrator
  - agent
  - subagent
  - skill
  - tool
  - condition
  - approval
  - loop
  - handoff

## Checks
Run after changes:
- npm run build
- npm test

If the task changes entity hierarchy, update related views and docs.