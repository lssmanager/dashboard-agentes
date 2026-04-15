# ADR-0001: OpenClaw Studio Boundaries and Runtime Ownership

## Status
Accepted

## Context
OpenClaw Studio provides visual authoring, validation, compilation, deployment, and observability. OpenClaw Gateway/OpenClaw runtime remains the execution target.

## Decision
- OpenClaw is the only runtime for sessions, routing execution, and agent lifecycle.
- Studio frontend never talks directly to OpenClaw Gateway.
- Studio backend (`apps/api`) is the BFF and the only bridge to filesystem and gateway adapter.
- `.openclaw-studio/` stores visual source-of-truth specs.
- Compiler emits OpenClaw artifacts (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `USER.md`, `HEARTBEAT.md`) + routing/spec outputs.
- AutoGen runtime integration is explicitly forbidden.
- Duplicated runtime models for sessions/routing are forbidden; Studio consumes runtime state from Gateway APIs.

## Consequences
- Legacy dashboard (`backend/` + `frontend/`) can coexist while Studio in `apps/*` matures.
- Every Studio screen must map to typed schema entities and BFF endpoints.
- Compile/deploy is blocked when schema or cross-reference validation fails.
