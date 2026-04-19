# AGENTS.md — Backend Studio scope

## Scope
This file applies to:
- apps/api/src/modules/**

## Mission
Implement Studio backend as a real multi-level runtime and control plane.

## Backend priorities
- Agency / Department / Workspace execution model
- Runtime topology control
- Bidirectional propagation of Skills / Tools / profile changes
- Core files diff / apply / rollback
- Replay / checkpointing / observability

## Canonical backend responsibilities
- Agency can receive direct messages and dispatch to Departments
- Department can receive direct messages and dispatch to Workspaces
- Workspace can receive direct messages and dispatch to Agents/Subagents
- Agents/Subagents execute delegated work only
- Skills/Tools come from Agency-level catalog and are referenced downward
- Lower-level refinement can propose upward profile changes

## Rules
- Prefer schema-first changes.
- Add or update contracts before wiring UI assumptions.
- Keep Studio runtime real, not mock-only.
- Prevent infinite loops in both validation and runtime.
- Treat Skills and Tools as shared catalog references, not copied blobs, unless the task explicitly requires materialization.
- Preserve preview → diff → apply → rollback semantics.
- Any runtime topology control exposed by UI must have real backend behavior.

## Expected backend domains
Prioritize work in these logical areas:
- schemas
- runtime orchestration
- topology control
- propagation engine
- corefiles diff engine
- observability
- replay/checkpoints
- handoff payload contracts

## API expectations
Backend must support or move toward:
- Agency Builder data contracts
- Workspace Studio graph contracts
- Agency Topology runtime controls
- Builder Agent Function outputs
- diff/apply/rollback endpoints
- replay/debug endpoints

## Checks
Run after changes:
- npm run build
- npm test

If adding a new runtime or propagation path, add tests for:
- valid dispatch
- invalid loops
- paused/disconnected links
- diff preview generation
- rollback safety
- bidirectional propagation consistency