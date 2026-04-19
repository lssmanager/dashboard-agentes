---
name: visual-ui
description: Estandariza interfaces React con un sistema visual reutilizable (tokens, tipografias, componentes base y theming light/dark). Use cuando Codex deba modernizar, unificar o escalar la UI de apps React (dashboards, SaaS, admin panels, formularios o landing pages) sin cambiar la logica del producto.
---

# Visual UI

Implementar una capa visual consistente en React usando la plantilla incluida en `assets/templates/react`.

## Workflow

1. Auditar estilos actuales y localizar hardcodes de color/espaciado/tipografia.
2. Integrar tokens globales desde `assets/templates/react/src/styles`.
3. Mapear botones, inputs, cards y badges existentes a los patrones base.
4. Integrar `ThemeProvider` y `useTheme` para `light` por defecto y `dark` opcional.
5. Mantener estructura y comportamiento; no alterar logica de negocio.
6. Verificar consistencia visual en estados hover, focus, disabled y error.

## Guardrails

- No modificar routing, data fetching ni reglas de negocio.
- Evitar colores hardcoded cuando exista token equivalente.
- Mantener variantes reutilizables (`primary`, `secondary`, `accent`).
- Mantener estados semanticos (`success`, `warning`, `error`, `info`).
- No usar `localStorage` para el tema salvo que el proyecto ya lo use.
- Evitar gradientes en botones/cards y evitar superficies amarillas saturadas.

## Template Source

Usar como baseline:

- `assets/templates/react/src/styles/tokens.css`
- `assets/templates/react/src/styles/base.css`
- `assets/templates/react/src/styles/components.css`
- `assets/templates/react/src/theme/ThemeProvider.tsx`
- `assets/templates/react/src/theme/useTheme.ts`
- `assets/templates/react/src/components/*`

## Output Criteria

Entregar una UI con:

- Tema `light` por defecto y `dark` opcional.
- Tokens centralizados y faciles de mantener.
- Componentes base coherentes entre pantallas.
- Mejor legibilidad, jerarquia y consistencia visual.
- Cero cambios funcionales fuera del theming/integracion visual.
