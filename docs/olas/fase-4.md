# Ola fase-4 — Mapa y hallazgos

**Rama:** `ola/fase-4` · **Changes:** `fase-4-mapa-y-hallazgos` · **Abierta:** 2026-10-21

## Arranque

- Base: `master` @ `c6ee6d2` (#34); avanzada por fast-forward a `6dbde11` (#35, decisiones de la fase 4 en `docs/PLAN.md` y `docs/STACK.md`, solo `docs/`) antes del primer encargo. Sin avance continuo; la PR de ola apunta a `master`.
- `preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft).
- `verify` sobre la base: verde en `c6ee6d2` (53 archivos, 849 tests) y en `6dbde11` desde el worktree del grupo 1 (849 tests, enlaces del worktree OK).
- `sistema` sobre la base (`c6ee6d2`): 4/4 en verde. Sin specs heredados inestables.
- OpenSpec: `openspec validate fase-4-mapa-y-hallazgos --strict` pasa; `instructions apply` en `ready`, 0/12, 4 `contextFiles` de specs más proposal, design y tasks, sin `context` ni `operationGuidance`.
- Inventario de lo que el equipo no puede procurarse: nada. Sin `[PENDIENTE]` en los artefactos; sin dependencias nuevas; `npm ci` del gancho `preparar` funcionó al montar el worktree del grupo 1.
- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-4`), con su propio `node_modules`.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | fase-4-mapa-y-hallazgos · 1.1–1.4 | `feat/fase-4-domain-findings` | en curso |
| — | fase-4-mapa-y-hallazgos · 2.1–2.2 | `feat/fase-4-map-chart` | pendiente |
| — | fase-4-mapa-y-hallazgos · 3.1 | `feat/fase-4-client-findings-panel` | pendiente |
| — | fase-4-mapa-y-hallazgos · 4.1–4.3 | `feat/fase-4-client-thresholds` | pendiente |
| — | fase-4-mapa-y-hallazgos · 5.1–5.2 | `feat/fase-4-client-map-system` | pendiente |

## Decisiones del PM

- **D-U1 (usuario).** Decisión 1 del pre-vuelo: (b), los umbrales ajustados se conservan en el navegador (`localStorage`). Descartado: (a) solo en memoria y (c) en disco por el servidor.
- **D-TM2 (Team Manager).** Decisión 2: (a), los hallazgos siguen al filtro, sobre el conjunto filtrado y su periodo (`design.md` D6).
- **D-TM3 (Team Manager).** Decisión 3: (a), los puntos del mapa salen de campos nuevos en `Metricas` (`design.md` D8).
- **D-TM4 (Team Manager).** Decisión 4: (a), el mapa abre encuadrado en la ciudad principal, con zoom y desplazamiento (`design.md` D9).
- Las cuatro coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.
- El grupo 1 (~650 líneas estimadas) pasa un poco del objetivo de 600; no se parte: la ola ya está en el tope de 5 PRs y el pre-vuelo lo aceptó. Descartado: partirlo y escalar por una sexta PR.

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- Fase 5 (exportar) y lo que `proposal.md` declara fuera de alcance.

## Entorno vivo

- Worktree del PM `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-4`).
- Worktree del grupo 1 `/home/fabs/da-wt/tablero-gastos/f4-g1` (`feat/fase-4-domain-findings`).

## Coste

- —

## Handover

- —
