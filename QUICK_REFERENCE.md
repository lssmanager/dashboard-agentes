# Frontend Alignment - Quick Reference Card

## What Changed (3 Files)

### 1. WorkspaceEditor.tsx
```typescript
// BEFORE (WRONG - frontend merge):
const result = await createWorkspace({
  name: values.name,
  profileId: values.profileId,
  defaultModel: values.defaultModel || selectedProfile?.defaultModel,
  skillIds: values.skillIds || selectedProfile?.defaultSkills,
  routines: selectedProfile?.routines,
});

// AFTER (CORRECT - clean input):
const result = await createWorkspace({
  name: values.name,
  profileId: values.profileId,
  defaultModel: values.defaultModel || undefined,
  skillIds: values.skillIds?.length ? values.skillIds : undefined,
  // NO routines - backend handles
});
```

### 2. api.ts
```typescript
// BEFORE (WRONG):
body: JSON.stringify({
  profileId: input.profileId,
  workspaceSpec: {
    name: input.name,
    slug: input.slug,
    defaultModel: input.defaultModel,     // Could be undefined
    skillIds: input.skillIds,             // Could be undefined
    routines: input.routines,             // Frontend merged
    agentIds: [],
    flowIds: [],
    policyIds: [],
  },
})

// AFTER (CORRECT):
const workspaceSpec = {
  name: input.name,
  agentIds: [],
  flowIds: [],
  policyIds: [],
};
if (input.slug !== undefined) workspaceSpec.slug = input.slug;
if (input.defaultModel !== undefined) workspaceSpec.defaultModel = input.defaultModel;
if (input.skillIds !== undefined) workspaceSpec.skillIds = input.skillIds;

body: JSON.stringify({
  profileId: input.profileId,
  workspaceSpec,
})
```

### 3. WorkspaceList.tsx
```typescript
// BEFORE (minimal):
{current.name}
{current.slug}

// AFTER (enhanced):
{current.name}
{current.slug}
{current.defaultModel}  // Backend merged
{current.skillIds}      // Backend merged
{current.routines}      // Backend merged
+ Blue note: "from backend merge"
```

---

## Key Rules

✅ **DO**:
- Send only user-edited fields to backend
- Use backend response directly: `setWorkspace(result.workspaceSpec)`
- Display resolved values from backend
- Keep merge logic OUT of frontend

❌ **DON'T**:
- Merge profile defaults in frontend
- Send always-send empty arrays (let backend default them)
- Reconstruct workspace after response
- Put merge logic in multiple places

---

## Verification

### Payload Should Be Clean
```json
{
  "profileId": "chief-of-staff",
  "workspaceSpec": {
    "name": "test",
    "agentIds": [],
    "flowIds": [],
    "policyIds": []
    // NO defaultModel
    // NO skillIds
    // NO routines
  }
}
```

### Response Shows Merge
```json
{
  "workspaceSpec": {
    "name": "test",
    "defaultModel": "gpt-4",        // Backend merged
    "skillIds": ["s1", "s2"],       // Backend merged
    "routines": ["r1", "r2"],       // Backend merged
    ...
  }
}
```

### UI Shows Result
- WorkspaceList displays all merged values
- Blue note indicates "backend merge"
- No "client-side guess", only actual resolved data

---

## Test in 60 Seconds

```bash
# 1. Start backend
cd apps/api && npm run dev

# 2. Start frontend
cd apps/web && npm run dev

# 3. Open UI, go to Workspaces
# 4. Select profile, enter name, SKIP model input
# 5. Create
# 6. Verify: Model shows profile default, not empty
# 7. Check DevTools Network: payload has NO defaultModel field
# 8. ✅ Done - frontend is clean
```

---

## Merge Order (Backend)

```typescript
// Priority: request > profile > system defaults
defaultModel: input.defaultModel ?? profileDefault.defaultModel ?? 'gpt-4-mini'
skillIds: input.skillIds ?? profileDefault.skillIds ?? []
routines: input.routines ?? profileDefault.routines ?? []
```

Frontend sends `undefined` for unset fields → backend fills with profile defaults

---

## Files to Review

| File | What | Where |
|------|------|-------|
| WorkspaceEditor.tsx | handleCreate function | Lines 25-43 |
| WorkspaceEditor.tsx | Profile display | Lines 88-112 |
| api.ts | createWorkspace function | Lines 32-62 |
| WorkspaceList.tsx | Display merged values | All |

---

## Common Questions

**Q: Why don't we send skillIds?**
A: If user didn't edit skills, we send `undefined`. Backend merges from profile. No duplication.

**Q: What if profile changes?**
A: Frontend doesn't cache profiles. Each bootstrap request loads latest profile from backend.

**Q: Can user override skills?**
A: Yes, if skillIds is in form inputs. But current form only has model as optional.

**Q: Where are routines merged?**
A: Backend only. Frontend never touches routines field.

**Q: Why is this better?**
A: Single source of truth. Merge logic in one place. Easier to test & maintain.

