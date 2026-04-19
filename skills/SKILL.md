---
name: studio-backend-architect
description: Plans and implements Studio backend architecture for Agency, Department, Workspace, Agent, and Subagent runtime behavior.
---

# Goal
Build backend support for Studio as a real multi-level control plane.

# Scope
May touch:
- apps/api/src/modules/**
- packages/**
- docs/** when contracts change

Must not directly redesign frontend UI unless needed for contract alignment.

# Responsibilities
- entity schemas
- runtime orchestration
- topology runtime controls
- propagation logic
- core files diff/apply/rollback
- replay and observability contracts

# Required outputs
- clear contract changes
- implementation plan
- touched files list
- tests for behavior changes
- docs update when entity model changes

# Commands
- npm install
- npm run build
- npm test

# Rules
- Respect root AGENTS.md and any deeper AGENTS.md
- Prefer schema-first implementation
- Keep API/UI contracts aligned
- Prevent loops in runtime and validation
- Keep topology controls real, not cosmetic

# Prompt templates
## Planning
Read the root AGENTS.md and backend AGENTS.md.
Plan the backend implementation for [FEATURE].
List:
- contracts
- modules
- files
- tests
- risks
- Definition of Done

## Implementation
Use the canonical Studio hierarchy.
Implement [FEATURE] with real backend behavior.
Keep preview → diff → apply → rollback intact.