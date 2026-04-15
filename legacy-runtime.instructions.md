# Legacy Runtime Instructions

## Scope
Applies to `backend/**` and `frontend/**` while legacy dashboard and new Studio coexist.

## Purpose
Ensure safe coexistence between existing runtime/dashboard and new Studio system.

## Core Principles
- Do not break production runtime
- Do not refactor legacy code aggressively
- Prefer additive integration
- Preserve backward compatibility

## Backend Rules
- Existing endpoints must remain stable
- Do not change response shapes of current APIs
- New Studio APIs must be namespaced or isolated
- Avoid modifying legacy services unless strictly necessary

## Frontend Rules
- Existing dashboard UI must remain functional
- New Studio UI must be isolated in its own routes/features
- Avoid global CSS conflicts

## Integration Strategy
- Introduce Studio as a parallel layer
- Gradually connect shared data where needed
- Do not tightly couple new code with legacy internals

## Runtime Protection
- Do not modify OpenClaw runtime behavior
- Do not introduce breaking changes to gateway communication
- Ensure new code cannot crash existing flows

## Deployment Safety
- Feature-flag new Studio functionality if needed
- Validate compatibility before enabling in production
- Maintain rollback paths

## Refactor Policy
- Refactor only when necessary
- Extract, do not rewrite
- Keep legacy modules stable

## Observability
- Monitor both legacy and new systems
- Log integration points clearly

## Minimum Safety Rules
- No breaking changes without fallback
- No shared mutable state without clear ownership
- No hidden coupling between Studio and legacy code
