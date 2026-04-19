# Entity Model Reference

Canonical hierarchy:
- Agency
- Department
- Workspace
- Agent
- Subagent

Key backend targets:
- AgencySpec
- DepartmentSpec
- WorkspaceSpec
- AgentSpec
- SubagentSpec (or AgentSpec(kind=subagent))
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

Rules:
- Only Agency, Department, Workspace accept direct inbound messages
- Agents and Subagents execute delegated work only
- Department/Workspace links must remain within the same Agency
- Keep model naming consistent across API contracts and package schemas
