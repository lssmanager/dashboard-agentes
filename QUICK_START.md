# Quick Start Guide: Markdown-Driven OpenClaw Studio

## What This Enables

👤 **Profile Designer** (Non-Developer):
- Edit `templates/profiles/chief-of-staff.md` to change description
- Edit `templates/profiles/chief-of-staff.json` to change skills/policies
- Restart API
- Profile automatically updated - no code changes needed

🏗️ **Workspace Creator** (Developer / UI):
```bash
POST /api/studio/v1/workspaces/bootstrap
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "My AI Executive",
    "owner": "ceo@company.com"
  }
}
```

Response: Fully configured WorkspaceSpec with profile defaults merged in!

🚀 **Deployment**:
```bash
POST /api/studio/v1/compile
```

Get: AGENTS.md, SOUL.md, TOOLS.md, USER.md, HEARTBEAT.md + all spec files ready to deploy.

---

## Three API Endpoints

### 1. GET /api/studio/v1/profiles

Get all available profiles.

**Response**:
```json
[
  {
    "id": "chief-of-staff",
    "name": "Chief of Staff",
    "description": "Operational orchestrator...",
    "defaultModel": "openai/gpt-5.4-mini",
    "defaultSkills": ["status.read", "tasks.manage", "notes.capture"],
    "defaultPolicies": ["safe-operator"],
    "routines": ["morning-brief", "eod-review", "followup-sweep", "task-prep"],
    ...
  },
  ...
]
```

**Use Case**: Display list of available templates in UI picker.

---

### 2. GET /api/studio/v1/routines

Get all routine templates.

**Response**:
```json
[
  {
    "id": "morning-brief",
    "name": "Morning Brief",
    "description": "Routine: Morning Brief",
    "promptTemplate": "# Morning Brief\n\nCollect active tasks...",
    "steps": []
  },
  ...
]
```

**Use Case**: Let users preview routine templates before creating workspace.

---

### 3. POST /api/studio/v1/workspaces/bootstrap

Create a workspace from profile or standalone spec.

**Input Option A - From Profile**:
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "My CEO Assistant",
    "owner": "jane@company.com",
    "description": "Manages priorities and follow-ups"
  }
}
```

**Input Option B - Standalone**:
```json
{
  "workspaceSpec": {
    "name": "Custom Workspace",
    "defaultModel": "openai/gpt-4",
    "skillIds": ["custom.skill"],
    "routines": ["custom-routine"]
  }
}
```

**Response** (HTTP 201):
```json
{
  "workspaceSpec": {
    "id": "my-ceo-assistant",
    "slug": "my-ceo-assistant",
    "name": "My CEO Assistant",
    "owner": "jane@company.com",
    "defaultModel": "openai/gpt-5.4-mini",
    "skillIds": ["status.read", "tasks.manage", "notes.capture"],
    "profileIds": ["chief-of-staff"],
    "routines": ["morning-brief", "eod-review", "followup-sweep", "task-prep"],
    "policyRefs": [{"id": "safe-operator", "scope": "workspace"}],
    "agentIds": [],
    "flowIds": [],
    "routingRules": [],
    "tags": [],
    "createdAt": "2026-04-15T10:30:00Z",
    "updatedAt": "2026-04-15T10:30:00Z"
  },
  "created": true,
  "message": "Workspace bootstrapped from profile 'chief-of-staff'",
  "timestamp": "2026-04-15T10:30:00Z"
}
```

**Merge Behavior**:

| Field | Profile? | Request | Result |
| --- | --- | --- | --- |
| defaultModel | ✅ gpt-5.4-mini | (none) | Uses profile default |
| defaultModel | ✅ gpt-5.4-mini | gpt-4 | **Uses request (wins)** |
| skillIds | ✅ [status.read, ...] | (none) | Uses profile defaults |
| skillIds | ✅ [status.read, ...] | [custom] | **Uses request (wins)** |
| owner | ❌ (none) | jane@company.com | **Uses request** |
| routines | ✅ [morning-brief, ...] | (none) | Uses profile routines |

**Golden Rule**: Request values always override profile values, which override system defaults.

---

## Add a New Profile (Zero Code)

### Step 1: Create Markdown
File: `templates/profiles/my-profile.md`

```markdown
# My Profile

## Purpose
This profile manages [domain] by [capability].

## Suggested Routines
- routine-1
- routine-2
```

### Step 2: Create JSON Config
File: `templates/profiles/my-profile.json`

```json
{
  "id": "my-profile",
  "name": "My Profile",
  "category": "engineering",
  "description": "Full description from above",
  "defaultModel": "openai/gpt-5.4-mini",
  "defaultSkills": ["skill1", "skill2", "skill3"],
  "defaultPolicies": ["policy1"],
  "routines": ["routine-1", "routine-2"],
  "tags": ["tag1", "tag2"],
  "visibility": "public",
  "priority": 1
}
```

### Step 3: Restart API
```bash
npm run dev:api
# or
pnpm run dev:api
```

### Step 4: Verify
```bash
curl http://localhost:3400/api/studio/v1/profiles | grep "my-profile"
```

✅ Done! Your profile is now available for workspace creation.

---

## Example Workflow

**Scenario**: Create CEO workspace from chief-of-staff profile

### 1. User selects profile
```bash
GET /api/studio/v1/profiles
```
Response: List of 7 profiles. User clicks "Chief of Staff".

### 2. User fills form
```
Workspace Name: "Jane's CEO Assistant"
Owner: "jane@company.com"
Description: "Handles daily priorities"
```

### 3. Create workspace
```bash
POST /api/studio/v1/workspaces/bootstrap
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "Jane's CEO Assistant",
    "owner": "jane@company.com",
    "description": "Handles daily priorities"
  }
}
```

### 4. Get workspace config
Response includes:
- ✅ skillIds from profile (status.read, tasks.manage, notes.capture)
- ✅ routines from profile (morning-brief, eod-review, followup-sweep, task-prep)
- ✅ policyRefs from profile (safe-operator)
- ✅ owner from user input (jane@company.com)

### 5. Compile to artifacts
```bash
POST /api/studio/v1/compile
```

Response: DeployableArtifact[] with:
- AGENTS.md - Agent definitions
- SOUL.md - Workspace description
- TOOLS.md - Skills/tools list
- USER.md - Owner info
- HEARTBEAT.md - Daily routine checklist
- *.spec.json - Config specs

### 6. Deploy
```bash
POST /api/studio/v1/deploy/apply
```

Artifacts written to `.openclaw-studio/` and ready for OpenClaw runtime.

---

## Error Scenarios

### Profile Not Found
```bash
POST /api/studio/v1/workspaces/bootstrap
{ "profileId": "nonexistent", "workspaceSpec": {"name": "Test"} }
```

Response (HTTP 404):
```json
{
  "error": "PROFILE_NOT_FOUND",
  "message": "Profile 'nonexistent' not found in markdown catalog",
  "profileId": "nonexistent"
}
```

**Fix**: Check `templates/profiles/` has matching `.md` and `.json` files.

### Missing Required Field
```bash
POST /api/studio/v1/workspaces/bootstrap
{ "profileId": "chief-of-staff", "workspaceSpec": {} }
```

Response (HTTP 400):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "workspaceSpec.name is required"
}
```

**Fix**: Add `"name"` field to workspaceSpec.

### Bad JSON Sidecar
If `templates/profiles/chief-of-staff.json` is malformed:

Response on any profile endpoint (HTTP 500):
```json
{
  "error": "Failed to load profiles",
  "details": "Failed to read or parse profile sidecar: .../chief-of-staff.json"
}
```

**Fix**: Check JSON syntax. ID in JSON must match filename.

---

## Field Reference

### ProfileSpec Fields
- `id`: Unique identifier (matches filename)
- `name`: Display name
- `category`: Type (operations, support, engineering, monitoring)
- `description`: What this profile does
- `defaultModel`: Default LLM model
- `defaultSkills`: Skills this profile includes
- `defaultPolicies`: Policies to bind
- `routines`: Routine IDs to include
- `tags`: Search tags
- `visibility`: public/private
- `priority`: Sort order (1 = highest)

### WorkspaceSpec Fields (Relevant for Bootstrap)
- `id`: Auto-generated from name if not provided
- `name`: **REQUIRED**
- `owner`: Who owns this workspace
- `description`: What it does
- `defaultModel`: Primary LLM (from profile or request)
- `skillIds`: Capabilities (from profile or request)
- `profileIds`: Which profiles applied here (auto from profileId param)
- `routines`: Routine IDs (from profile or request)
- `policyRefs`: Constraints (from profile or request)
- `agentIds`: Agent IDs (separate creation, not auto-populated)

---

## Caching & Performance

- **First load**: ~50ms (reads markdown + validates)
- **Cached responses**: ~1ms
- **Cache lifetime**: Service instance lifetime (until restart)
- **Manual invalidation**: Not needed for normal use

---

## Troubleshooting

### "Profiles endpoint returns []"
- Check `templates/profiles/` exists
- Check at least one `.md` + `.json` pair exists
- Check JSON file has matching ID: `"id": "chief-of-staff"`
- Check `.md` files in same directory

### "Routines endpoint returns []"
- Check `templates/workspaces/chief-of-staff/routines/` exists
- Check `.md` files present (morning-brief.md, etc.)
- Check heading format `# Routine Name` on first line

### "Bootstrap returns 'Profile not found'"
- Copy exact profileId from GET /profiles response
- Ensure `templates/profiles/{id}.md` exists
- Ensure `templates/profiles/{id}.json` with matching ID exists

### "Compilation fails with diagnostics"
- Check referenced agentIds/skillIds exist in system
- Check all policyRefs point to real policies
- See POST /compile response for detailed error list

---

## API Contract Summary

| Endpoint | Method | Input | Output | Errors |
| --- | --- | --- | --- | --- |
| /profiles | GET | - | ProfileSpec[] | 500 if markdown fails |
| /routines | GET | - | RoutineSpec[] | 500 if routines dir missing |
| /workspaces/bootstrap | POST | {profileId?, workspaceSpec} | {workspaceSpec, created, message} | 400 (validation), 404 (profile not found) |
| /compile | POST | - | {artifacts[], diagnostics[]} | 422 if validation errors |

---

## Key Concepts

**Profile**: Reusable preset template
- Defines default skills, policies, routines
- Applied to workspace at creation time
- Can be overridden at workspace level

**Workspace**: Instance with specific name/owner
- Created from profile OR standalone
- Merge order ensures customization works
- Compiled to OpenClaw artifacts

**Routine**: Repeatable task template
- Stored as markdown (promptTemplate)
- Referenced by profile
- Included in HEARTBEAT.md at deployment

**Artifact**: Deployable file (AGENTS.md, etc.)
- Generated by compile step
- Written to disk by deploy step
- Sent to OpenClaw runtime

---

## Next Level: Customization

### Override Profile Skills
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "Custom CEO",
    "skillIds": ["custom.skill", "status.read"]  ← Override!
  }
}
```

### Add Extra Routines
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "Enhanced CEO",
    "routines": [
      "morning-brief",          ← From profile
      "eod-review",             ← From profile
      "custom-review-routine"   ← Add custom
    ]
  }
}
```

### Create Without Profile
```json
{
  "workspaceSpec": {
    "name": "Research Assistant",
    "defaultModel": "openai/gpt-4",
    "skillIds": ["research.web", "analysis.data"],
    "routines": ["research-prep", "analyze-findings"]
  }
}
```

---

## Support & Resources

- **Test cases**: See TEST_IMPLEMENTATION.md for 8 detailed scenarios
- **Full guide**: IMPLEMENTATION_SUMMARY.md for architecture details
- **Source**: packages/profile-engine/src/loaders/ for loader implementations
