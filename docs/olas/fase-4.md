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
| #36 | fase-4-mapa-y-hallazgos · 1.1–1.4 | `feat/fase-4-domain-findings` | mergeada (`87db854`) — 0 mecánicas · 1 ronda · 0 por corrección; NO LISTA en la pasada 1 (1 BLOQUEA de test: la mezcla de umbrales parciales sin proteger, más 3 NO BLOQUEA corregidos en la ronda), LISTA en la pasada 2 con 2 NO BLOQUEA aceptados |
| — | fase-4-mapa-y-hallazgos · 2.1–2.2 | `feat/fase-4-map-chart` | en curso |
| — | fase-4-mapa-y-hallazgos · 3.1 | `feat/fase-4-client-findings-panel` | en curso |
| — | fase-4-mapa-y-hallazgos · 4.1–4.3 | `feat/fase-4-client-thresholds` | pendiente |
| — | fase-4-mapa-y-hallazgos · 5.1–5.2 | `feat/fase-4-client-map-system` | pendiente |

## Decisiones del PM

- **D-U1 (usuario).** Decisión 1 del pre-vuelo: (b), los umbrales ajustados se conservan en el navegador (`localStorage`). Descartado: (a) solo en memoria y (c) en disco por el servidor.
- **D-TM2 (Team Manager).** Decisión 2: (a), los hallazgos siguen al filtro, sobre el conjunto filtrado y su periodo (`design.md` D6).
- **D-TM3 (Team Manager).** Decisión 3: (a), los puntos del mapa salen de campos nuevos en `Metricas` (`design.md` D8).
- **D-TM4 (Team Manager).** Decisión 4: (a), el mapa abre encuadrado en la ciudad principal, con zoom y desplazamiento (`design.md` D9).
- Las cuatro coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.
- **Errata de `tasks.md` 1.2 (PR #36, `openspec-update-change`).** «5 sí con umbral 4» → «5 sí con umbral 5», alineado con el escenario «Cinco días con umbral 4» del spec. Descartado: dejar la contradicción para el Archivador.
- **Periodo por defecto de `hallazgos` (PR #36).** Sin `periodo`, `hallazgos` lo deja a `metricas` y `viajes` no recorta por mes (R-08: una carga es un solo mes; el cliente pasa `periodoDelFiltro`). Descartado: exportar `periodoDelMesDe` desde `calendario.ts` para usarlo en ambos módulos. El crítico lo aceptó.
- **Mutante equivalente aceptado (PR #36).** Aceptar un promedio de grupo 0 da razón 0, que no alcanza ningún umbral positivo; `leerUmbral` y `leerUmbralesGuardados` rechazan umbrales ≤ 0.
- **graft.** El grafo se reconstruye sobre el checkout principal, que sigue en `master` antiguo (no se cambia su rama): no refleja `ola/fase-4`. Los encargos piden leer el código del worktree, no graft.
- **Grupos 2 y 3 en paralelo** tras #36, en worktrees disjuntos (`f4-g2`: `src/dominio/metricas.ts`, `src/graficas/`, `tests/graficas/`, test nuevo del mapa en `tests/dominio/`; `f4-g3`: `src/cliente/`, `tests/cliente/`). Revisión y merge en serie. El grupo 4 no se lanza hasta mergear el 3; el relevo de las 3 PRs cae tras el segundo de estos merges.
- El grupo 1 (~650 líneas estimadas) pasa un poco del objetivo de 600; no se parte: la ola ya está en el tope de 5 PRs y el pre-vuelo lo aceptó. Descartado: partirlo y escalar por una sexta PR.

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- **Docstring de `hallazgos` (#36, crítico pasada 2, Comentarios y citas 1).** `src/dominio/hallazgos.ts:170-171` dice «sin él, el mes de las transacciones»; para `viajes` sin periodo son todas las transacciones. Por R-08 es lo mismo; no es falso. Impacto hoy: ninguno. Si no se hace: una lectura futura puede suponer un recorte que no ocurre.

## Se coló

- —

## Lo que queda fuera

- Fase 5 (exportar) y lo que `proposal.md` declara fuera de alcance.

## Entorno vivo

- Worktree del PM `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-4`).
- Worktree del grupo 2 `/home/fabs/da-wt/tablero-gastos/f4-g2` (`feat/fase-4-map-chart`).
- Worktree del grupo 3 `/home/fabs/da-wt/tablero-gastos/f4-g3` (`feat/fase-4-client-findings-panel`).

## Coste

- —

## Handover

- —
