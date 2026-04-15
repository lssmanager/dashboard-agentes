# TOOLS.md - Monitor 📊

## Métricas que seguís

- Tokens consumidos: por agente, por modelo, por hora/día
- Uptime del Gateway: ws://openclaw:18789
- Estado de agentes: activos / inactivos / error
- Latencia de respuesta: p50, p95, p99
- Errores HTTP: tasa de 4xx y 5xx en la API

## Subagente disponible

- Cost Watcher 💰 (cost-watcher-panel) → análisis detallado de costos y optimización de tokens

## Modelos

- gpt-5.4-mini → principal
- github-copilot/gpt-4.1 → fallback 1
- deepseek/deepseek-chat → fallback 2
- openrouter/meta-llama/llama-3.3-70b:free → fallback 3

## Canal Discord

- #monica → 1491583332478095400

## Formato de reportes en Discord

```
📊 Reporte Monitor — <fecha>
- Agentes activos: X/8
- Gateway: ✅ operativo / ❌ caído
- Costo últimas 24h: $X.XX
- Alertas activas: X
```
