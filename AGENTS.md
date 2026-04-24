# AGENTS.md — dashboard-agentes
# Cluster: lssmanager/dashboard-agentes
# Live: https://cost.socialstudies.cloud
# Schema: OpenClaw 2026.4 · April 2026

> Este archivo es la fuente de verdad para cualquier agente IA (Codex, Copilot, dev-panel)
> que trabaje en este repositorio. Léelo completo antes de tocar cualquier archivo.

***

## Jerarquía canónica

```
Agency → Department → Workspace → Agent → Subagent
```

Toda creación, edición, validación y generación de Core Files debe respetar esta jerarquía.
No hay atajos. Un agente sin `parentWorkspaceId` no se crea. Un subagente sin `parentAgentId` no se crea.

***

## Stack del proyecto

| Capa | Tecnología | Entry point |
|------|-----------|-------------|
| Backend | Express + TypeScript | `apps/api/src/main.ts` |
| Frontend | React + Vite + Tailwind | `apps/web/src/main.tsx` |
| Shared types | `packages/core-types/src` | Importar desde aquí siempre |
| Schemas Zod | `packages/schemas/src` | Validar contratos aquí |
| Profile engine | `packages/profile-engine` | Cargar templates desde `templates/` |
| Workspace engine | `packages/workspace-engine` | Compilar artefactos |

El monolito sirve API en `/api/studio/v1/*` y React SPA en `/*` desde el mismo puerto 3400.

***

## Módulos backend existentes

```
apps/api/src/modules/
├── agents/            ← CRUD de agentes y subagentes
├── builder-agent/     ← getFunctionSummary() por nivel jerárquico  ← AMPLIAR
├── corefiles/         ← preview / diff / apply / rollback de Core Files
├── compile/           ← genera 12 DeployableArtifacts con sourceHash
├── deploy/            ← diff + apply a disco
├── flows/             ← FlowCanvas nodes/edges
├── gateway/           ← health y estado del gateway OpenClaw
├── hooks/             ← heartbeat + cron hooks
├── mcp/               ← Model Context Protocol
├── policies/          ← reglas de seguridad y aprobación
├── profiles/          ← carga profiles de templates/profiles/
├── routing/           ← ChannelBindings y RouteEditor
├── routines/          ← routines markdown
├── runtime/           ← control de runtime OpenClaw
├── runs/              ← historial de ejecuciones
├── skills/            ← catálogo de skills
├── studio/            ← GET /studio/state → StudioState completo
├── topology/          ← gráfico de topología por nivel
├── versions/          ← versiones de entidades
└── workspaces/        ← bootstrap / compile / deploy de workspaces
```

***

## Componentes frontend existentes (agents feature)

```
apps/web/src/features/agents/
├── components/
│   ├── AgentEditorForm.tsx        ← formulario plano actual — REEMPLAZAR con 9 secciones
│   ├── AgentHandoffEditor.tsx     ← editor de handoffs — conectar a Sección 4
│   ├── AgentInstructionEditor.tsx ← textarea de instrucciones — mover a Sección 2
│   ├── AgentKindSelector.tsx      ← selector agent/subagent — mover a Sección 1
│   ├── AgentModelSelector.tsx     ← selector de modelo — mover a Sección 1 (identity)
│   ├── AgentSkillSelector.tsx     ← selector de skills plano — REEMPLAZAR con Sección 3
│   ├── AgentTestDrawer.tsx        ← drawer de prueba — mantener
│   ├── ModelSelector.tsx          ← selector completo con fallbacks — mantener
│   ├── SystemPromptEditor.tsx     ← editor del system prompt — mover a Sección 2
│   └── ToolPicker.tsx             ← picker de tools plano — REEMPLAZAR con Sección 3
└── pages/
```

***

## Lo que NO existe y debe construirse

### Backend — crear o ampliar

1. **`AgentSpec` extendido** — el tipo actual es plano (10 campos). Ampliar en `packages/core-types/src`:
   ```typescript
   // packages/core-types/src/agent-spec.ts  (nuevo)
   export interface AgentIdentity {
     name: string
     creature?: string
     role?: string
     description?: string
     vibe?: string
     emoji?: string
     avatar?: string
   }

   export interface AgentBehavior {
     systemPrompt?: string
     personalityGuide?: string
     operatingPrinciples?: string[]
     boundaries?: string[]
     privacyRules?: string[]
     continuityRules?: string[]
     responseStyle?: string
     humanContext?: {
       humanName?: string
       addressAs?: string
       pronouns?: string
       timezone?: string
       notes?: string
       context?: string
     }
   }

   export interface AgentSkillsTools {
     assignedSkills?: string[]         // IDs del catálogo — NO crear aquí
     enabledTools?: string[]           // IDs del catálogo — NO crear aquí
     localNotes?: string               // TOOLS.md: aliases, SSH, TTS, env notes
     deviceAliases?: Record<string, string>
     sshAliases?: Record<string, string>
     ttsPreferences?: Record<string, string>
     environmentNotes?: string
   }

   export interface AgentHandoffs {
     allowedTargets?: string[]
     fallbackAgent?: string
     escalationPolicy?: string
     approvalLane?: string
     delegationNotes?: string
     internalActionsAllowed?: string[]
     externalActionsRequireApproval?: string[]
     publicPostingRequiresApproval?: boolean
   }

   export interface AgentRoutingChannels {
     allowedChannels?: string[]
     defaultChannel?: string
     fallbackChannel?: string
     groupChatMode?: 'silent_by_default' | 'respond_when_mentioned' | 'active'
     reactionPolicy?: 'enabled' | 'disabled' | 'limited'
     maxReactionsPerMessage?: number
     avoidTripleTap?: boolean
     platformFormattingRules?: string
     responseTriggerPolicy?: string
   }

   export interface AgentHooks {
     heartbeat?: {
       enabled: boolean
       promptSource?: 'HEARTBEAT.md' | 'inline' | 'disabled'
       checkEmail?: boolean
       checkCalendar?: boolean
       checkWeather?: boolean
       checkMentions?: boolean
       quietHoursStart?: string
       quietHoursEnd?: string
     }
     lifecycleHooks?: string[]
     cronHooks?: { schedule: string; task: string }[]
     proactiveChecks?: string[]
   }

   export interface AgentOperations {
     startup?: {
       readSoul?: boolean
       readUser?: boolean
       readDailyMemory?: boolean
       readLongTermMemoryInMainSessionOnly?: boolean
     }
     memoryPolicy?: {
       dailyNotesEnabled?: boolean
       longTermMemoryEnabled?: boolean
       memoryScope?: 'main_session_only' | 'shared_safe' | 'disabled'
       compactionPolicy?: string
     }
     safety?: {
       destructiveCommandsRequireApproval?: boolean
       externalActionsRequireApproval?: boolean
       privateDataProtection?: boolean
       recoverableDeletePreferred?: boolean
     }
     retryPolicy?: string
     runtimeHealthNotes?: string
   }

   export interface AgentReadiness {
     identityComplete: boolean
     behaviorComplete: boolean
     toolsAssigned: boolean
     routingConfigured: boolean
     hooksConfigured: boolean
     operationsConfigured: boolean
     versionsReady: boolean
     state: 'missing_identity' | 'missing_behavior' | 'missing_model'
           | 'missing_channel_binding' | 'missing_memory_policy'
           | 'missing_safety_policy' | 'ready_to_publish'
   }

   // AgentSpec extendido — reemplaza el tipo plano actual
   export interface AgentSpec {
     id?: string
     parentWorkspaceId: string        // OBLIGATORIO — no existe agente sin workspace
     parentAgentId?: string           // Solo para subagentes
     profileId?: string
     kind: 'agent' | 'subagent'
     // Sección 1
     identity: AgentIdentity
     // Sección 2
     behavior?: AgentBehavior
     // Sección 3
     skillsTools?: AgentSkillsTools
     // Sección 4
     handoffs?: AgentHandoffs
     // Sección 5
     routingChannels?: AgentRoutingChannels
     // Sección 6
     hooks?: AgentHooks
     // Sección 8
     operations?: AgentOperations
     // Solo lectura — calculado por el backend
     readiness?: AgentReadiness
   }
   ```

2. **`CoreFileGeneratorService`** — nuevo servicio en `apps/api/src/modules/corefiles/`:
   ```typescript
   // apps/api/src/modules/corefiles/corefile-generator.service.ts  (nuevo)
   // Recibe AgentSpec → devuelve Record<CoreFileName, string>
   // Archivos generados: BOOTSTRAP.md, IDENTITY.md, SOUL.md, TOOLS.md, USER.md, AGENTS.md
   // Cada generador es una función pura: (spec: AgentSpec) => string
   // La generación debe ser DETERMINISTA — mismos inputs = mismo output siempre
   export class CoreFileGeneratorService {
     generateAll(spec: AgentSpec): Record<string, string>
     generateIdentity(identity: AgentIdentity): string
     generateSoul(behavior: AgentBehavior): string
     generateTools(skillsTools: AgentSkillsTools): string
     generateUser(humanContext: AgentBehavior['humanContext']): string
     generateAgents(handoffs: AgentHandoffs, routing: AgentRoutingChannels, hooks: AgentHooks, ops: AgentOperations): string
     generateBootstrap(spec: AgentSpec): string   // solo create-mode
   }
   ```

3. **`GET /api/studio/v1/editor/skills-tools`** — nuevo endpoint en `apps/api/src/modules/skills/`:
   ```
   Query params: ?level=<agency|department|workspace|agent|subagent>&id=<entityId>
   Response: {
     scope: { level, id, name, path[] },
     sources: {
       profileDefaults: SkillOrToolRef[],
       agencyEnabled: SkillOrToolRef[],
       inherited: SkillOrToolRef[],
       localOverrides: SkillOrToolRef[]
     },
     skills: CatalogSkillEntry[],   // con campo state: available|selected|required|blocked|disabled
     tools: CatalogToolEntry[],
     effective: { skills: string[], tools: string[] }
   }
   ```

4. **`PATCH /api/studio/v1/editor/skills-tools`** — mismo módulo:
   ```
   Body: { level, id, skills: { select?, deselect?, require?, disable? }, tools: { ... } }
   ```

5. **`GET /api/studio/v1/agents/:id/readiness`** — en módulo `agents/`:
   ```
   Response: AgentReadiness
   ```

6. **`BuilderAgentService.getFunctionSummary()`** — ya existe. Ampliar para devolver también:
   - `coreFilesPreview`: resultado de `CoreFileGeneratorService.generateAll(spec)` si el agente ya tiene spec extendido
   - `readiness`: estado de completitud de las 9 secciones

### Frontend — crear o ampliar

1. **`AgentBuilderDrawer.tsx`** — nuevo componente principal. Reemplaza `AgentEditorForm.tsx`.
   - Drawer de pantalla completa con dos modos: `create` y `edit`
   - Navega entre 9 secciones via tabs laterales
   - Cada tab tiene badge de completitud (✓ / !)
   - Guarda estado local con `useReducer` — no hace POST hasta que el usuario confirma
   - En create-mode: muestra pantalla de BOOTSTRAP antes de las 9 secciones

2. **`Section1Identity.tsx`** — campos de `AgentIdentity`:
   - Inputs: name, creature, role, description, vibe, emoji, avatar
   - Avatar preview en tiempo real
   - Role badge chip
   - Profile source chip (si viene de profileId)
   - Placeholder exacto: ver campos en tipo `AgentIdentity` arriba

3. **`Section2Behavior.tsx`** — campos de `AgentBehavior`:
   - `SystemPromptEditor.tsx` existente → reusar para `systemPrompt`
   - `personalityGuide`: textarea con placeholder de SOUL.md
   - `operatingPrinciples`: lista editable de strings (add/remove)
   - `boundaries`: lista editable de strings
   - `privacyRules`: lista editable
   - `continuityRules`: lista editable
   - `responseStyle`: select (concise / thorough / adaptive)
   - Sub-sección `humanContext`: campos de USER.md

4. **`Section3SkillsTools.tsx`** — CRÍTICO: solo asigna desde catálogo, nunca crea:
   - Llama a `GET /editor/skills-tools?level=agent&id=<id>` al montar
   - Muestra 4 tarjetas de fuente: Profile defaults / Agency enabled / Workspace inherited / Local overrides
   - Lista de skills con estado (badge: selected / required / blocked / disabled)
   - Lista de tools con estado
   - Panel "Effective Assignment" calculado
   - Empty state: "No skills/tools enabled" + links a Settings > Skills y Profiles Hub
   - `localNotes` textarea: para aliases SSH, TTS, device names (= contenido de TOOLS.md)

5. **`Section4Handoffs.tsx`** — reusar `AgentHandoffEditor.tsx` + ampliar:
   - `allowedTargets`: multi-select de agentes del workspace (del StudioState)
   - `escalationPolicy`: textarea
   - `approvalLane`: select (none / soft / hard)
   - `internalActionsAllowed`: checklist predefinida
   - `externalActionsRequireApproval`: checklist
   - `publicPostingRequiresApproval`: toggle

6. **`Section5Routing.tsx`** — conectar al módulo `routing/`:
   - `allowedChannels`: multi-select desde bindings activos en `openclaw.json`
   - `groupChatMode`: radio (silent_by_default / respond_when_mentioned / active)
   - `reactionPolicy`: toggle
   - `avoidTripleTap`: toggle
   - `platformFormattingRules`: textarea con placeholder de AGENTS.md

7. **`Section6Hooks.tsx`** — conectar al módulo `hooks/`:
   - Heartbeat: toggle enabled + promptSource radio
   - Checklist: checkEmail, checkCalendar, checkWeather, checkMentions
   - quietHours: time pickers start/end
   - cronHooks: lista editable { schedule, task }
   - proactiveChecks: lista editable

8. **`Section7Versions.tsx`** — conectar a `corefiles/` y `versions/`:
   - Muestra draft vs deployed
   - Preview de Core Files generados (render de `CoreFileGeneratorService`)
   - Diff visual (unified diff)
   - Botones: Apply/Publish | Rollback | Export Core Files (download .zip)

9. **`Section8Operations.tsx`**:
   - Startup: 4 toggles (readSoul, readUser, readDailyMemory, readLongTermMemory)
   - memoryPolicy: scope radio + compactionPolicy input
   - safety: 4 toggles

10. **`Section9Readiness.tsx`** — barra lateral del drawer:
    - Indicador live por sección (verde / amarillo / rojo)
    - Llama a `GET /agents/:id/readiness` en polling 2s cuando el id existe
    - En create-mode: valida localmente sin polling
    - Muestra estado global: `ready_to_publish` vs razones de bloqueo
    - Botón "Publish Agent" activo solo si `readiness.state === 'ready_to_publish'`

***

## Reglas para agentes de código

### Qué PUEDE hacer un agente de código aquí

- Leer cualquier archivo del workspace
- Modificar archivos en `apps/`, `packages/`, `templates/`
- Correr `npm run build` y `npm test` para verificar
- Proponer cambios a `openclaw.json` (no aplicar directamente)
- Crear nuevos archivos de tipos, servicios, componentes
- Agregar campos a schemas Zod (sin romper validaciones existentes)
- Hacer git commits descriptivos dentro del workspace

### Qué NUNCA hace un agente de código sin aprobación explícita

- Push directo a `master` (proponer PR o diff)
- Modificar `openclaw.json` del gateway de producción
- Crear credenciales, API keys, tokens
- Tocar `deploy-dashboard.sh` o `bootstrap-clone.sh`
- Enviar mensajes a canales Discord del guild
- Modificar `.env` o variables de entorno de producción
- Borrar archivos con `rm -rf` — usar `trash` o mover a `_deprecated/`

### Reglas de código

- **Schema-first**: cambiar el tipo en `packages/core-types/src` antes de implementar
- **Validar con Zod**: todo contrato de API tiene schema en `packages/schemas/src`
- **No duplicar datos**: Skills y Tools son referencias al catálogo, nunca blobs copiados
- **No generar HTML/Markdown dentro del backend** sin pasar por `CoreFileGeneratorService`
- **No inventar IDs**: resolver nombres → IDs via `GET /studio/state`
- **Preserve preview → diff → apply → rollback**: no bypassear este pipeline para Core Files
- **No roms el estado de StudioStateContext**: es la única fuente de verdad del frontend
- **Build limpio**: `npm run build` debe pasar sin errores antes de cualquier commit

***

## Agentes del cluster y sus responsabilidades de código

| Agente | ID | Rol en desarrollo |
|--------|----|-------------------|
| Panel 🗂️ | `orquestador-panel` | Coordina tareas entre agentes de código, divide epics |
| Dev Panel 💻 | `dev-panel` | Implementa backend: tipos, servicios, endpoints, schemas |
| UI Fixer 🎨 | `ui-fixer-panel` | Implementa frontend: componentes React, Tailwind, Drawer |
| API Coder 🔗 | `api-coder-panel` | Implementa y prueba endpoints Express, contratos API |
| Conn 🔌 | `connectivity-panel` | WebSocket, gateway health, bindings de canales |
| Monitor 📊 | `monitoring-panel` | Observabilidad, runs, logs, budgets |
| WS Probe 🔍 | `ws-probe-panel` | Testing de endpoints, diagnósticos de runtime |
| Cost Watcher 💰 | `cost-watcher-panel` | Solo lectura: monitorea uso de modelos y costos |

Subagentes (`ui-fixer-panel`, `api-coder-panel`, `ws-probe-panel`, `cost-watcher-panel`) no tienen binding de canal Discord. Solo son invocables vía `sessions_spawn` desde `orquestador-panel` o `dev-panel`.

***

## Delegación de trabajo — cómo dividir el Entity Builder

### Sprint 1 — Tipos y contratos (dev-panel)
1. Crear `packages/core-types/src/agent-spec.ts` con los 9 tipos (ver sección "Lo que NO existe")
2. Crear schemas Zod en `packages/schemas/src/agent-spec.schema.ts`
3. Actualizar exports de `packages/core-types/src/index.ts`
4. `npm run build` debe pasar

### Sprint 2 — Endpoints backend (api-coder-panel)
1. Ampliar `POST /agents` para aceptar `AgentSpec` extendido
2. Crear `GET /editor/skills-tools` en módulo `skills/`
3. Crear `PATCH /editor/skills-tools`
4. Crear `GET /agents/:id/readiness`
5. Ampliar `BuilderAgentService.getFunctionSummary()` con `coreFilesPreview` y `readiness`
6. Tests: dispatch válido, loops inválidos, rollback safety

### Sprint 3 — CoreFileGeneratorService (dev-panel)
1. Crear `apps/api/src/modules/corefiles/corefile-generator.service.ts`
2. 6 generadores puros: `generateIdentity`, `generateSoul`, `generateTools`, `generateUser`, `generateAgents`, `generateBootstrap`
3. Exponer en `GET /corefiles/preview?agentId=<id>` (o inline en `/agents/:id/readiness`)
4. Tests de generación determinista

### Sprint 4 — AgentBuilderDrawer frontend (ui-fixer-panel)
1. Crear `apps/web/src/features/agents/components/AgentBuilderDrawer.tsx`
2. Crear las 9 secciones como componentes separados
3. Conectar `Section3SkillsTools` a `GET /editor/skills-tools`
4. Conectar `Section7Versions` a preview de Core Files
5. Conectar `Section9Readiness` a `GET /agents/:id/readiness`
6. Verificar mobile (375px) y desktop (1280px)

### Sprint 5 — Integración y pruebas (ws-probe-panel + dev-panel)
1. Flujo completo: create → fill 9 sections → readiness → publish → Core Files generados
2. Flujo edit: load → modify → diff → apply → rollback
3. Validar jerarquía: no crear agente sin workspace
4. Validar que skills/tools nunca se crean en el builder (solo se asignan)

***

## Checks obligatorios tras cambios

```bash
npm run build          # TypeScript sin errores
npm test               # Tests sin regresiones
```

Si agregas runtime path o propagation path, añadir tests para:
- Dispatch válido por nivel jerárquico
- Loop inválido detectado y rechazado
- Pausa/desconexión de links
- Diff preview correcto
- Rollback seguro
- Consistencia de propagación bidireccional

***

## Recursos de referencia en este repo

| Archivo | Propósito |
|---------|-----------|
| `openclaw.json` | Configuración de agentes y bindings del cluster |
| `openclaw-dashboard.json` | Estado del dashboard en runtime |
| `apps/api/src/modules/builder-agent/builder-agent.service.ts` | `getFunctionSummary()` por nivel |
| `apps/api/src/modules/corefiles/` | Pipeline preview/diff/apply/rollback |
| `apps/web/src/features/agents/components/AgentEditorForm.tsx` | Formulario plano actual a reemplazar |
| `packages/core-types/src/` | Tipos canónicos — ampliar aquí |
| `packages/schemas/src/` | Schemas Zod — ampliar aquí |
| `templates/profiles/` | Profiles que alimentan Section 1 (identity) |
| `docs/adr/` | Decisiones de arquitectura |