# TOOLS.md - API Coder 🔗

## Backend del proyecto

- Entry point: backend/server.js
- Rutas: backend/routes/api.js
- Gateway client: backend/routes/gateway-client.js
- Puerto: 3000 (default)
- Gateway: ws://openclaw:18789

## Patrones de la API existente

- Todas las rutas bajo /api
- Respuestas JSON con estructura {data, error, code}
- Error handling centralizado en server.js
- Proxy trust habilitado para Coolify/Traefik

## Modelos

- gpt-5.3-codex → principal
- deepseek/deepseek-reasoner → fallback 1
- openrouter/qwen/qwen-code:free → fallback 2
- openrouter/gpt-oss-120b:free → fallback 3
