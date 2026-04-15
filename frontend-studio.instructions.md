# Frontend Studio Instructions

## Scope
Applies to `apps/web/**`.

## Purpose
Define how to build a structured, scalable visual editor for OpenClaw Studio using React, TypeScript, Tailwind, React Flow, Zod, and React Hook Form.

## Core Principles
- UI must represent real system entities, not mock abstractions
- Every visual decision must be serializable
- All forms must map to typed contracts
- Do not embed business logic in components
- The frontend must consume backend APIs only

## Architecture Rules
- Organize by feature: `studio`, `workspaces`, `agents`, `flows`, `skills`, `profiles`, `routing`, `diagnostics`, `sessions`
- Each feature must contain pages and components
- No global uncontrolled state; use scoped state per feature

## React Flow Rules
- FlowCanvas must use a normalized node/edge structure
- Nodes must map to FlowSpec
- Do not store raw React Flow state as source of truth
- Convert UI state to FlowSpec before persistence
- Keep node config minimal and serializable

## Form Rules
- Use React Hook Form for all forms
- Use Zod schemas aligned with backend schemas
- No uncontrolled forms
- Validation must run before submission
- Errors must be surfaced clearly in UI

## Component Design
- Components must be presentational where possible
- Containers/pages handle data fetching and mutations
- Avoid deeply nested prop chains; use composition
- Keep components small and focused

## Studio Layout
- StudioPage is the main entry
- StudioSidebar handles navigation
- StudioCanvas handles main editing
- StudioInspector handles selection editing
- StudioToolbar handles actions

## Serialization Rules
- All changes must result in updated typed objects (AgentSpec, FlowSpec, etc.)
- Never rely on UI-only state for persistence
- Always convert to canonical model before saving

## API Interaction
- All API calls go through a centralized client
- Use typed responses
- Handle loading, success, and error states explicitly

## Performance Rules
- Avoid unnecessary re-renders in canvas
- Memoize node renderers where needed
- Lazy load heavy panels

## Styling Rules
- Use Tailwind only
- Avoid inline styles
- Keep design consistent across features

## Compatibility Rules
- Do not break existing dashboard views
- New Studio features must coexist safely

## Minimum Quality Bar
- No component without clear purpose
- No form without validation
- No canvas without serialization
- No API call without error handling
