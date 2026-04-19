# Backend Scope Reference

Primary write scope:
- apps/api/src/modules/**
- packages/**

Out of scope by default:
- Frontend redesign in apps/web/**

Allowed frontend touch:
- Minimal contract-alignment updates when backend contract changes require UI adaptation

Delivery requirements:
- Declare contract changes explicitly
- Provide an implementation plan before large refactors
- List touched files
- Add or update tests for behavior changes
- Update docs for entity model changes
- Enforce loop prevention in runtime orchestration and validation
