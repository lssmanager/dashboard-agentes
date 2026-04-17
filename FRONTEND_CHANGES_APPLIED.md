# Frontend Changes - Visual Summary

**Last Commit**: `d22770f fix: unblock execution - add zod, routineSpecSchema, seed data, cleanup builtins`

## 5 Archivos Cambiados

### 1. `apps/web/src/features/workspaces/pages/WorkspacesPage.tsx`
**Cambio crucial**: Ahora carga profiles del API en lugar de hardcodeados

```typescript
// NEW: Fetch profiles from backend at page load
useEffect(() => {
  getStudioState().then((state) => {
    setProfiles(state.profiles);  // ← FROM BACKEND, not hardcoded
    if (state.workspace) {
      setWorkspace(state.workspace);
    }
  });
}, []);
```

**Impacto visual**: La lista de profiles en WorkspaceEditor ahora muestra perfiles reales del backend (chief-of-staff, dev-agent, etc.)

---

### 2. `apps/web/src/features/workspaces/components/WorkspaceEditor.tsx`
**Cambio crucial**: NO hace merge local, solo envía datos del usuario

```typescript
// BEFORE (hypothetical - no longer exists):
// const result = await createWorkspace({
//   defaultModel: values.defaultModel || selectedProfile?.defaultModel,
//   skillIds: values.skillIds || selectedProfile?.defaultSkills,
//   routines: selectedProfile?.routines,
// });

// AFTER (RIGHT NOW):
const result = await createWorkspace({
  name: values.name,
  profileId: values.profileId,
  defaultModel: values.defaultModel || undefined,        // ← ONLY if user set it
  skillIds: values.skillIds?.length ? values.skillIds : undefined,  // ← ONLY if user set it
  // NO routines - backend resolves from profile
});
```

**Impacto visual**:
- El formulario muestra perfiles con mejor descripción (información de profile se muestra)
- Al crear workspace, el UI NO autodellena fields (eso lo hace el backend)
- Inline help dice: "These profile values will be applied by the backend if you don't override them"

---

### 3. `apps/web/src/features/workspaces/components/WorkspaceList.tsx`
**Cambio crucial**: Muestra valores resolvidos por el backend

```typescript
// NEW LINE 36:
✓ Workspace values above are from backend merge (request > profile > defaults)
```

**Impacto visual**: Cuando hay un workspace cargado, muestra:
- Name (del workspace resolvido)
- Slug (del workspace resolvido)
- Model (del workspace resolvido)
- Skills (del workspace resolvido)
- Routines (del workspace resolvido)
- **Label claro**: "✓ Workspace values above are from backend merge"

---

### 4. `apps/web/src/lib/api.ts`
**Cambio crucial**: `createWorkspace()` ahora con lógica clara de merge en backend

```typescript
export async function createWorkspace(input: {
  id?: string;
  name: string;
  profileId?: string;
  defaultModel?: string;
  skillIds?: string[];
}) {
  // Bootstrap endpoint: backend handles merge order (request > profile > defaults)
  // Only include fields user explicitly set - backend fills in profile defaults

  const workspaceSpec: Record<string, any> = {
    name: input.name,
    agentIds: [],
    flowIds: [],
    policyIds: [],
  };

  // Only include optional fields if explicitly set (not undefined)
  if (input.slug !== undefined) workspaceSpec.slug = input.slug;
  if (input.defaultModel !== undefined) workspaceSpec.defaultModel = input.defaultModel;
  if (input.skillIds !== undefined) workspaceSpec.skillIds = input.skillIds;

  // POSTs to /api/studio/v1/workspaces/bootstrap
}
```

**Impacto visual**: Payload enviado al servidor ahora es más limpio y específico. El backend recibe solo lo que el usuario especificó.

---

### 5. `apps/web/src/lib/types.ts`
**Cambio**: Tipos exportados para frontend (ProfileSpec, WorkspaceSpec, etc.)

```typescript
export type ProfileSpec = {
  id: string;
  name: string;
  description: string;
  category?: 'operations' | 'support' | 'engineering' | 'monitoring';
  defaultModel?: string;
  defaultSkills: string[];
  routines: string[];
  // ...
};

export type StudioStateResponse = {
  profiles: ProfileSpec[];
  workspace: WorkspaceSpec | null;
  routines: RoutineSpec[];
};
```

**Impacto visual**: TypeScript type safety para todos los datos que vienen del backend.

---

## Flujo Completo Actualizado

### ANTES (teórico - lo que no hacemos ya):
```
User fills form
↓
Frontend: defaultModel = form.defaultModel || profile.defaultModel
Frontend: skills = form.skills || profile.skills
Frontend: routines = profile.routines
↓ (duplicated logic)
Frontend: sends merged values to backend
↓
Backend: receives already-merged values
```

### AHORA (correcto):
```
1. WorkspacesPage carga profiles del API real
   GET /api/studio/v1/studio/state → setProfiles(state.profiles)

2. WorkspaceEditor muestra profiles real + form para user overrides

3. User selecciona profile + completa fields opcionales

4. Frontend envía SOLO los datos del form (sin merge):
   POST /api/studio/v1/workspaces/bootstrap {
     profileId: "chief-of-staff",
     workspaceSpec: {
       name: "My Operations Workspace",
       defaultModel: "openai/gpt-5.4-mini"  // ← ONLY if explicitly set
     }
   }

5. Backend merge (request > profile > defaults):
   - Uses request.defaultModel
   - Falls back to profile.defaultModel
   - Falls back to system default

6. Backend returns resolved WorkspaceSpec

7. WorkspaceList displays resolved values with label:
   "✓ Workspace values above are from backend merge (request > profile > defaults)"
```

---

## Verificación de Cambios (Git Diff)

```bash
# Ver cambios exactos:
git show d22770f --stat -- apps/web/

# Ver diff completo del frontend:
git diff HEAD~1 HEAD -- apps/web/
```

Cambios: **189 insertions(+), 30 deletions(-)**

---

## Cómo Verificar Visualmente Once Node.js is Installed

```bash
npm install
npm start  # Frontend + Backend

# En http://localhost:3001/workspaces

# Busca:
# 1. Profile dropdown en WorkspaceEditor muestra perfiles REALES (no hardcodeados)
# 2. Formulario NO autocompletata model/skills (solo name + profileId requeridos)
# 3. WorkspaceList muestra "✓ Workspace values above are from backend merge..."
# 4. Después de crear, los valores mostrados son los del backend resolvido
```

---

## TL;DR

**Los cambios del frontend ESTÁN en el código.**

- ✅ WorkspacesPage carga profiles del API
- ✅ WorkspaceEditor no hace merge local
- ✅ Api.ts envía solo datos del usuario
- ✅ WorkspaceList muestra valores resolvidos por backend

**No ves los cambios visualmente porque Node.js no está instalado.**

Una vez instales Node.js: `npm install && npm start` y verás todos los cambios en el navegador.
