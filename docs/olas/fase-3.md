# Ola fase-3 — Historial y comparación

**Rama:** `ola/fase-3` · **Changes:** `fase-3-historial-y-comparacion` · **Abierta:** 2026-10-17

## Arranque

- Base: `chore/fase-3-planning` @ `75580f6` (sobre `ola/fase-2` @ `b19bb40`), por avance continuo del usuario; la PR de ola apunta a `chore/fase-3-planning`. Rama principal: `master`. Nadie mergea a `master` ni las PRs de la cadena (#3, #4, #8, #9, #15, #16, #23, #24).
- `preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft). `ola/fase-2` está en espera de merge (PR #23), no activa.
- `verify` sobre la base (`75580f6`): format:check, lint, typecheck, test y citas OK; 578 tests en 41 archivos.
- `sistema` sobre la base (`75580f6`): 3/3 (`flujo-principal`, `dashboard-filtrado`, `pagina-vacia`). Sin specs heredados inestables. Tras la corrida, `git status --ignored` del worktree no muestra `historial/`.
- OpenSpec: `fase-3-historial-y-comparacion`, `state: ready`, 0/17, sin `context` ni `operationGuidance`. Leídos proposal, design, tasks y los cinco deltas.
- `design.md` contrastado con el código: `esquema.ts:5-31`, `fecha.ts:13` y `:18`, `formato.ts:9-22`, `config.ts:24`, `static-server.ts:48-50`, `App.tsx:26-70`, `playwright.config.ts`, `tests/preparar-cliente.ts`, `flujo-principal.spec.ts:89-98`, `sin-red.ts:17-27`, 12 archivos y 37 montajes de `<App` en `tests/cliente/`; todo como dice. Cifras de los fixtures recalculadas por el PM con `csv` y `Decimal` de Python, fuera del tablero: totales 1 689 470.67, 1 544 622.78 y 1 278 296.56 (2 000 filas cada uno); Compras 814 566.30 / 201 746.52 / 197 076.86; Entretenimiento 258 692.09 / 847 205.02 / 164 574.61; Comida 260 686.59 / 172 038.57 / 693 983.87.
- Alcanzabilidad: el grupo 4 necesita la API servida por `npm start` (grupo 2); la spec del grupo 5 arranca `node dist-server/main.mjs`, que construye el script `start` del `webServer`. Nada inalcanzable.
- Nada que pedir al usuario: ninguna dependencia, credencial ni `[PENDIENTE]`; las decisiones 1 y 2 del pre-vuelo ya las confirmó el usuario.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | `fase-3-historial-y-comparacion` · 1.1–1.3 | `feat/fase-3-domain-schema-compare` | en curso |
| — | `fase-3-historial-y-comparacion` · 2.1–2.4 | `feat/fase-3-server-history-api` | pendiente |
| — | `fase-3-historial-y-comparacion` · 3.1–3.2 | `feat/fase-3-charts-compare` | pendiente |
| — | `fase-3-historial-y-comparacion` · 4.1–4.4 | `feat/fase-3-client-save-history` | pendiente |
| — | `fase-3-historial-y-comparacion` · 5.1–5.4 | `feat/fase-3-client-compare-system` | pendiente |

## Decisiones del PM

- **Decisión 1 del pre-vuelo (usuario, 2026-10-17): (a).** Guardado automático al aceptar la carga; si el mes ya existe (409), se pregunta sin ocultar el tablero. Descartado: botón «Guardar en el historial». Coincide con `design.md` D7.
- **Decisión 2 del pre-vuelo (usuario, 2026-10-17): (a).** La página lista y compara; borrar solo por la API. Descartado: borrar, o borrar y abrir un mes guardado, desde la página.
- **D-TM1 (Team Manager), decisión 3: (a).** `comparar` admite N meses, cada uno contra el anterior; la página compara dos, por defecto los dos más recientes. Descartado: mostrar todos los meses a la vez.
- **D-TM2 (Team Manager), decisión 4: (a).** Entran las peticiones tardías de la vigilancia, la marca de post-quincena de R-13 y una sola `conDescripcion`. Descartado: dejar la marca como deuda.
- **D-TM3 (Team Manager), decisión 5: (a).** Una sola ola de 5 PRs, con el grupo del servidor en ~800 líneas. Descartado: dos olas.
- Las cinco coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- —

## Se coló

- —

## Lo que queda fuera

- Mapa, hallazgos (R-16), exportar, abrir un mes guardado en el tablero, borrar desde la página, comparar con filtros (`docs/PLAN.md`, fase 3; decisión 2).
- WebSockets en la vigilancia, `Grafica.tsx` que recrea ECharts, CSS y rejilla, y la deuda de la fase 1 (D-TM2).

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-3`).

## Coste

- —

## Handover

- —
