# TOOLS.md - UI Fixer 🎨

## Frontend del proyecto

- Directorio: /frontend
- Entry point: index.html
- Estilo: CSS propio (sin framework)
- Sin build step — HTML/CSS/JS estático

## Patrones visuales del dashboard

- Estados de agentes: badges con color (verde=activo, rojo=error, gris=inactivo)
- Tablas de topología de agentes
- Panel de métricas de monitoreo
- Logs en tiempo real vía WebSocket

## Modelos

- gpt-5.4-mini → principal
- github-copilot/gpt-4.1 → fallback 1
- deepseek/deepseek-chat → fallback 2
- openrouter/meta-llama/llama-3.3-70b:free → fallback 3
