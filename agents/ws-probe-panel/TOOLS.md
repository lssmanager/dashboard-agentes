# TOOLS.md - WS Probe 🔍

## Target principal

- Gateway WS: ws://openclaw:18789
- Dashboard backend: http://localhost:3000
- Gateway client code: /backend/routes/gateway-client.js

## Checklist de diagnóstico WS

1. DNS resolución del host openclaw
2. TCP port 18789 accesible
3. HTTP upgrade request correcto
4. Server acepta el upgrade (101 Switching Protocols)
5. Frames de ping/pong funcionando
6. Reconexión automática operativa
7. Proxy headers correctos (Traefik → X-Forwarded-*)

## Modelos

- gpt-5.4-mini → principal
- github-copilot/gpt-4.1 → fallback 1
- deepseek/deepseek-chat → fallback 2
- openrouter/meta-llama/llama-3.3-70b:free → fallback 3
