# 🔍 Dashboard Diagnostic System

## Overview

El dashboard ahora incluye un sistema completo de diagnóstico que identifica automáticamente:

- ❌ Si el servidor backend (Express) no responde
- ❌ Si el endpoint `/api/dashboard/state` está fallando
- ⚠️ Si el Gateway de OpenClaw está offline
- ⚠️ Si no hay workspaces o agentes configurados
- ✅ Estado completo del sistema con datos detallados

## Components Creados

### 1. **DiagnosticService** (`frontend/services/diagnostic-service.js`)

Helper que verifica automáticamente el estado de la conexión:

```javascript
// Uso manual en consola:
await window.diagnosticService.runDiagnostics();
console.log(window.diagnosticService.diagnostics);

// O ver el mensaje de estado:
const status = window.diagnosticService.getStatusMessage();
console.log(status);
```

**Verificaciones que hace:**
- Backend `/health` disponible
- Endpoint `/api/dashboard/state` funciona
- Gateway está reachable (según el backend)
- Datos están siendo retornados (workspaces + agentes)

### 2. **DiagnosticPanel** (`frontend/components/diagnostic-panel.js`)

Modal visual que muestra:
- 🟢 Estado actual (OK, WARNING, CRITICAL)
- 📋 Detalles técnicos (URLs, intentos, errores)
- 📊 Estadísticas (workspaces encontrados, agentes, etc.)
- 🔘 Botones para reintentara diagnóstico o recargar

## Auto-Triggers

El panel de diagnóstico se muestra **automáticamente** en estos casos:

1. **Errores Críticos (CRITICAL)**
   - Backend no responde → "Backend Server Unreachable"
   - API endpoint falla → "Cannot Fetch Dashboard Data"

2. **Advertencias (WARNING)**
   - Gateway offline → Muestra URL que no responde
   - Sin datos → Sugiere revisar `openclaw.yaml`

## Mejorados Logs Detallados

Ahora la consola muestra logs muy informativos:

```
[APP] ═══════════════════════════════════════════════════
[APP] 🚀 Starting OpenClaw Dashboard...
[APP] ═══════════════════════════════════════════════════
[APP] Page URL: http://localhost:3000
[APP] API Base: http://localhost:3000
[APP] ✅ Gateway client initialized
[APP] ⏳ Waiting for components to load...
[APP] ✅ All components loaded
[APP] 🔧 Initializing components...
[APP] 📌 Setting up event listeners...
[APP] 📥 Running initial data fetch...
[APP] 📡 Fetching dashboard state from backend API...
[APP] ✅ Received data from backend
[APP]   - Connected: true
[APP]   - Workspaces: 1
[APP]   - Total Agents: 3
[APP] 🔄 Workspace data changed, updating...
[APP] 📌 Auto-selected workspace: default
[APP]   - Sessions: 5
[APP]   - Topology loaded
[APP] ✅ Refresh successful (245ms)
[APP] ═══════════════════════════════════════════════════
[APP] ✅ Dashboard initialized successfully!
[APP] ═══════════════════════════════════════════════════
```

## Troubleshooting Guide

### ❌ Problema: "Backend Server Unreachable"

**Causas posibles:**
- Express server no está corriendo en puerto 3000
- Firewall bloqueando conexión

**Solución:**
```bash
# 1. Verifica que el servidor está corriendo
npm start

# 2. En otra terminal, verifica conectividad:
curl http://localhost:3000/api/health

# 3. Si ves respuesta JSON, el backend está OK
```

---

### ❌ Problema: "Cannot Fetch Dashboard Data"

**Causas posibles:**
- Gateway no está en la URL configurada
- `GATEWAY_URL` en `.env` es incorrecta
- Error en backend communicating con Gateway

**Solución:**
```bash
# 1. Revisa el .env
cat .env

# 2. Verifica que la URL del Gateway es correcta
# Por defecto: http://openclaw:18789

# 3. Si usas localhost:
# Cambia GATEWAY_URL en .env a http://localhost:18789

# 4. Reinicia el servidor:
npm start
```

---

### ⚠️ Problema: "Gateway Offline"

Dashboard está conectado pero el Gateway no responde.

**Solución:**
- Espera a que el Gateway inicie (puede tardar)
- El dashboard reintentará automáticamente cada 30 segundos
- Ver consola para logs detallados

---

### ⚠️ Problema: "No Data Available"

Connected pero sin workspaces o agentes.

**Causas:**
- `openclaw.yaml` no tiene workspaces configurados
- Gateway no ha descubierto agentes

**Solución:**
```bash
# 1. Verifica tu openclaw.yaml tiene:
cat openclaw.yaml | grep -A5 "workspaces:"

# 2. Reinicia OpenClaw
# 3. El dashboard reintentará cada 30s
```

---

## Vista de Estado Real en Vivo

En la esquina superior central, el elemento "Last Refresh" muestra:

- ✅ `✅ Synced 14:32:45` → Todo OK, datos actualizándose
- ⏳ `⏳ Loading...` → Intentando cargar, animación pulsante
- ❌ / ⚠️ `⚠️ Warning...` → Problema detectado (ver panel)

## Datos de Debug Copiables

Desde el panel de diagnóstico, puedes clickear "Copy Debug Info" para obtener un JSON con:

```json
{
  "backendReachable": true,
  "gatewayReachable": true,
  "dataLoading": true,
  "dataAvailable": true,
  "agentsFound": 3,
  "workspacesFound": 1,
  "gatewayUrl": "http://openclaw:18789",
  "backendUrl": "http://localhost:3000",
  "attempts": 1,
  "url": "http://localhost:3000/",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2026-04-07T14:32:45.123Z"
}
```

Perfect para reportar bugs o pedir help.

## En Resumen

✅ El dashboard **identifica automáticamente** qué está mal
✅ Muestra **paneles claros** en lugar de solo "Loading"
✅ **Logs detallados** en consola para debugging
✅ **Reintentos automáticos** cada 30s
✅ **Info copiable** para reportar problemas
