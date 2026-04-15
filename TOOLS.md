# TOOLS.md - Local Notes

_Configuración específica del entorno del cluster panel. Aquí van los detalles que son únicos de este setup._

## Cluster: panel

### Agentes Principales

| ID | Nombre | Canal | Canal ID | Modelo |
|----|--------|-------|----------|--------|
| orquestador-panel | Panel 🗂️ | #panel | 1491563594184130723 | gpt-5.4-mini |
| dev-panel | Dev Panel 💻 | #devia | 1491582962637209750 | gpt-5.3-codex |
| connectivity-panel | Conn 🔌 | #contreras | 1491583250974511244 | gpt-5.4-mini |
| monitoring-panel | Monitor 📊 | #monica | 1491583332478095400 | gpt-5.4-mini |

### Subagentes (sin canal propio)

| ID | Nombre | Especialidad |
|----|--------|-------------|
| ui-fixer-panel | UI Fixer 🎨 | Frontend, CSS, componentes UI |
| api-coder-panel | API Coder 🔗 | Rutas API, lógica backend |
| ws-probe-panel | WS Probe 🔍 | WebSocket, diagnósticos de red |
| cost-watcher-panel | Cost Watcher 💰 | Costos API, optimización tokens |

## Fallbacks por Modelo

```
gpt-5.4       → github-copilot/gpt-4.1 → deepseek/deepseek-chat → openrouter/nvidia/nemotron-3-super:free
gpt-5.4-mini  → github-copilot/gpt-4.1 → deepseek/deepseek-chat → openrouter/meta-llama/llama-3.3-70b:free
gpt-5.3-codex → deepseek/deepseek-reasoner → openrouter/qwen/qwen-code:free → openrouter/gpt-oss-120b:free
```

## Infraestructura

```
Gateway URL:    ws://openclaw:18789
Data file:      /app/data/workspaces-topology.json
Deploy:         Coolify + Nixpacks
Proxy:          Traefik + Cloudflare
Discord:        Bot conectado al cluster panel
```

## Canales Discord → Canal ID

```
#panel     → 1491563594184130723  (Panel — Orquestador)
#devia     → 1491582962637209750  (Dev Panel)
#contreras → 1491583250974511244  (Conn)
#monica    → 1491583332478095400  (Monitor)
```

---

_Mantén este archivo actualizado cuando cambien IDs, modelos o canales._
