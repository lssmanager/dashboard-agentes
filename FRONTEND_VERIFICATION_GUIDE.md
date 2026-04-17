# Frontend Canonical Bootstrap Alignment - Verification Guide

## Overview
This document verifies that the frontend has been fully aligned with the backend's canonical bootstrap flow:
- **No frontend merge logic** (backend owns merge order: request > profile > defaults)
- **Clean payload** (only user-edited fields sent to bootstrap)
- **Backend result as source of truth** (workspace state reflects backend response)
- **Complete E2E flow** (profiles → bootstrap → compile → preview/diff → apply)

---

## PART 1: UI Flow Walkthrough

### Step 1.1: Start the Application
```bash
# Terminal 1: Backend
cd apps/api
npm run dev  # Starts on http://localhost:3400

# Terminal 2: Frontend
cd apps/web
npm run dev  # Starts on http://localhost:3001
```

### Step 1.2: Navigate to Workspaces Page
1. Open browser: `http://localhost:3001`
2. Navigate to **Workspaces** page
3. Verify you see:
   - ✅ **Profile Selector** with real profiles loaded from API (not hardcoded)
   - ✅ **WorkspaceEditor form** with:
     - Profile dropdown (required)
     - Workspace Name input (required)
     - AI Model input (optional, shows hint about profile default)
     - Profile info box showing: Name, Description, Default Model, Skills, Routines
     - Blue note: "These profile values will be applied by the backend if you don't override them"
   - ✅ **WorkspaceList** showing "No workspace yet"

### Step 1.3: Create Workspace with Profile Defaults (Test Case 1)
**Scenario**: User selects profile WITHOUT overriding anything

1. Select profile: **chief-of-staff**
2. Enter workspace name: **test-ops-1**
3. Leave **AI Model** field EMPTY (don't enter anything)
4. Click **"Create with Bootstrap"**

**Verification in UI**:
- Wait for success message
- WorkspaceList should update to show:
  - ✅ Name: `test-ops-1`
  - ✅ Slug: `test-ops-1`
  - ✅ Model: `gpt-4-turbo` (from profile, NOT from request)
  - ✅ Skills: `[skill-1, skill-2, ...]` (from profile)
  - ✅ Routines: `[morning-brief, eod-review, ...]` (from profile)
  - ✅ Blue box: "values above are from backend merge"

**Critical Check**:
- ⚠️ The Model, Skills, and Routines should be the **profile's defaults**, not empty
- This proves backend merged them correctly
- Frontend did NOT inject them

### Step 1.4: Create Workspace with Model Override (Test Case 2)
**Scenario**: User selects profile AND overrides the AI Model

1. Select profile: **dev-agent**
2. Enter workspace name: **test-dev-1**
3. Enter AI Model: **custom/gpt-5-latest**
4. Click **"Create with Bootstrap"**

**Verification in UI**:
- WorkspaceList should show:
  - ✅ Name: `test-dev-1`
  - ✅ Model: `custom/gpt-5-latest` (from request, overrides profile)
  - ✅ Skills: `[...]` (from profile default, not overridden)
  - ✅ Routines: `[...]` (from profile default, not overridden)

**Critical Check**:
- User-provided model should be used
- But skills + routines should still come from profile
- Proves merge order: request > profile > defaults

---

## PART 2: Network Inspection

### Step 2.1: Open Browser DevTools
1. Press **F12** or **Ctrl+Shift+I** to open DevTools
2. Go to **Network** tab
3. Filter by **XHR** (fetch requests)

### Step 2.2: Inspect Bootstrap Payload (Test Case 1)
Execute Test Case 1 from Part 1 again, but watch the Network tab.

**Find**: Request to `POST /api/studio/v1/workspaces/bootstrap`

**Expected Payload** (NO profile defaults):
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "test-ops-1",
    "agentIds": [],
    "flowIds": [],
    "policyIds": []
    // ⚠️ NO defaultModel field
    // ⚠️ NO skillIds field
    // ⚠️ NO routines field
  }
}
```

**❌ WRONG Payload** (if you see this, frontend merge logic wasn't removed):
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "test-ops-1",
    "defaultModel": "gpt-4-turbo",        // ❌ WRONG - frontend merged
    "skillIds": ["skill-1", "skill-2"],   // ❌ WRONG - frontend merged
    "routines": ["morning-brief", ...],   // ❌ WRONG - frontend merged
    "agentIds": [],
    "flowIds": [],
    "policyIds": []
  }
}
```

### Step 2.3: Inspect Response (Bootstrap)
Same request, check **Response** tab.

**Expected Response**:
```json
{
  "workspaceSpec": {
    "id": "test-ops-1",
    "slug": "test-ops-1",
    "name": "test-ops-1",
    "defaultModel": "gpt-4-turbo",       // ✅ From profile default
    "skillIds": ["skill-1", "skill-2"],  // ✅ From profile default
    "routines": ["morning-brief", ...],  // ✅ From profile default
    "agentIds": [],
    "flowIds": [],
    "profileIds": ["chief-of-staff"],    // ✅ Track profile used
    ...
  },
  "created": true,
  "message": "Workspace created successfully",
  "timestamp": "2026-04-16T10:30:45Z"
}
```

**Critical**: The response shows **merged values** that backend resolved.

### Step 2.4: Inspect Bootstrap Payload (Test Case 2 - With Override)
Execute Test Case 2 from Part 1, watch Network tab.

**Expected Payload** (WITH user-provided model):
```json
{
  "profileId": "dev-agent",
  "workspaceSpec": {
    "name": "test-dev-1",
    "defaultModel": "custom/gpt-5-latest",  // ✅ User override is sent
    "agentIds": [],
    "flowIds": [],
    "policyIds": []
    // ⚠️ Still NO skillIds (frontend didn't merge)
    // ⚠️ Still NO routines (frontend didn't merge)
  }
}
```

**Expected Response**:
```json
{
  "workspaceSpec": {
    "id": "test-dev-1",
    "defaultModel": "custom/gpt-5-latest",    // ✅ User override respected
    "skillIds": ["skill-1", "skill-2"],       // ✅ From profile default
    "routines": ["routine-1", "routine-2"],   // ✅ From profile default
    ...
  },
  ...
}
```

**Critical**:
- User's override IS in the request
- But skillIds/routines NOT in request (frontend didn't inject)
- Backend merged profile defaults for those fields

---

## PART 3: CLI Verification

### Step 3.1: Test Bootstrap Without Model Override
```bash
curl -X POST http://localhost:3400/api/studio/v1/workspaces/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "chief-of-staff",
    "workspaceSpec": {
      "name": "cli-test-1",
      "agentIds": [],
      "flowIds": [],
      "policyIds": []
    }
  }' | jq '.'
```

**Expected** (check response):
- ✅ `defaultModel` is set (from profile)
- ✅ `skillIds` is array (from profile)
- ✅ `routines` is array (from profile)
- ✅ `profileIds` includes "chief-of-staff"

### Step 3.2: Test Bootstrap WITH Model Override
```bash
curl -X POST http://localhost:3400/api/studio/v1/workspaces/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "dev-agent",
    "workspaceSpec": {
      "name": "cli-test-2",
      "defaultModel": "my-custom-model/gpt-6",
      "agentIds": [],
      "flowIds": [],
      "policyIds": []
    }
  }' | jq '.workspaceSpec'
```

**Expected** (check response):
- ✅ `defaultModel` is "my-custom-model/gpt-6" (request override)
- ✅ `skillIds` is array (from profile, not request)
- ✅ `routines` is array (from profile, not request)

### Step 3.3: Test Full E2E Flow (CLI)
```bash
# 1. Get profiles
echo "=== GET /profiles ==="
curl http://localhost:3400/api/studio/v1/profiles | jq '.[] | {id, name}'

# 2. Bootstrap with profile
echo -e "\n=== POST /bootstrap ==="
BOOTSTRAP=$(curl -s -X POST http://localhost:3400/api/studio/v1/workspaces/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "profileId":"orchestrator",
    "workspaceSpec":{"name":"e2e-test","agentIds":[],"flowIds":[],"policyIds":[]}
  }')
echo "$BOOTSTRAP" | jq '.workspaceSpec | {id, defaultModel, skillIds, routines}'

# 3. Get deploy preview
echo -e "\n=== GET /deploy/preview ==="
curl http://localhost:3400/api/studio/v1/deploy/preview | jq '.diff | map({path, status})'

# 4. Get studio state
echo -e "\n=== GET /studio/state ==="
curl http://localhost:3400/api/studio/v1/studio/state | jq '{profiles_count: (.profiles | length), workspace: .workspace.name, agents_count: (.agents | length)}'
```

---

## PART 4: Architectural Verification Checklist

### ✅ Verify No Merge Logic in Frontend
```bash
# Check WorkspaceEditor.tsx for merge logic
grep -n "||" apps/web/src/features/workspaces/components/WorkspaceEditor.tsx

# Should show:
# - Line with "defaultModel: values.defaultModel || undefined" (correct)
# - Line with "skillIds: values.skillIds?.length ? values.skillIds : undefined" (correct)
# - NO lines like "|| selectedProfile?.defaultModel" (wrong)
# - NO lines like "|| selectedProfile?.defaultSkills" (wrong)
# - NO lines with "routines: selectedProfile?.routines" (wrong)
```

### ✅ Verify Clean API Payload
```bash
# Check createWorkspace() function in api.ts
grep -A 15 "export async function createWorkspace" apps/web/src/lib/api.ts

# Should show:
# - Building workspaceSpec object with conditional includes
# - NOT blindly passing all input fields
# - Filtering out undefined values
```

### ✅ Verify No Gateway SDK Imports
```bash
# Scan entire frontend for gateway-sdk
grep -r "gateway-sdk\|OpenClawClient" apps/web/src/

# Should return: NOTHING (no output = success)
```

### ✅ Verify Bootstrap Endpoint Only
```bash
# Check all workspace creation calls
grep -r "workspaces" apps/web/src/lib/api.ts | grep -E "(fetch|POST|PUT)"

# Should show:
# - Only ONE route: POST /api/studio/v1/workspaces/bootstrap
# - NO alternatives like /workspaces/create or /workspaces/new
```

### ✅ Verify Backend Result Used as Truth
```bash
# Check WorkspacesPage.tsx
grep -A 2 "onCreated" apps/web/src/features/workspaces/pages/WorkspacesPage.tsx

# Should show:
# - onCreated={(result) => setWorkspace(result.workspaceSpec)}
# - Using backend response directly
# - NOT reconstructing workspace locally
```

### ✅ Verify Profile Info Display (Information-Only)
```bash
# Check WorkspaceEditor.tsx profile display
grep -B 2 -A 5 "Profile Defaults" apps/web/src/features/workspaces/components/WorkspaceEditor.tsx

# Should show:
# - Profile defaults displayed in read-only section
# - Note: "These profile values will be applied by the backend"
# - NO form inputs for profile defaults
```

---

## PART 5: Known Good States

### After Create with No Model Override
**UI Should Show**:
```
Current Workspace
Name: test-ops-1
Slug: test-ops-1
Model: gpt-4-turbo (from profile)
Skills: skill-1, skill-2 (from profile)
Routines: morning-brief, eod-review (from profile)
✓ Workspace values above are from backend merge
```

### After Create with Model Override
**UI Should Show**:
```
Current Workspace
Name: test-dev-1
Slug: test-dev-1
Model: custom/gpt-5-latest (from user input)
Skills: skill-1, skill-2 (from profile)
Routines: routine-1, routine-2 (from profile)
✓ Workspace values above are from backend merge
```

---

## PART 6: Deployment Preview & Apply

### Step 6.1: Preview Diff
1. After creating workspace (either test case)
2. Click **"Preview"** button in WorkspaceDeployPanel
3. View the diff showing what will be deployed

**Expected**: Shows 12 artifacts (prompt files + config files) with status "added"

### Step 6.2: Apply Deployment
1. Click **"Apply"** button
2. Wait for success message
3. Refresh page or click "Refresh" button

**Expected**: Files written to disk, runtime reloaded (if applyRuntime=true)

### Step 6.3: Verify Compile Happened Automatically
- You should NOT have clicked a separate "Compile" button
- Backend auto-compiles on preview/apply
- Check `StudioInspector` for diagnostics

---

## Summary: What to Verify

| Item | Before Fix | After Fix | Status |
|------|-----------|-----------|--------|
| **Frontend merge logic** | `model \|\| profile.model` | `model \|\| undefined` | ✅ |
| **Bootstrap payload** | Includes profile defaults | Only user edits + profileId | ✅ |
| **API function** | Takes 7 params including routines | Takes 6 params, no routines | ✅ |
| **Result handling** | Reconstructs workspace | Uses backend response | ✅ |
| **Profile display** | Information-only labels | Same, plus blue note | ✅ |
| **Gateway imports** | None (good) | Still none (good) | ✅ |
| **E2E flow** | Profiles→editor→bootstrap | Profiles→bootstrap→compile→preview→apply | ✅ |

---

## Troubleshooting

### Issue: Profiles not loading
- Check: `GET http://localhost:3400/api/studio/v1/profiles` returns array
- Check: Frontend error console for fetch failures
- Check: Backend terminal for errors

### Issue: Bootstrap fails
- Check: Profile ID exists (use GET /profiles to verify)
- Check: Workspace name is provided
- Check: Network tab shows error response

### Issue: Workspace shows profile defaults even when not sent
- Good! This means backend merge is working
- Check: Network tab payload doesn't include those fields
- This is correct behavior

### Issue: Model override isn't applied
- Check: Network tab - is your override in the request?
- Check: Backend response - does it include your override?
- If not in request but in response: frontend is still merging (bad)

---

## Final Validation

**You're done when**:
1. ✅ Test Case 1: Profile defaults appear without being sent in payload
2. ✅ Test Case 2: Model override is sent and respected
3. ✅ Network tab: Bootstrap payload is clean (no profile defaults)
4. ✅ UI: Displays "backend merge" values correctly
5. ✅ E2E: profiles → bootstrap → compile → preview/diff → apply works end-to-end
6. ✅ No gateway-sdk imports in frontend code
7. ✅ Architecture: Frontend sends only user edits, backend owns merge

