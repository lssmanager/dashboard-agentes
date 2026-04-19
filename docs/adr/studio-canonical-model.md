# OpenClaw Studio — Canonical Model

## Purpose
This document defines the canonical hierarchy and behavioral model for Studio.

Studio is not a simple agent editor.
It is a multi-level builder, runtime control plane, and observability surface for an Agency.

## Runtime boundary
Studio models and controls conversational runtime concepts, but it must not duplicate the full OpenClaw runtime engine.

Architecture split:
- OpenClaw: assistant gateway, channel runtime, session runtime
- Studio: control plane, builder, topology, observability, diff manager

Required layer separation:
1. Model Provider Layer (OpenAI/Anthropic/Google/local models) for inference/tool-calling/streaming.
2. Agent Runtime/Manager Layer (OpenClaw and future runtime adapters) for sessions, state, routing, handoffs, orchestration, topology controls, approvals, retries, observability, replay.
3. Studio Control Plane Layer for builder/topology/debug/replay/diff workflows.

Provider integrations are not runtime-manager integrations.
Adding model provider X is not equivalent to supporting a new agent runtime/manager.

Allowed in Studio:
- ChannelBinding model
- SessionRef / SessionState model
- Runtime capability matrix
- TopologyLink state
- Read-only runtime/session/channel inspection
- Fail-closed runtime controls when unsupported
- Runtime adapter interface + registry + concrete provider adapters

Not allowed in Studio:
- rebuilding conversational gateway logic
- implementing channel transport
- duplicating full assistant session loop
- recreating OpenClaw runtime internals
- hard-coupling control-plane services to a concrete gateway implementation

## Canonical hierarchy
Agency
  Department
    Workspace
      Agent
        Subagent

## Trigger levels
Only these levels can receive direct inbound messages and trigger execution:
- Agency
- Department
- Workspace

Agents and Subagents execute delegated work only.

## Agency
Agency is the top-level sandbox.
Nothing operates outside it.

Agency responsibilities:
- top-level routing
- global skills/tools catalog
- global policies
- global memory scope
- cross-department governance

## Department
Department is an organizational layer inside Agency.

Examples:
- Marketing
- HR
- Accountant
- Development
- Cybersecurity
- Automation

Department responsibilities:
- receive direct or upstream requests
- route to Workspaces
- connect to other Departments inside the same Agency

## Workspace
Workspace is the operational execution layer.

Workspace responsibilities:
- receive direct or upstream requests
- route to Agents/Subagents
- hold internal execution graph
- connect to other Workspaces or Departments inside the same Agency

## Agent
Agent is the main delegated worker inside a Workspace.

## Subagent
Subagent is a specialized worker under an Agent.

## Skills and Tools
Skills and Tools are cross-cutting capabilities.
They live in an Agency-level catalog.

They are assigned by reference and can shape:
- identity
- behavior
- tasks
- routing
- memory
- heartbeat
- handoffs

## Bidirectional propagation
Studio must support both:
- top-down propagation
- bottom-up refinement

Top-down examples:
- Agency catalog references used in Department/Workspace/Agent/Subagent
- Workspace defaults inherited by Agents

Bottom-up examples:
- Subagent refinement proposes updates to Agent profile
- Agent refinement proposes updates to Workspace profile
- Workspace changes propose updates to Department or Agency docs/config

## Core files affected
Studio may affect or propose diffs for:
- BOOTSTRAP
- IDENTITY
- TOOLS
- USER
- HEARTBEAT
- MEMORY
- SOUL
- AGENT.md / AGENTS.md

## Required lifecycle
All important changes must follow:
1. preview
2. diff proposal
3. apply
4. rollback

## Studio surfaces
Studio is composed of:
1. Agency Builder / Setup Helper
2. Agency Topology
3. Workspace Studio
4. Builder Agent Function
5. Observability / Debug / Replay
6. Core Files Diff / Apply / Rollback

## Runtime topology rules
Connections inside an Agency are real runtime controls.

Supported actions:
- connect
- disconnect
- pause
- reactivate
- redirect
- continue

If runtime support is missing, topology actions must fail closed:
- do not simulate success
- do not mutate runtime state as if action succeeded
- return explicit status `unsupported_by_runtime`

## API contracts (compat + adapter)
Canonical state is introduced by compatibility adapter, without replacing legacy state abruptly.

Read contracts:
- `GET /api/studio/v1/studio/state` (legacy)
- `GET /api/studio/v1/studio/canonical-state` (canonical, adapter-based)

Topology runtime controls:
- `POST /api/studio/v1/topology/connect`
- `POST /api/studio/v1/topology/disconnect`
- `POST /api/studio/v1/topology/pause`
- `POST /api/studio/v1/topology/reactivate`
- `POST /api/studio/v1/topology/redirect`
- `POST /api/studio/v1/topology/continue`

Core-files lifecycle façade:
- `GET /api/studio/v1/corefiles/preview`
- `GET /api/studio/v1/corefiles/diff`
- `POST /api/studio/v1/corefiles/apply`
- `POST /api/studio/v1/corefiles/rollback`

## Loop prevention
Studio must prevent infinite loops in:
- UI validation
- runtime execution

## Product invariant
Any implementation that collapses Studio into a simple single-agent editor is incorrect.
