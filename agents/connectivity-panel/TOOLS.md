# TOOLS.md - Conn 🔌

## Endpoints críticos a monitorear

- Gateway WS: ws://openclaw:18789
- Dashboard API: http://localhost:3000/api
- Health check: GET /api/status

## Infraestructura de red

- Proxy: Traefik (reverse proxy)
- DNS/CDN: Cloudflare
- Deploy host: Coolify
- Container network: Docker bridge

## Subagente disponible

- WS Probe 🔍 (ws-probe-panel) → diagnóstico profundo de WebSocket

## Modelos

- gpt-5.4-mini → principal
- github-copilot/gpt-4.1 → fallback 1
- deepseek/deepseek-chat → fallback 2
- openrouter/meta-llama/llama-3.3-70b:free → fallback 3

## Canal Discord

- #contreras → 1491583250974511244
