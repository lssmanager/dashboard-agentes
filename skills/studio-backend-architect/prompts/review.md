# Review Prompt
Review backend changes for Studio architecture correctness and safety.

## Checklist
- Canonical model preserved: Agency -> Department -> Workspace -> Agent -> Subagent
- Inbound execution limited to Agency/Department/Workspace
- Runtime topology actions are real and validated
- Propagation is bidirectional and loop-safe
- Diff/apply/rollback behavior remains intact
- Observability/replay contracts remain coherent
- API/UI contracts stay aligned
- Tests cover behavior changes
- Docs updated for entity model changes

## Output format
1. Findings by severity
2. Contract mismatches
3. Missing tests
4. Required follow-up changes
