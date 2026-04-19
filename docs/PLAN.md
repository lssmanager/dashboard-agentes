## OpenClaw Studio — Plan Operativo Inmediato (Compat + Adapter)

### 1) Diagnóstico del repo actual
- El backend y frontend están funcionalmente centrados en `Workspace + Agent + Flow` (no existe modelo `Agency/Department` implementado aún).
- Ya existe ciclo `preview → apply` vía deploy y `diff/rollback` vía versiones, pero está fragmentado entre módulos y pantallas.
- Ya existe base de observabilidad/replay en `runs`, `operations`, `diagnostics`, `sessions`.
- No existen controles runtime reales de topología (connect/disconnect/pause/reactivate/redirect) ni contratos para ello.
- `ToolSpec` existe en `core-types`, pero no hay módulo CRUD/almacenamiento de catálogo global de tools en API/UI.
- Hay desalineaciones de rutas fuente de verdad:
  - Existe [AGENTS.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/AGENTS.md)
  - Existe [apps/api/src/modules/AGENTS.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/AGENTS.md)
  - No existe `apps/web/src/features/AGENTS.md` en esa ruta; el equivalente frontend está en [apps/api/src/features/AGENTS.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/features/AGENTS.md)
  - El modelo canónico está en [docs/adr/studio-canonical-model.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/docs/adr/studio-canonical-model.md)
- Estado de verificación local actual: no se pudo ejecutar `npm run build` ni `npm test` porque `npm` no está disponible en este entorno.

### 2) Mapa de reutilización (qué ya sirve)
- Reutilizar base Studio actual: `toolbar + tabbar + component library + canvas + properties panel` para `Workspace Studio base`.
- Reutilizar onboarding/workspaces para `Agency Builder base` (wizard + estructura inicial).
- Reutilizar `versions` + `deploy` para `diff/apply/rollback scaffolding`.
- Reutilizar `runs/operations/diagnostics/sessions` para `Observability/Debug/Replay base`.
- Reutilizar `workspace-store` y `DualFormatStore` manteniendo JSON en `.openclaw-studio` como canonical inicial.
- Reutilizar `gateway.service` como puente BFF para controles de topología (fail-closed, sin simulación).

### 3) Plan segmentado por frentes

#### Backend (8 frentes)
1. Entity model and schemas  
- Agregar contratos canónicos `Agency/Department/Workspace/Agent/Subagent` sin romper contratos actuales.
- Crear adaptador `Workspace legacy -> CanonicalState`.

2. Agency catalog and propagation engine  
- Introducir `agencyCatalog` (skills/tools por referencia) en modelo canónico.
- Dejar primera versión de propagación en modo determinista top-down + propuestas bottom-up (sin auto-apply).

3. Runtime orchestration  
- Definir contratos de ejecución por nivel (`Agency/Department/Workspace` inbound-only).
- Mantener engine actual de runs como base mientras se extienden entradas canónicas.

4. Topology runtime controls  
- Crear endpoints de control `connect/disconnect/pause/reactivate/redirect/continue`.
- Implementación `fail-closed`: si gateway no confirma, no mutar estado runtime.

5. Builder Agent Function backend outputs  
- Crear contrato de salida para panel/modal: `what-it-does`, `inputs`, `outputs`, `skills/tools`, `proposed core-file diffs`.

6. Core files diff/apply/rollback  
- Unificar en un façade `corefiles` que exponga preview/diff/apply/rollback sin duplicar lógica actual.

7. Replay/checkpoints/state graph  
- Extender metadatos de run para enlazar decisiones de enrutamiento topológico y handoffs.

8. Observability/tracing/runs  
- Añadir eventos tipados de topología/handoff/redirect y trazas enlazadas con runs.

#### Frontend (7 frentes)
1. Agency Builder UI  
- Nueva superficie base con estructura Agency/Department/Workspace + catálogo global.

2. Workspace Studio UI  
- Extraer la vista actual de `/studio` a `/workspace-studio` como base micro.

3. Agency Topology UI  
- Nueva vista macro separada con inspector de conexión y controles runtime reales.

4. Builder Agent Function panel  
- Panel/modal dentro de Workspace Studio para propósito, entradas/salidas, colaboradores y diffs propuestos.

5. Core files diff preview UI  
- Panel unificado preview/diff/apply/rollback consumiendo façade backend.

6. Observability/Debug/Replay UI  
- Integrar vistas existentes bajo navegación Studio con foco en trazas y replay por topología.

7. Visual DX improvements  
- Aplicar sistema visual y tokens existentes, manteniendo separación macro vs micro y Skills vs Tools.

### 4) Archivos iniciales exactos a tocar primero

#### Lote 1 — Fundacional (prioridad inicial pedida)
- [packages/core-types/src/studio-canonical.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/packages/core-types/src/studio-canonical.ts) (nuevo)
- [packages/core-types/src/index.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/packages/core-types/src/index.ts)
- [packages/schemas/src/studio-canonical-schemas.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/packages/schemas/src/studio-canonical-schemas.ts) (nuevo)
- [packages/schemas/src/index.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/packages/schemas/src/index.ts)
- [apps/api/src/modules/studio/studio-canonical.adapter.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/studio/studio-canonical.adapter.ts) (nuevo)
- [apps/api/src/modules/studio/studio.service.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/studio/studio.service.ts)
- [apps/api/src/modules/studio/studio.controller.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/studio/studio.controller.ts)
- [apps/web/src/lib/types.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/lib/types.ts)
- [apps/web/src/lib/api.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/lib/api.ts)

#### Lote 2 — Agency Builder / Workspace Studio / Topology base
- [apps/web/src/features/studio/agency-builder/pages/AgencyBuilderPage.tsx](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/features/studio/agency-builder/pages/AgencyBuilderPage.tsx) (nuevo)
- [apps/web/src/features/studio/workspace-studio/pages/WorkspaceStudioPage.tsx](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/features/studio/workspace-studio/pages/WorkspaceStudioPage.tsx) (nuevo)
- [apps/web/src/features/studio/topology/pages/AgencyTopologyPage.tsx](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/features/studio/topology/pages/AgencyTopologyPage.tsx) (nuevo)
- [apps/web/src/App.tsx](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/App.tsx)
- [apps/web/src/components/NavRail.tsx](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/components/NavRail.tsx)
- [apps/web/src/lib/sidebar-context.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/lib/sidebar-context.ts)

#### Lote 3 — Topology runtime controls + corefiles façade
- [apps/api/src/modules/topology/topology.controller.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/topology/topology.controller.ts) (nuevo)
- [apps/api/src/modules/topology/topology.service.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/topology/topology.service.ts) (nuevo)
- [apps/api/src/modules/corefiles/corefiles.controller.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/corefiles/corefiles.controller.ts) (nuevo)
- [apps/api/src/modules/corefiles/corefiles.service.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/corefiles/corefiles.service.ts) (nuevo)
- [apps/api/src/routes.ts](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/routes.ts)

#### Lote 4 — docs/spec alignment
- [docs/adr/studio-canonical-model.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/docs/adr/studio-canonical-model.md)
- [docs/adr/0001-openclaw-studio-boundaries.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/docs/adr/0001-openclaw-studio-boundaries.md)
- [AGENTS.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/AGENTS.md)
- [apps/api/src/modules/AGENTS.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/api/src/modules/AGENTS.md)
- [apps/web/src/features/AGENTS.md](/Users/Sebas/Documents/dashboard-agentes-main/dashboard-agentes-main/apps/web/src/features/AGENTS.md) (nuevo, para corregir ubicación faltante)

### 5) Dependencias entre tareas
- Contratos canónicos (Lote 1) bloquean todo lo demás.
- Topology UI depende de endpoints topology + tipos API.
- Agency Builder base depende de canonical read/write contracts.
- Workspace Studio base puede arrancar en paralelo tras contratos canónicos.
- Corefiles façade depende de deploy/versions existentes y habilita diff UI unificado.
- Observability/replay extendido depende de eventos de topología.

### 6) Orden de ejecución recomendado
1. Lote 1 (contratos canónicos + adapter + endpoint canonical + API/UI types).  
2. Lote 2 parcial: levantar rutas y páginas base (`agency-builder`, `workspace-studio`, `agency-topology`) con datos read-only canónicos.  
3. Lote 3: topology controls fail-closed y façade corefiles.  
4. Completar Lote 2: acciones base de Agency Builder y Workspace Studio conectadas a backend.  
5. Builder Agent Function backend output + panel frontend.  
6. Extensión observability/debug/replay y eventos de topología.  
7. Lote docs/spec + pruebas de regresión final.

### 7) Riesgos técnicos
- Riesgo de drift entre modelo legacy workspace y modelo canónico durante transición.
- Riesgo de controles visuales falsos si UI no respeta fail-closed del backend.
- Riesgo de divergencia entre `skills` y futuro `tools` si no se introduce catálogo global explícito desde el inicio.
- Riesgo de inconsistencias por data actual (`workspace.spec.json` nulo con entidades existentes).
- Riesgo operativo: sin `npm` local no se puede validar build/test en este entorno hasta tener Node/npm disponible.

### 8) Quick wins
- Exponer `GET /studio/canonical-state` sin romper `/studio/state`.
- Separar navegación en 3 superficies nuevas reutilizando UI ya existente.
- Reetiquetar Studio actual como `Workspace Studio base` (sin reescritura grande).
- Reusar `deploy + versions` para mostrar diff/apply/rollback en un solo panel.
- Mostrar Agency Topology inicialmente con controles reales fail-closed (estado explícito “unsupported by runtime” cuando aplique).

## Primer lote de cambios propuestos (small patches, reviewables)

### Patch A — Canonical contracts + adapter (backend/frontend)
- Añadir tipos/schemas canónicos.
- Añadir adapter de estado actual a canonical.
- Exponer endpoint canónico en Studio.
- Consumirlo desde frontend sin romper rutas actuales.

### Patch B — Superficies base en frontend
- Crear `/agency-builder`, `/workspace-studio`, `/agency-topology`.
- Mantener `/studio` como alias temporal a `/workspace-studio`.
- Actualizar `NavRail` y contexto lateral.

### Patch C — Runtime topology fail-closed
- Agregar endpoints de acciones topológicas.
- Si gateway no soporta método: error explícito, sin mutación runtime falsa.
- UI muestra resultado real, no simulado.

### Patch D — Corefiles scaffolding unificado
- Crear façade backend `corefiles` (preview/diff/apply/rollback).
- Integrar panel base en Workspace Studio y Agency Builder.

## Cambios de API/interfaces públicas (iniciales)
- Nuevo `GET /api/studio/v1/studio/canonical-state`.
- Nuevos endpoints `POST /api/studio/v1/topology/:action`.
- Nuevo grupo `GET/POST /api/studio/v1/corefiles/*` (façade).
- Nuevos tipos frontend/backend: `AgencySpec`, `DepartmentSpec`, `WorkspaceSpecCanonical`, `TopologyLink`, `CoreFileDiffItem`.

## Test plan (por lote)
- Unit: adapter legacy→canonical, validaciones de schema canónico.
- API: `studio/canonical-state`, topology fail-closed, corefiles façade.
- Regression: `studio/state`, deploy preview/apply, versions rollback siguen funcionando.
- UI smoke: navegación 3 superficies, diff lifecycle visible, topology controls sin simulación.
- Comandos objetivo (cuando haya npm disponible): `npm install`, `npm run build`, `npm test`.

## Supuestos y defaults cerrados
- Estrategia: **Compat + Adapter**.
- Runtime topology: **Fail Closed** (sin éxito simulado).
- Persistencia inicial canónica: **JSON en `.openclaw-studio`**.
- Sin hard switch ni migración YAML-first en este bloque fundacional.
