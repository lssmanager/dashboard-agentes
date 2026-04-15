# Implementation Verification Guide

## Overview

This guide verifies that the markdown-to-typed-entities pipeline is correctly implemented.

### Architecture Summary

```
templates/profiles/*.md + *.json
    └─> packages/profile-engine/loaders/load-profile-markdown.ts
        └─> ProfileSpec (typed)

templates/workspaces/chief-of-staff/routines/*.md
    └─> packages/profile-engine/loaders/load-routines-catalog.ts
        └─> RoutineSpec[] (typed with promptTemplate)

API Endpoints:
  GET  /api/studio/v1/profiles          → ProfilesService.getAll()
  GET  /api/studio/v1/routines          → RoutinesService.getAll()
  POST /api/studio/v1/workspaces/bootstrap → WorkspacesService.bootstrap()
  POST /api/studio/v1/compile           → compileOpenClawWorkspace()
```

---

## Test Cases

### TC1: Load Profiles from Markdown

**Endpoint**: `GET /api/studio/v1/profiles`

**Expected Response** (HTTP 200):
```json
[
  {
    "id": "chief-of-staff",
    "name": "Chief of Staff",
    "description": "Operational orchestrator profile...",
    "category": "operations",
    "defaultModel": "openai/gpt-5.4-mini",
    "defaultSkills": ["status.read", "tasks.manage", "notes.capture"],
    "defaultPolicies": ["safe-operator"],
    "routines": ["morning-brief", "eod-review", "followup-sweep", "task-prep"],
    "tags": ["orchestration", "follow-ups", "leadership"],
    "visibility": "public",
    "priority": 1
  },
  ...
]
```

**Validation**:
- ✅ Each profile has `id`, `name`, `description`
- ✅ Profile contains fields from both `.md` (description) + `.json` (defaultModel, defaultSkills, etc.)
- ✅ All 7 profiles loaded (chief-of-staff, daily-task-manager, dev-agent, executive-assistant, monitoring-agent, orchestrator, relationship-manager)

---

### TC2: Load Routines from Markdown

**Endpoint**: `GET /api/studio/v1/routines`

**Expected Response** (HTTP 200):
```json
[
  {
    "id": "morning-brief",
    "name": "Morning Brief",
    "description": "Routine: Morning Brief",
    "promptTemplate": "# Morning Brief\n\n[full markdown content...]",
    "steps": []
  },
  {
    "id": "eod-review",
    "name": "End of Day Review",
    "description": "Routine: End of Day Review",
    "promptTemplate": "# End of Day Review\n\n[full markdown content...]",
    "steps": []
  },
  ...
]
```

**Validation**:
- ✅ Each routine has `id`, `name`, `promptTemplate` (full markdown content as string)
- ✅ `name` extracted from heading (`# Morning Brief` → "Morning Brief")
- ✅ All 4 chief-of-staff routines loaded (morning-brief, eod-review, followup-sweep, task-prep)
- ✅ No parsing of markdown content - it's raw promptTemplate

---

### TC3: Bootstrap Workspace from Profile

**Endpoint**: `POST /api/studio/v1/workspaces/bootstrap`

**Request Body**:
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "My CEO Workspace",
    "owner": "jane@company.com"
  }
}
```

**Expected Response** (HTTP 201):
```json
{
  "workspaceSpec": {
    "id": "my-ceo-workspace",
    "slug": "my-ceo-workspace",
    "name": "My CEO Workspace",
    "description": null,
    "owner": "jane@company.com",
    "defaultModel": "openai/gpt-5.4-mini",
    "agentIds": [],
    "skillIds": ["status.read", "tasks.manage", "notes.capture"],
    "flowIds": [],
    "profileIds": ["chief-of-staff"],
    "policyRefs": [
      { "id": "safe-operator", "scope": "workspace" }
    ],
    "routingRules": [],
    "routines": ["morning-brief", "eod-review", "followup-sweep", "task-prep"],
    "tags": [],
    "createdAt": "2026-04-15T...",
    "updatedAt": "2026-04-15T..."
  },
  "created": true,
  "message": "Workspace bootstrapped from profile 'chief-of-staff'",
  "timestamp": "2026-04-15T..."
}
```

**Validation - Merge Order**:
- ✅ `skillIds` populated from profile.defaultSkills (["status.read", "tasks.manage", "notes.capture"])
- ✅ `policyRefs` converted from profile.defaultPolicies string[] to WorkspacePolicyRef[]
- ✅ `routines` populated from profile.routines (["morning-brief", ...])
- ✅ `profileIds` set to [profileId] from request
- ✅ `owner` from request workspaceSpec (not overridden by profile)
- ✅ `defaultModel` from profile as fallback (not in request)
- ✅ `id` + `slug` auto-generated from workspace name

**Test Merge Order Override**:
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "Custom Workspace",
    "defaultModel": "custom/model-x",
    "skillIds": ["custom.skill"]
  }
}
```

Expected: `defaultModel` and `skillIds` from request should override profile defaults.
Response should include:
```json
{
  "defaultModel": "custom/model-x",
  "skillIds": ["custom.skill"],
  "routines": ["morning-brief", ...] // from profile, not overridden
}
```

---

### TC4: Bootstrap Without Profile

**Endpoint**: `POST /api/studio/v1/workspaces/bootstrap`

**Request Body**:
```json
{
  "workspaceSpec": {
    "name": "Standalone Workspace",
    "defaultModel": "openai/gpt-4",
    "skillIds": ["search.web", "file.read"],
    "routines": ["custom-routine"]
  }
}
```

**Expected Response** (HTTP 201):
```json
{
  "workspaceSpec": {
    "id": "standalone-workspace",
    "slug": "standalone-workspace",
    "name": "Standalone Workspace",
    "defaultModel": "openai/gpt-4",
    "skillIds": ["search.web", "file.read"],
    "routines": ["custom-routine"],
    "profileIds": [],
    "policyRefs": [],
    ...
  },
  "created": true,
  "message": "Workspace created from specification",
  "timestamp": "2026-04-15T..."
}
```

**Validation**:
- ✅ Works without profileId
- ✅ Request spec values used directly (no profile override)
- ✅ System defaults for missing fields (createdAt, updatedAt, tags=[])

---

### TC5: Compile Workspace to OpenClaw Artifacts

**Endpoint**: `POST /api/studio/v1/compile`

**Request Body** (after bootstrap):
```json
{
  "workspaceId": "my-ceo-workspace"
}
```

**Expected Response** (HTTP 200):
```json
{
  "artifacts": [
    {
      "id": "my-ceo-workspace:agents-md",
      "type": "prompt-file",
      "name": "AGENTS.md",
      "path": "AGENTS.md",
      "mediaType": "text/markdown",
      "content": "# AGENTS\n\n[agent definitions...]",
      "sourceHash": "sha256-hash"
    },
    {
      "id": "my-ceo-workspace:soul-md",
      "type": "prompt-file",
      "name": "SOUL.md",
      "path": "SOUL.md",
      "content": "# SOUL\n\n[workspace soul...]",
      "sourceHash": "sha256-hash"
    },
    {
      "id": "my-ceo-workspace:tools-md",
      "type": "prompt-file",
      "name": "TOOLS.md",
      "path": "TOOLS.md",
      "content": "# TOOLS\n\n[skills list...]",
      "sourceHash": "sha256-hash"
    },
    {
      "id": "my-ceo-workspace:user-md",
      "type": "prompt-file",
      "name": "USER.md",
      "path": "USER.md",
      "content": "# USER\n\nWorkspace: My CEO Workspace\nOwner: jane@company.com",
      "sourceHash": "sha256-hash"
    },
    {
      "id": "my-ceo-workspace:heartbeat-md",
      "type": "prompt-file",
      "name": "HEARTBEAT.md",
      "path": "HEARTBEAT.md",
      "content": "# HEARTBEAT\n\n- [ ] morning-brief\n- [ ] eod-review\n- [ ] followup-sweep\n- [ ] task-prep",
      "sourceHash": "sha256-hash"
    },
    // ... spec files (.spec.json) ...
  ],
  "diagnostics": []
}
```

**Validation**:
- ✅ Artifact type: prompt-file, routing, workspace, agent, skill, flow, profile, policy
- ✅ All 7 templates generated (AGENTS.md, SOUL.md, TOOLS.md, USER.md, HEARTBEAT.md + .spec.json files)
- ✅ sourceHash auto-calculated for each artifact
- ✅ diagnostics[] empty (no validation errors)

---

### TC6: Error Handling - Profile Not Found

**Endpoint**: `POST /api/studio/v1/workspaces/bootstrap`

**Request Body** (invalid profileId):
```json
{
  "profileId": "nonexistent-profile",
  "workspaceSpec": {
    "name": "Test Workspace"
  }
}
```

**Expected Response** (HTTP 404):
```json
{
  "error": "PROFILE_NOT_FOUND",
  "message": "Profile 'nonexistent-profile' not found in markdown catalog",
  "profileId": "nonexistent-profile",
  "timestamp": "2026-04-15T..."
}
```

---

### TC7: Error Handling - Missing Required Fields

**Endpoint**: `POST /api/studio/v1/workspaces/bootstrap`

**Request Body** (missing name):
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {}
}
```

**Expected Response** (HTTP 400):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "workspaceSpec.name is required"
}
```

---

### TC8: Error Handling - Invalid JSON Response

**Endpoint**: `GET /api/studio/v1/profiles`

**If markdown files are corrupted/missing**:

**Expected Response** (HTTP 500):
```json
{
  "error": "Failed to load profiles",
  "details": "Failed to read profile markdown: ..."
}
```

---

## File Structure Verification

Verify these files exist and are correctly implemented:

```
packages/profile-engine/
  src/
    loaders/
      ├── index.ts (exports all loaders)
      ├── load-profile-markdown.ts ✅ (reads .md + .json, merges, returns ProfileSpec)
      ├── load-profiles-catalog.ts ✅ (scans templates/profiles/, returns ProfileSpec[])
      ├── load-routine-markdown.ts ✅ (reads .md, extracts heading + content)
      └── load-routines-catalog.ts ✅ (NEW - scans routines folder, returns RoutineSpec[])

templates/
  profiles/
    ├── chief-of-staff.md ✅
    ├── chief-of-staff.json ✅
    ├── daily-task-manager.md ✅
    ├── daily-task-manager.json ✅
    ├── dev-agent.md ✅
    ├── dev-agent.json ✅
    ├── executive-assistant.md ✅
    ├── executive-assistant.json ✅
    ├── monitoring-agent.md ✅
    ├── monitoring-agent.json ✅
    ├── orchestrator.md ✅
    ├── orchestrator.json ✅
    ├── relationship-manager.md ✅
    └── relationship-manager.json ✅

  workspaces/
    chief-of-staff/
      routines/
        ├── morning-brief.md ✅
        ├── eod-review.md ✅
        ├── followup-sweep.md ✅
        └── task-prep.md ✅

apps/api/src/modules/
  profiles/
    ├── profiles.service.ts ✅ (UPDATED - uses markdown loader)
    └── profiles.controller.ts ✅ (UPDATED - async endpoint)

  routines/
    ├── routines.service.ts ✅ (UPDATED - uses markdown loader)
    └── routines.controller.ts ✅ (UPDATED - async endpoint)

  workspaces/
    ├── workspaces.service.ts ✅ (UPDATED - added bootstrap() method)
    └── workspaces.controller.ts ✅ (UPDATED - added POST /workspaces/bootstrap)
```

---

## Running the Tests

### Unit Tests (if TypeScript compiler is available)

```bash
npm run build
npm run test

# Or with pnpm/yarn
pnpm run build
pnpm run test
```

### Manual API Testing

1. **Start the API**:
   ```bash
   npm run dev:api
   # or
   pnpm run dev:api
   ```

2. **Test GET /profiles**:
   ```bash
   curl http://localhost:3400/api/studio/v1/profiles
   ```

3. **Test GET /routines**:
   ```bash
   curl http://localhost:3400/api/studio/v1/routines
   ```

4. **Test POST /workspaces/bootstrap**:
   ```bash
   curl -X POST http://localhost:3400/api/studio/v1/workspaces/bootstrap \
     -H "Content-Type: application/json" \
     -d '{
       "profileId": "chief-of-staff",
       "workspaceSpec": {
         "name": "Test CEO Workspace",
         "owner": "test@example.com"
       }
     }'
   ```

5. **Test POST /compile**:
   ```bash
   curl -X POST http://localhost:3400/api/studio/v1/compile
   ```

---

## Definition of Done Checklist

- [x] Markdown loaders read `.md` files from `templates/`
- [x] Markdown loaders merge with `.json` sidecars to create ProfileSpec
- [x] `GET /profiles` returns ProfileSpec[] from markdown (not hardcoded)
- [x] `GET /routines` returns RoutineSpec[] with promptTemplate from markdown
- [x] `POST /workspaces/bootstrap` accepts profileId + WorkspaceSpec
- [x] Merge order implemented: request > profile defaults > system defaults
- [x] Profile not found error handling (HTTP 404)
- [x] Validation error handling for missing fields (HTTP 400/422)
- [x] Workspace compilation generates correct OpenClaw artifacts
- [x] All endpoints properly typed and validated with Zod schemas
- [x] Cache invalidation support for reloading profiles/routines
- [x] Async/await properly handled in controllers
- [x] No hardcoded profiles in code (all from markdown)

---

## Adding a New Profile

To add a new profile without code changes:

1. **Create `templates/profiles/new-profile.md`**:
   ```markdown
   # New Profile

   ## Purpose
   Description of what this profile does.

   ## Suggested Routines
   - routine-1
   - routine-2
   ```

2. **Create `templates/profiles/new-profile.json`**:
   ```json
   {
     "id": "new-profile",
     "name": "New Profile",
     "category": "engineering",
     "defaultModel": "openai/gpt-5.4-mini",
     "defaultSkills": ["skill.1", "skill.2"],
     "defaultPolicies": ["policy.1"],
     "routines": ["routine-1", "routine-2"],
     "tags": ["tag1", "tag2"]
   }
   ```

3. **Restart API** (or trigger hot-reload):
   ```bash
   npm run dev:api
   ```

4. **Verify**:
   ```bash
   curl http://localhost:3400/api/studio/v1/profiles | grep "new-profile"
   ```

The profile is now available without modifying any TypeScript code!

---

## Architecture Decision Record

### Why Markdown + JSON Sidecars?

- **Markdown** is human-friendly for documentation (Purpose, Behaviors, Instructions)
- **JSON** is machine-friendly for structured metadata (defaultModel, defaultSkills, policies)
- **Separation** allows profiles to be edited by non-developers (markdown) separately from config (JSON)
- **Fallback** - JSON is the source of truth for schema-critical fields

### Why Load at Runtime vs Build Time?

- **Runtime** allows hot-reloading profiles without restarting API
- **Caching** improves performance after first load
- **Flexibility** - profiles can be swapped by editing files, not redeploying code
- **Scalability** - new profiles added to `templates/` without code changes

### Profile vs Workspace vs Routine

- **Profile**: Reusable preset with roles, skills, policies, routines
- **Workspace**: Instance of a profile with customization (owner, name, context)
- **Routine**: Scheduled task template with promptTemplate for execution

---

## Next Steps & Extensions

1. **File Watcher**: Detect markdown changes and invalidate cache
2. **UI Integration**: Profile selector in frontend, workspace creation form
3. **Profile Versioning**: Support multiple versions of same profile
4. **Routine Scheduling**: Parse `schedule` field and integrate with cron
5. **Profile Publishing**: Marketplace for sharing profiles
