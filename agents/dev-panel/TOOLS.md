# TOOLS.md - Dev Panel 💻

## Repositorio

- Repo: github.com/lssmanager/dashboard-agentes
- Branch principal: main
- Deploy automático: Coolify detecta push a main

## Estructura del proyecto

```
backend/
  server.js          — Express entry point
  routes/
    api.js           — Rutas API REST
    gateway-client.js — Cliente WebSocket al Gateway
frontend/
  index.html         — SPA entry point
.data/
  workspaces-topology.json — Topología de agentes
agents/              — Perfiles de agentes
```

## Modelos disponibles

- gpt-5.3-codex → principal (razonamiento de código)
- deepseek/deepseek-reasoner → fallback 1 (análisis profundo)
- openrouter/qwen/qwen-code:free → fallback 2
- openrouter/gpt-oss-120b:free → fallback 3

## Canal Discord

- #devia → 1491582962637209750
