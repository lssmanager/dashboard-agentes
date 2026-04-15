# ACCIÓN 5 - Compilador Completo

## Estado: ✅ COMPLETADO

Fecha: 2026-04-15

---

## Audit de compile-openclaw-artifacts.ts

### Implementación de Artifacts

**Archivo**: `packages/workspace-engine/src/compile-openclaw-artifacts.ts`

El compilador genera **12 DeployableArtifact** con todos los campos requeridos:

```typescript
interface DeployableArtifact {
  id: string;           // {workspaceId}:{artifact-type}
  type: string;         // 'prompt-file' | 'routing' | 'workspace' | 'agent' | 'skill' | 'flow' | 'profile' | 'policy'
  name: string;         // nombre legible
  path: string;         // ruta de deployment
  mediaType: string;    // 'text/markdown' | 'application/json'
  content: string;      // contenido completo
  sourceHash: string;   // SHA256(content)
}
```

✅ **Función toArtifact()** calcula sourceHash:
```typescript
function toArtifact(partial: Omit<DeployableArtifact, 'sourceHash'>): DeployableArtifact {
  return {
    ...partial,
    sourceHash: hashContent(partial.content),
  };
}
```

### 12 Artifacts Generados

#### Prompt Files (Markdown)
| # | Artifact | Type | Name | Path | Content |
|---|----------|------|------|------|---------|
| 1 | agents-md | prompt-file | AGENTS.md | AGENTS.md | List de agents con roles, modelos, skills, instructions |
| 2 | soul-md | prompt-file | SOUL.md | SOUL.md | Workspace description como instrucción de comportamiento |
| 3 | tools-md | prompt-file | TOOLS.md | TOOLS.md | Lista de skills disponibles |
| 4 | user-md | prompt-file | USER.md | USER.md | Contexto de usuario (workspace name, owner) |
| 5 | heartbeat-md | prompt-file | HEARTBEAT.md | HEARTBEAT.md | Checklist de routines para health checks |

#### Configuration Files (JSON)
| # | Artifact | Type | Name | Path | Content |
|---|----------|------|------|------|---------|
| 6 | routing | routing | routing.json | .openclaw-studio/routing.json | Routing rules config |
| 7 | workspace-spec | workspace | workspace.spec.json | .openclaw-studio/workspace.spec.json | Full WorkspaceSpec |
| 8 | agents-spec | agent | agents.spec.json | .openclaw-studio/agents.spec.json | All agents |
| 9 | skills-spec | skill | skills.spec.json | .openclaw-studio/skills.spec.json | All skills |
| 10 | flows-spec | flow | flows.spec.json | .openclaw-studio/flows.spec.json | All flows |
| 11 | profiles-spec | profile | profiles.spec.json | .openclaw-studio/profiles.spec.json | All profiles |
| 12 | policies-spec | policy | policies.spec.json | .openclaw-studio/policies.spec.json | All policies |

### Validación Cruzada (crossValidate)

✅ Valida referential integrity:
- Todos los agentIds en workspace existen en agents[]
- Todos los skillIds en agents existen en skills[]
- Todos los flowIds en workspace existen en flows[]
- Todos los profileIds en workspace existen en profiles[]
- Todos los policyRefs en workspace existen en policies[]
- Handoff rules apuntan a agents válidos

✅ Retorna diagnostics[] si hay problemas
- Si hay errores, compileCurrent() retorna { artifacts: [], diagnostics: [...] }

### Endpoints

**GET /api/studio/v1/workspaces/compile**
```bash
Response (200):
{
  "artifacts": [ /* 12 artifacts */ ],
  "diagnostics": []
}
```

**POST /api/studio/v1/compile**
```bash
Response (200) si diagnostics vacío:
{
  "artifacts": [ /* 12 artifacts */ ],
  "diagnostics": []
}

Response (422) si hay diagnostics:
{
  "artifacts": [],
  "diagnostics": [
    "workspace.agentIds contains missing agent: unknown-agent",
    "agent cli references missing skill: unknown-skill"
  ]
}
```

---

## Ejemplo Completo de Compilación

### Input (Workspace + Dependencies)

```typescript
const input = {
  workspace: {
    id: "test-workspace",
    name: "Test Workspace",
    description: "Test workspace for validation",
    routines: ["morning-brief", "eod-review"],
    skillIds: ["status.read", "tasks.manage"],
    agentIds: ["executive"],
    policyRefs: [{ id: "safe-operator", scope: "workspace" }],
    // ...
  },
  agents: [
    {
      id: "executive",
      name: "Executive",
      role: "decision-maker",
      model: "openai/gpt-5.4",
      executionMode: "autonomous",
      skillRefs: ["status.read", "tasks.manage"],
      instructions: "You are the executive agent...",
      // ...
    }
  ],
  skills: [
    { id: "status.read", name: "Read Status", ... },
    { id: "tasks.manage", name: "Manage Tasks", ... }
  ],
  policies: [
    { id: "safe-operator", name: "Safe Operator", rules: [...] }
  ]
}
```

### Output (12 Artifacts)

```typescript
{
  artifacts: [
    {
      id: "test-workspace:agents-md",
      type: "prompt-file",
      name: "AGENTS.md",
      path: "AGENTS.md",
      mediaType: "text/markdown",
      content: "# AGENTS\n\n## Executive\n\n- id: executive\n- role: decision-maker\n...",
      sourceHash: "abc123def456..."
    },
    {
      id: "test-workspace:soul-md",
      type: "prompt-file",
      name: "SOUL.md",
      path: "SOUL.md",
      mediaType: "text/markdown",
      content: "# SOUL\n\nTest workspace for validation.",
      sourceHash: "xyz789uvw012..."
    },
    // ... 10 más
  ],
  diagnostics: []
}
```

---

## SourceHash Mechanism

### SHA256 Hash para Change Detection

```typescript
function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}
```

### Uso en Deploy Preview

El sourceHash permite:
1. **Cambios detectados**: Si sourceHash cambió → artifact necesita update
2. **Idempotencia**: Mismo contenido = mismo hash
3. **Deployment safety**: Verificar qué está realmente diferente antes de escribir

Ejemplo:
```
AGENTS.md:
  Current hash:  "abc123..."
  Compiled hash: "def456..."
  Status: CHANGED ✓
```

---

## Definición de Done - CUMPLIDA

| Criterio | Estado |
|----------|--------|
| 12 artifacts generados | ✅ |
| Cada artifact con sourceHash SHA256 | ✅ |
| AGENTS.md con lista de agents | ✅ |
| SOUL.md con workspace description | ✅ |
| TOOLS.md con lista de skills | ✅ |
| USER.md con contexto | ✅ |
| HEARTBEAT.md con routines | ✅ |
| routing.json con rules | ✅ |
| *.spec.json files con full specs | ✅ |
| Validación cruzada funcional | ✅ |
| Diagnostics descriptivos | ✅ |
| POST /compile retorna artifacts[] | ✅ |
| GET /workspaces/compile disponible | ✅ |

---

## Impacto

✅ **Compilation pipeline completo**
- Workspace specification → 12 DeployableArtifacts
- sourceHash estable para cambios
- Diagnostics útiles para debugging

✅ **Ready para deploy preview/diff/apply**
- Artifacts tienen sourceHash para comparación
- Paths claros (AGENTS.md, .openclaw-studio/workspace.spec.json)
- Content determinístico

✅ **Deployment artifacts listo**
- Todos los archivos necesarios para ejecutar workspace
- Especificaciones completas para agents, skills, flows, policies
- Configuración de routing

---

## Edge Cases Manejados

✅ Workspace vacío (sin agents, skills, etc.)
- Retorna artifacts igual pero con content vacío
- diagnostics avisa de referencias válidas pero no usadas

✅ Diagnostics pueden prevenir compile incompleto
- Si hay missing references, compilation falla gracefully
- Retorna diagnostics detallados para debugging

✅ SourceHash estable
- Mismo contenido = mismo hash siempre
- Reproducible entre compilaciones

---

## Siguiente: ACCIÓN 6 - Preview/Diff/Apply

Usar estos artifacts para:
1. **GET /deploy/preview** - mostrar qué cambiaría
2. **Diff calculation** - comparar sourceHash actual vs compilado
3. **POST /deploy/apply** - escribir archivos

---

**ACCIÓN 5 COMPLETADA**: Compilador generando 12 artifacts completos con sourceHash.
