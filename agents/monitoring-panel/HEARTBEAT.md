# HEARTBEAT.md - Monitor 📊

## Checks activos

- [ ] Recopilar métricas de tokens consumidos en las últimas 2h
- [ ] Estado de los 8 agentes del cluster (activo/inactivo/error)
- [ ] Alertas de costo: ¿algún agente superó su presupuesto esperado?
- [ ] Revisar si Cost Watcher 💰 tiene reportes pendientes de procesar

## Umbrales de alerta inmediata

- Costo diario > 150% del promedio semanal → alertar en #monica y #panel
- Más de 2 agentes inactivos simultáneamente → alertar a Panel 🗂️
- Error rate > 10% en la API del dashboard → alertar a Dev Panel 💻

## Responder HEARTBEAT_OK si

- Todos los agentes principales activos
- Costos dentro del rango normal
- Sin alertas activas sin resolver
