# Zod Dependency Critical Issues - Detailed Code Analysis

## Executive Summary

**Status**: CRITICAL - System cannot run
**Main Issue**: Zod library not installed but actively used
**Secondary Issue**: routineSpecSchema defined but referenced

---

## Issue #1: Zod Module Not Installed

### Verification Results

```
node_modules directory status: MISSING
zod installation: NOT FOUND
package.json zod entry: NONE
package-lock.json zod entry: 0 occurrences
```

### Single Import Point (Code)

**File**: `packages/schemas/src/studio-schemas.ts`
**Line 1**:
```typescript
import { z } from 'zod';
```

This is the ONLY direct import of zod. All schema definitions depend on it.

---

## Issue #2: Runtime Schema Validation Calls (13 Total)

### Service #1: Agents Service
**File**: `apps/api/src/modules/agents/agents.service.ts`

```typescript
import { agentSpecSchema } from '../../../../../packages/schemas/src';

// Line 18
const parsed = agentSpecSchema.parse(agent) as AgentSpec;

// Line 36
const parsed = agentSpecSchema.parse({ ...agents[index], ...updates, id }) as AgentSpec;
```

### Service #2: Flows Service
**File**: `apps/api/src/modules/flows/flows.service.ts`

```typescript
import { flowSpecSchema } from '../../../../../packages/schemas/src';
const parsed = flowSpecSchema.parse(flow) as FlowSpec;
const parsed = flowSpecSchema.parse({ ...items[index], ...updates, id }) as FlowSpec;
```

### Service #3: Policies Service
**File**: `apps/api/src/modules/policies/policies.service.ts`

```typescript
import { policySpecSchema } from '../../../../../packages/schemas/src';
const parsed = policySpecSchema.parse(policy) as PolicySpec;
const parsed = policySpecSchema.parse({ ...current[index], ...updates, id }) as PolicySpec;
```

### Service #4: Profiles Service
**File**: `apps/api/src/modules/profiles/profiles.service.ts`

```typescript
import { profileSpecSchema } from '../../../../../packages/schemas/src';

async getAll(basePath: string = process.cwd()): Promise<ProfileSpec[]> {
  const profiles = await loadProfilesCatalog(basePath);
  const validated = profiles.map((p) => profileSpecSchema.parse(p));  // FAILS HERE
  this.cache = validated;
  return validated;
}
```

**Endpoint Impact**: `GET /api/studio/v1/profiles` will fail

### Service #5: Routines Service (DOUBLE FAILURE)
**File**: `apps/api/src/modules/routines/routines.service.ts`

```typescript
import { routineSpecSchema } from '../../../../../packages/schemas/src';

async getAll(basePath: string = process.cwd()): Promise<RoutineSpec[]> {
  const routines = await loadRoutinesCatalog(basePath);
  // DOUBLE FAILURE:
  // 1. routineSpecSchema does NOT exist in studio-schemas.ts
  // 2. Even if defined, zod is not installed
  const validated = routines.map((r) => routineSpecSchema.parse(r));  // FAILS HERE
}
```

**Endpoint Impact**: `GET /api/studio/v1/routines` will fail with TWO errors

### Service #6: Skills Service
**File**: `apps/api/src/modules/skills/skills.service.ts`

```typescript
import { skillSpecSchema } from '../../../../../packages/schemas/src';
const parsed = skillSpecSchema.parse(skill) as SkillSpec;
const parsed = skillSpecSchema.parse({ ...current[index], ...updates, id }) as SkillSpec;
```

### Service #7: Workspaces Service (BOOTSTRAP FLOW)
**File**: `apps/api/src/modules/workspaces/workspaces.service.ts`

```typescript
import { workspaceSpecSchema } from '../../../../../packages/schemas/src';

// Line 31
createFromPreset(...) {
  const workspace = workspaceSpecSchema.parse({ ... }) as WorkspaceSpec;  // FAILS
  return this.repository.save(workspace);
}

// Line 83
async bootstrap(...) {
  const merged = workspaceSpecSchema.parse({ ... }) as WorkspaceSpec;  // FAILS
  return this.repository.save(merged);
}

// Line 111
updateCurrent(...) {
  const parsed = workspaceSpecSchema.parse({ ... }) as WorkspaceSpec;  // FAILS
  return this.repository.save(parsed);
}
```

**Endpoint Impact**:
- `POST /api/studio/v1/workspaces/bootstrap` - FAIL
- `POST /api/studio/v1/compile` - FAIL
- `GET /api/studio/v1/deploy/preview` - FAIL
- `POST /api/studio/v1/deploy/apply` - FAIL

---

## Issue #3: Missing routineSpecSchema Definition

### Expected Schema (Based on RoutineSpec Type)

**File**: `packages/core-types/src/routine-spec.ts`

```typescript
export interface RoutineSpec {
  id: string;
  name: string;
  description: string;
  schedule?: string;
  promptTemplate?: string;
  steps: string[];
}
```

### Missing from studio-schemas.ts

The schema is NOT defined in `packages/schemas/src/studio-schemas.ts`

**Schemas currently defined**:
- skillFunctionSchema ✓
- skillSpecSchema ✓
- flowNodeSchema ✓
- flowEdgeSchema ✓
- flowSpecSchema ✓
- policySpecSchema ✓
- workspaceSpecSchema ✓
- agentSpecSchema ✓
- profileSpecSchema ✓
- **routineSpecSchema ✗ MISSING**

---

## NPM Dependencies Status

### Current package.json (Root)

**File**: `package.json`

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "ws": "^8.15.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
```

**Status**:
- Zod NOT listed ✗
- No monorepo workspace configuration found
- No per-package package.json files

### Installation Status

```
Installation Summary:
- package.json: EXISTS ✓
- package-lock.json: EXISTS ✓
- node_modules directory: MISSING ✗
- All npm packages: UNINSTALLED ✗
```

---

## Endpoint Failure Matrix

| Endpoint | Service | Blocker | Status |
|----------|---------|---------|--------|
| GET /profiles | profiles.service.ts | zod missing | FAIL |
| GET /routines | routines.service.ts | zod missing + schema missing | FAIL |
| POST /bootstrap | workspaces.service.ts | zod missing | FAIL |
| POST /compile | workspaces.service.ts | zod missing | FAIL |
| GET /deploy/preview | workspaces.service.ts | zod missing | FAIL |
| POST /deploy/apply | workspaces.service.ts | zod missing | FAIL |

---

## Solution Path

### Phase 1: Install Dependencies
1. Run `npm install zod`
2. Run `npm install` (installs all dependencies)
3. Verify: `test -d node_modules/zod && echo "OK" || echo "FAILED"`

### Phase 2: Define Missing Schema
Add to `packages/schemas/src/studio-schemas.ts`:

```typescript
export const routineSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  schedule: z.string().optional(),
  promptTemplate: z.string().optional(),
  steps: z.array(z.string()),
});
```

Also add export to `studioEntitySchemas` object and type definitions.

### Phase 3: Verify Setup
1. Run `npm test`
2. All tests must pass
3. Then attempt `npm start`

---

## Critical File Locations

| File | Purpose | Status |
|------|---------|--------|
| `/package.json` | Root dependencies | Incomplete (missing zod) |
| `/packages/schemas/src/studio-schemas.ts` | Zod import and schema definitions | Incomplete (missing routineSpecSchema) |
| `/apps/api/src/modules/agents/agents.service.ts` | Uses agentSpecSchema | Broken (zod missing) |
| `/apps/api/src/modules/flows/flows.service.ts` | Uses flowSpecSchema | Broken (zod missing) |
| `/apps/api/src/modules/policies/policies.service.ts` | Uses policySpecSchema | Broken (zod missing) |
| `/apps/api/src/modules/profiles/profiles.service.ts` | Uses profileSpecSchema | Broken (zod missing) |
| `/apps/api/src/modules/routines/routines.service.ts` | Uses routineSpecSchema | Broken (zod missing + schema missing) |
| `/apps/api/src/modules/skills/skills.service.ts` | Uses skillSpecSchema | Broken (zod missing) |
| `/apps/api/src/modules/workspaces/workspaces.service.ts` | Uses workspaceSpecSchema | Broken (zod missing) |

---

## Conclusion

The OpenClaw Studio backend cannot execute in its current state:

1. **Zod not installed** - Required for all schema validation at runtime
2. **No node_modules** - Zero npm packages are installed
3. **routineSpecSchema missing** - Referenced but not defined
4. **7 of 7 API services affected** - All use schema.parse()
5. **6 of 6 main endpoints failing** - All depend on schema validation

### Current System State: NOT READY FOR EXECUTION

### Required Actions Before Launch:
1. Install npm dependencies (including zod)
2. Define missing routineSpecSchema
3. Run full test suite
4. Verify all 6 endpoints work

---

**Report Generated**: 2026-04-16
**Analysis Scope**: Complete codebase verification
**Severity**: CRITICAL
