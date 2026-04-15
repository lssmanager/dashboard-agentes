# Backend Studio Instructions

## Scope
Applies to `apps/api/**` and `packages/**`.

## Purpose
Define modular backend rules for OpenClaw Studio. The backend is the only bridge between the frontend, OpenClaw Gateway, workspace filesystem, compiler, deploy flow, and validation layers.

## Core Principles
- OpenClaw is the runtime. Do not duplicate it.
- The browser must never talk directly to the gateway.
- Keep clear boundaries between gateway adapter, workspace compiler, deploy layer, and CRUD modules.
- Every endpoint must consume and return typed contracts.
- Prefer filesystem-first for workspace artifacts. Use database only for drafts, snapshots, or audit data.

## Module Boundaries
### Gateway Layer
Location: `apps/api/src/modules/gateway/**` and `packages/gateway-sdk/**`
Responsibilities:
- Health and diagnostics
- Gateway client interaction
- Protocol normalization
- Auth header/token handling
Must not:
- Compile workspaces
- Perform business orchestration unrelated to gateway state

### Workspace Layer
Location: `apps/api/src/modules/workspaces/**` and `packages/workspace-engine/**`
Responsibilities:
- Read workspace files
- Write workspace files
- Compile prompt files and deployable artifacts
- Prepare preview and diff data
Must not:
- Call the gateway directly except through dedicated services
- Own UI-specific state

### Deploy Layer
Location: `apps/api/src/modules/deploy/**`
Responsibilities:
- Preview changes
- Generate diffs
- Apply writes safely
- Trigger any post-write runtime synchronization flow
Must not:
- Rebuild compiler logic inline
- Embed gateway protocol details

### Domain Modules
Locations:
- `apps/api/src/modules/agents/**`
- `apps/api/src/modules/skills/**`
- `apps/api/src/modules/flows/**`
- `apps/api/src/modules/profiles/**`
- `apps/api/src/modules/routines/**`
- `apps/api/src/modules/routing/**`
Responsibilities:
- CRUD logical entities
- Use core contracts
- Delegate artifact generation to compiler packages

## Controllers, Services, Repositories
### Controllers
- Thin only
- Parse input DTOs
- Call service layer
- Map domain errors to HTTP status codes
- No filesystem logic
- No gateway protocol logic

### Services
- Hold orchestration logic
- Coordinate repositories, compiler, gateway adapter, diff, and validation
- Return typed outputs
- Own transaction-like flows where needed

### Repositories
- Only persist/retrieve data
- No compiler logic
- No request/response formatting
- No cross-module orchestration

## DTO and Contract Rules
- All public API payloads must map to typed contracts from `packages/core-types/**`
- Validation must be enforced using schemas from `packages/schemas/**`
- Do not create ad hoc payload shapes in controllers
- DTOs should be narrow and explicit

## Error Handling Rules
- Use structured error classes
- Distinguish validation errors, not-found errors, conflict errors, deploy errors, gateway errors, and unexpected errors
- Never throw raw strings
- Never leak stack traces to clients in production
- Services should return enough structured information for diagnostics

## Compiler Rules
- Compilation must be deterministic
- Input entities -> output artifacts
- Keep compilers pure where possible
- `compile-openclaw-artifacts.ts` should not perform I/O directly
- File reads/writes belong to `read-workspace.ts` and `write-workspace.ts`
- Routing and skill compilation should stay isolated in `compile-routing.ts` and `compile-skills.ts`

## Deploy Rules
- Always support preview before apply
- Always support diff generation
- Separate draft state from deployed state
- Never apply changes without validated input
- Deploy layer must know exactly which files changed and why

## Logging and Diagnostics
- Gateway diagnostics must be traceable
- Workspace writes must be auditable
- Compiler errors must include entity context
- Use structured logs wherever possible

## Compatibility Rules
- Maintain compatibility with the existing dashboard runtime while Studio modules are introduced
- New backend modules must not break current health, diagnostics, logs, or state endpoints
- Prefer additive changes over invasive rewrites

## Naming and File Organization
- One responsibility per file where practical
- Group code by module, not by generic type only
- Keep exports explicit
- Avoid giant service files

## Minimum Quality Bar
- No endpoint without typed input/output
- No service without clear boundary
- No compiler side effects hidden inside domain logic
- No direct frontend assumptions in backend code
