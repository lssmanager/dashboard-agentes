# HEARTBEAT.md - Panel 🗂️

## Checks activos

- [ ] Estado del Gateway WebSocket (ws://openclaw:18789)
- [ ] Todos los agentes principales respondiendo en sus canales
- [ ] Sin alertas pendientes de Monitor 📊 o Conn 🔌
- [ ] Revisar memory/heartbeat-state.json para no repetir checks recientes

## Umbrales

- Gateway offline > 2 min → notificar en #panel
- Agente sin heartbeat > 10 min → escalar al canal correspondiente
- Responder HEARTBEAT_OK si todo está nominal y fue chequeado hace < 30 min
