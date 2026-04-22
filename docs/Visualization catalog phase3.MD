---
name: visualization-catalog-phase-3
description: Catálogo maestro de visualizaciones del producto para Phase 3. Define propósito, prioridad, contrato backend, estados y criterios mínimos de implementación para cada chart.
version: 1.0
status: active
---

# Visualization Catalog — Phase 3
## dashboard-agentes

---

## 1. Objetivo

Este documento define el catálogo maestro de visualizaciones del producto para la siguiente fase de consolidación.

Su propósito es evitar dashboards pobres, visualizaciones improvisadas o gráficos sin función operativa clara.

Cada visualización documentada aquí debe tener:
- propósito de negocio
- pestaña propietaria
- prioridad
- contrato backend asociado
- estados vacíos/degradados/offline
- reglas de interacción
- criterio mínimo de implementación

Este documento **no** obliga a construir todas las visualizaciones en una sola iteración.
Sí obliga a preservarlas como objetivos oficiales del producto.

---

## 2. Principios de diseño

### 2.1 Principios funcionales

Toda visualización debe responder al menos una pregunta operativa real:
- ¿qué está pasando?
- ¿qué cambió?
- ¿qué está mal?
- ¿qué consume más?
- ¿qué scope está afectado?
- ¿qué acción debo tomar?

### 2.2 Principios de UX

- no usar gráficos sólo por decoración
- evitar saturación visual
- usar tiempo como filtro global cuando aplique
- privilegiar lectura rápida de operador
- el estado degradado/offline debe ser explícito, no roto
- permitir drilldown por scope cuando tenga sentido

### 2.3 Principios técnicos

- toda visualización debe mapear a un contrato backend explícito
- no usar datos mock en producción
- no renderizar un chart si el backend aún no soporta el dato
- si el dato no existe, mostrar estado `planned`, `unavailable` o `runtime_offline`

---

## 3. Sistema de prioridades

| Nivel | Descripción |
|-------|-------------|
| **P0** | Visualizaciones núcleo del operador. Deben construirse primero. |
| **P1** | Visualizaciones de consolidación fuerte. Enriquecen mucho el producto, pero no bloquean el núcleo. |
| **P2** | Visualizaciones avanzadas o de refinamiento. No deben retrasar P0/P1. |

---

## 4. Ownership por pestaña

| Pestaña | Responsabilidad |
|---------|----------------|
| **Administration / Overview** | Actividad, costo, sesiones, tokens, budget, latencia, mix de modelos. |
| **Administration / Connections** | Topología, salud de conexiones, routing, hooks, channels, relación entre capas, jerarquía estructural. |
| **Administration / Operations** | Runtime, estado operativo, acciones, governance, budgets, approvals, recent runs, riesgo operativo. |
| **Editor** | Readiness, herencia, versiones, profundidad de configuración, estado de completitud por entidad. |
| **Studio** | No es el hogar principal de charts analíticos pesados. Puede consumir pequeños widgets de apoyo, pero no absorbe el catálogo principal. |

---

## 5. Catálogo maestro por pestaña

---

### 5A. Administration › Overview

---

#### OV-01 — KPI Sparkline Cards
**Prioridad:** P0  
**Tipo:** KPI card + sparkline  
**Pregunta:** ¿cómo va el scope seleccionado en volumen y actividad?

**Métricas base:**
- Agents
- Active Sessions
- Runs
- Channels
- opcional: Running / Awaiting Approval / Paused / Snapshots

**Contrato backend:**
```
GET /dashboard/metrics/kpis?level=&id=&window=
```

**Shape esperado:**
```json
{
  "scope": { "level": "agency", "id": "agency-default" },
  "window": "24H",
  "cards": [
    {
      "key": "agents",
      "label": "Agents",
      "value": 12,
      "status": "ok",
      "series": [1, 2, 3, 4, 3, 5]
    }
  ],
  "runtime_state": "degraded"
}
```

**Estados obligatorios:** `normal` · `offline` · `degraded` · `empty/new scope`

**Notas UX:**
- si runtime offline, no ocultar la card: mostrar badge explícito
- sparkline debe degradar a línea plana o estado vacío, no romper

---

#### OV-02 — Runs 24h + Error Rate
**Prioridad:** P0  
**Tipo:** área + línea punteada  
**Pregunta:** ¿el volumen de runs crece normalmente o está creciendo junto con errores?

**Contrato backend:**
```
GET /dashboard/metrics/runs?level=&id=&window=&granularity=
```

**Campos mínimos:** `timestamp_bucket` · `runs_count` · `error_rate` · `retries_count` (opcional)

**Visual rule:**
- área azul → volumen de ejecuciones
- línea roja punteada → tasa de error

**Insights esperados:**
- runs altos + error estable = tráfico normal
- error sube sin volumen = retries / webhooks / infra fallando

---

#### OV-03 — Tokens Prompt vs Completion
**Prioridad:** P0  
**Tipo:** stacked area  
**Pregunta:** ¿los agentes están respondiendo con demasiada longitud?

**Contrato backend:**
```
GET /dashboard/metrics/tokens?level=&id=&window=&granularity=
```

**Campos mínimos:** `timestamp_bucket` · `prompt_tokens` · `completion_tokens`

**Insight esperado:** si completion crece demasiado vs prompt, revisar `max_tokens`, verbosity, escalation paths.

---

#### OV-04 — Sessions over Time
**Prioridad:** P0  
**Tipo:** bar chart / comparative daily bars  
**Pregunta:** ¿cómo se comporta la actividad de sesiones en el tiempo?

**Contrato backend:**
```
GET /dashboard/metrics/sessions?level=&id=&window=&granularity=
```

**Campos mínimos:** `day_or_hour` · `sessions_count` · `highlight_today` (boolean, opcional)

---

#### OV-05 — Budget Usage
**Prioridad:** P0  
**Tipo:** bullet chart o gauge  
**Pregunta:** ¿qué porcentaje del presupuesto estamos consumiendo y contra qué umbrales?

**Contrato backend:**
```
GET /dashboard/metrics/budget?level=&id=&window=
```

**Campos mínimos:** `current_usage_pct` · `soft_cap_pct` · `hard_cap_pct` · `current_spend` · `budget_limit`

---

#### OV-06 — Model Mix
**Prioridad:** P0  
**Tipo:** donut  
**Pregunta:** ¿qué modelos están consumiendo más en el scope activo?

**Contrato backend:**
```
GET /dashboard/metrics/model-mix?level=&id=&window=
```

**Campos mínimos:** `model` · `spend_pct` · `spend_amount` · `role` (opcional: primary, fallback, tool-overhead, etc.)

---

#### OV-07 — Model Spend Ranked
**Prioridad:** P0  
**Tipo:** ranked horizontal bar  
**Pregunta:** ¿cómo se distribuye el gasto por modelo en orden?

**Contrato backend:**
```
GET /dashboard/metrics/model-mix?level=&id=&window=
```

---

#### OV-08 — Model Spend Treemap
**Prioridad:** P1  
**Tipo:** treemap  
**Pregunta:** ¿qué modelos ocupan visualmente más parte del presupuesto?

**Contrato backend:** reutilizable desde model mix.

---

#### OV-09 — Latency P50 / P95 by Model
**Prioridad:** P0  
**Tipo:** stacked horizontal bar  
**Pregunta:** ¿qué modelos son más variables o lentos?

**Contrato backend:**
```
GET /dashboard/metrics/latency?level=&id=&window=
```

**Campos mínimos:** `model` · `p50_ms` · `p95_ms`

---

#### OV-10 — Sessions Heatmap
**Prioridad:** P1  
**Tipo:** heatmap  
**Pregunta:** ¿en qué horas/días está viva la plataforma?

**Contrato backend:**
```
GET /dashboard/metrics/sessions-heatmap?level=&id=&window=
```

**Campos mínimos:** `weekday` · `hour` · `sessions_count`

---

#### OV-11 — Runs ↔ Tokens Correlation
**Prioridad:** P1  
**Tipo:** scatter  
**Pregunta:** ¿qué momentos del día tienen runs anormalmente costosos?

**Contrato backend:**
```
GET /dashboard/metrics/runs-token-correlation?level=&id=&window=
```

**Campos mínimos:** `hour_bucket` · `runs_count` · `total_tokens`

---

#### OV-12 — Budget Forecast
**Prioridad:** P1  
**Tipo:** line projection  
**Pregunta:** ¿si seguimos esta tendencia, cuándo llegamos a soft cap o hard cap?

**Contrato backend:**
```
GET /dashboard/metrics/budget-forecast?level=&id=&window=
```

---

### 5B. Administration › Connections

---

#### CN-01 — Meters
**Prioridad:** P0  
**Tipo:** bullet/meter bars  
**Métricas:** Supported edges · Hook coverage · Routing stability · Handoff pressure

**Contrato backend:**
```
GET /dashboard/connections/metering?level=&id=&window=
```

**Campos mínimos:** `metric_key` · `actual_pct` · `target_pct` · `status`

---

#### CN-02 — Radial Summaries
**Prioridad:** P0  
**Tipo:** donut trio  
**Métricas:** edges · hooks · channels

**Contrato backend:**
```
GET /dashboard/connections/radial?level=&id=&window=
```

---

#### CN-03 — Dependency Graph
**Prioridad:** P0  
**Tipo:** graph  
**Pregunta:** ¿dónde están las conexiones activas y qué capa concentra más tráfico?

**Contrato backend:**
```
GET /dashboard/connections/dependency-graph?level=&id=&window=
```

**Campos mínimos:** `nodes` · `edges` · `edge_weight` · `active_count` por nodo

---

#### CN-04 — Visual Topology
**Prioridad:** P0  
**Tipo:** graph  
**Pregunta:** ¿cómo se relacionan scope, routing, channels, hooks, ops y flows?

**Contrato backend:**
```
GET /dashboard/connections/topology?level=&id=&window=
```

---

#### CN-05 — Flow Graph / Sankey
**Prioridad:** P0  
**Tipo:** sankey  
**Pregunta:** ¿cómo fluye el mensaje desde scope → routing → channels → hooks/handoffs?

**Contrato backend:**
```
GET /dashboard/connections/flow-graph?level=&id=&window=
```

---

#### CN-06 — Routing Decision Flowchart
**Prioridad:** P1  
**Tipo:** flowchart  
**Pregunta:** ¿qué decisiones de negocio toman el routing y el lifecycle?

**Contrato backend:**
```
GET /dashboard/connections/routing-decision-flow?level=&id=
```

---

#### CN-07 — Org Chart
**Prioridad:** P1  
**Tipo:** hierarchy tree  
**Pregunta:** ¿cómo está organizada la estructura Agency → Dept → WS → Agent?

**Contrato backend:**
```
GET /dashboard/connections/org-chart?level=&id=
```

---

#### CN-08 — Hierarchy Sunburst
**Prioridad:** P1  
**Tipo:** sunburst  
**Pregunta:** ¿cómo se distribuye visualmente la jerarquía completa?

**Contrato backend:**
```
GET /dashboard/connections/hierarchy?level=&id=&mode=sunburst
```

---

#### CN-09 — Hierarchy Treemap
**Prioridad:** P1  
**Tipo:** treemap  
**Pregunta:** ¿qué workspaces/agentes concentran más actividad?

**Contrato backend:**
```
GET /dashboard/connections/hierarchy?level=&id=&mode=treemap
```

---

### 5C. Administration › Operations

---

#### OP-01 — Runtime State Machine
**Prioridad:** P0  
**Tipo:** state machine diagram  
**Pregunta:** ¿en qué estado está el runtime y qué acciones están disponibles?

**Contrato backend:**
```
GET /dashboard/operations/runtime-state?level=&id=
```

---

#### OP-02 — Recent Runs Timeline
**Prioridad:** P0  
**Tipo:** timeline / lane chart  
**Pregunta:** ¿cómo se distribuyen los últimos runs por status?

**Contrato backend:**
```
GET /dashboard/operations/recent-runs?level=&id=&window=
```

---

#### OP-03 — Alert Severity Timeline
**Prioridad:** P0  
**Tipo:** event timeline  
**Pregunta:** ¿los errores son recurrentes o nuevos?

**Contrato backend:**
```
GET /dashboard/operations/alerts?level=&id=&window=
```

---

#### OP-04 — Operational Actions Heatmap
**Prioridad:** P1  
**Tipo:** heatmap  
**Pregunta:** ¿qué acciones operativas usa más cada dept?

**Contrato backend:**
```
GET /dashboard/operations/actions-heatmap?level=&id=&window=
```

---

#### OP-05 — Cost Budget Gauge
**Prioridad:** P0  
**Tipo:** gauge  
**Pregunta:** ¿cuánto presupuesto del scope llevamos consumido?

**Contrato backend:**
```
GET /dashboard/operations/budgets?level=&id=&window=
```

---

#### OP-06 — Cost Budgets by Model / Role
**Prioridad:** P0  
**Tipo:** stacked bar  
**Pregunta:** ¿qué modelo consume Primary, Fallback, Long context, Tool overhead?

**Contrato backend:**
```
GET /dashboard/operations/cost-profile?level=&id=&window=
```

---

#### OP-07 — Pending Actions Stacked Bar
**Prioridad:** P1  
**Tipo:** stacked bar  
**Pregunta:** ¿qué tipos de acciones pendientes se acumulan?

**Contrato backend:**
```
GET /dashboard/operations/pending-actions?level=&id=&window=
```

---

#### OP-08 — Governance Widgets
**Prioridad:** P0  
**Tipo:** cards + controls + badges  
**Pregunta:** ¿qué reglas operativas están activas en este scope?

**Contrato backend:**
```
GET   /dashboard/operations/policies?level=&id=
PATCH /operations/policies
PATCH /operations/budgets
```

**Campos mínimos:** `soft_cap` · `hard_cap` · `require_approval` · `replay_budget` · `escalation_threshold` · `per_model_caps` · `inheritance_source` · `effective_value`

---

### 5D. Editor

---

#### ED-01 — Readiness Radar
**Prioridad:** P0  
**Tipo:** radar  
**Pregunta:** ¿qué tan configurada está esta entidad en 6 dimensiones?

**Contrato backend:**
```
GET /editor/readiness?level=&id=
```

**Dimensiones:** Identity · Behavior · Assignment · Versions · Catalog · Operations

---

#### ED-02 — Section Stepper
**Prioridad:** P0  
**Tipo:** stepper  
**Pregunta:** ¿qué secciones están completas, bloqueadas o pendientes?

**Contrato backend:**
```
GET /editor/section-status?level=&id=
```

---

#### ED-03 — Inheritance / Override Matrix
**Prioridad:** P0  
**Tipo:** matrix  
**Pregunta:** ¿qué viene heredado y qué es override local?

**Contrato backend:**
```
GET /editor/inheritance?level=&id=
```

---

#### ED-04 — Versions Timeline
**Prioridad:** P0  
**Tipo:** vertical timeline  
**Pregunta:** ¿qué versiones hay, cuál es current, cuál draft y cuáles rollback points?

**Contrato backend:**
```
GET /editor/versions?level=&id=
```

---

#### ED-05 — Workspace Readiness Bars
**Prioridad:** P1  
**Tipo:** grouped progress bars  
**Pregunta:** ¿qué workspace está más listo o más incompleto?

**Contrato backend:**
```
GET /editor/readiness-by-workspace?level=&id=
```

---

#### ED-06 — Dependency Tree
**Prioridad:** P1  
**Tipo:** tree  
**Pregunta:** ¿de qué depende esta entidad?

**Contrato backend:**
```
GET /editor/dependencies?level=&id=
```

---

## 6. Estados obligatorios por visualización

Toda visualización debe soportar los siguientes estados:

| Estado | Descripción |
|--------|-------------|
| `ready` | datos disponibles y frescos |
| `loading` | petición en vuelo |
| `empty` | sin datos para el scope/ventana |
| `runtime_offline` | runtime no disponible |
| `runtime_degraded` | runtime parcialmente disponible |
| `unsupported_for_scope` | el gráfico no aplica a este nivel |
| `planned_not_operational` | endpoint aún no construido |

---

## 7. Ventanas temporales soportadas

Cuando aplique, todas las visualizaciones deben aceptar:

`1H` · `4H` · `6H` · `8H` · `12H` · `24H` · `3D` · `7D` · `15D` · `1M` · `2M` · `3M` · `1Y`

---

## 8. Librería recomendada

### Frontend
- **ECharts** como base principal para la mayoría de charts
- **D3** sólo para Sankey / grafos muy custom / treemap avanzado
- wrappers reutilizables por estado en todos los componentes

### Backend
Los contratos deben ser:
- scope-aware (`level` + `id`)
- window-aware (`window`)
- granularity-aware cuando aplique (`granularity`)

---

## 9. Regla de implementación

Todas las visualizaciones de este catálogo son **objetivos oficiales del producto**.
No todas deben construirse ya.

**Obligación del equipo:**
1. documentarlas todas ✓ (este documento)
2. priorizarlas por P0 → P1 → P2
3. mapearlas por pestaña propietaria
4. asociarlas a contrato backend antes de construir
5. construir primero P0, luego P1, luego P2

---

## 10. Definición de Done del catálogo

Este documento está completo cuando:
- todas las visualizaciones están documentadas con su ID
- cada una tiene pestaña propietaria asignada
- cada una tiene prioridad definida
- cada una tiene contrato backend asociado
- cada una tiene estados operativos definidos
- el equipo puede tomar este documento como backlog visual oficial
