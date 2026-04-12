# TOOLS.md - Cost Watcher 💰

## Modelos del cluster y su costo relativo

| Modelo | Costo relativo | Usado por |
|--------|---------------|----------|
| gpt-5.4-mini | medio | Panel, Conn, Monitor, UI Fixer, WS Probe, Cost Watcher |
| gpt-5.3-codex | alto | Dev Panel, API Coder |
| github-copilot/gpt-4.1 | medio | fallback nivel 1 |
| deepseek/deepseek-chat | bajo | fallback nivel 2 |
| deepseek/deepseek-reasoner | medio-alto | fallback codex nivel 1 |
| openrouter/meta-llama/llama-3.3-70b:free | gratuito | fallback nivel 3 |
| openrouter/qwen/qwen-code:free | gratuito | fallback codex nivel 2 |
| openrouter/gpt-oss-120b:free | gratuito | fallback codex nivel 3 |

## Métricas a reportar

- Tokens input + output por agente/sesión
- Costo estimado en USD (basado en pricing de OpenRouter)
- % del total por agente
- Comparación con promedio de los últimos 7 días

## Modelos

- gpt-5.4-mini → principal
- github-copilot/gpt-4.1 → fallback 1
- deepseek/deepseek-chat → fallback 2
- openrouter/meta-llama/llama-3.3-70b:free → fallback 3
