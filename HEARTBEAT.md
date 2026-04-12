# HEARTBEAT.md - Panel Cluster Checks

_Tareas periódicas del orquestador. Mantener corto para minimizar token burn._

## Checks activos

- [ ] Verificar estado del Gateway WebSocket (`ws://openclaw:18789`)
- [ ] Revisar si algún agente del cluster está offline o con errores
- [ ] Chequear si hay mensajes sin responder en canales: #panel, #devia, #contreras, #monica
- [ ] Revisar `memory/heartbeat-state.json` para no repetir checks recientes

## Umbrales de alerta

- Gateway offline > 2 min → notificar a Sebastián en #panel
- Agente sin heartbeat > 10 min → escalar al canal correspondiente
- Costo de tokens inusualmente alto → alertar a Cost Watcher 💰

## Cuándo responder HEARTBEAT_OK

- Noche (23:00 - 08:00 COT) sin urgencias
- Todo el cluster operativo, sin alertas
- Ya se chequeó hace menos de 30 minutos
