# HEARTBEAT.md - Conn 🔌

## Checks activos

- [ ] Ping al Gateway WebSocket ws://openclaw:18789
- [ ] Verificar estado de Traefik (acceso a rutas del dashboard)
- [ ] Chequear latencia a APIs externas (OpenRouter, Discord)
- [ ] Revisar logs de error de conexión en los últimos 30 min

## Umbrales de alerta

- Gateway no responde > 2 min → alertar a Panel 🗂️ en #panel
- Latencia API > 5s sostenida → reportar en #contreras
- Error rate > 5% en últimos 100 requests → escalar

## Responder HEARTBEAT_OK si

- Gateway responde < 500ms
- Sin errores de conexión en los últimos 30 min
- Todas las APIs externas accesibles
