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
| #37 | fase-4-mapa-y-hallazgos · 2.1–2.2 | `feat/fase-4-map-chart` | mergeada (`71c7d79`) — 1 mecánica (texto visible de los ejes en `graficas`) · 0 rondas · 0 por corrección; LISTA en la pasada 1 con 4 NO BLOQUEA: 2 cerrados en la pasada final (`1caee13`, paleta a 3:1 y un comentario) con pasada corta LISTA, 2 aceptados |
| #38 | fase-4-mapa-y-hallazgos · 3.1 | `feat/fase-4-client-findings-panel` | mergeada (`8f479c3`) — 0 mecánicas · 1 ronda · 0 por corrección; NO LISTA en la pasada 1 (1 BLOQUEA de test: quincena y fin de semana sin aserción de su evidencia, más 4 NO BLOQUEA corregidos en la ronda, entre ellos la redacción «veces más», que era falsa), LISTA en la pasada 2 con 2 NO BLOQUEA aceptados |
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
- **Corte por límite de uso de la API (HTTP 429), 2026-10-21/22.** Cortó al crítico de la #37 (grupo 2) en su primera pasada; no lo paró el usuario. Al reanudar: sin servidores ni candado de `pesado` colgados (comprobado con `pgrep` y una toma del candado con `DA_LOCK_TIMEOUT=5`), y el mismo crítico reanudado por `SendMessage`, sin instancia nueva. No cuenta como pasada ni como ronda.
- **Panel de hallazgos como lista llana (grupo 3).** Las `<section>` vecinas tampoco tienen estilo propio (medido en el DOM); la tarjeta de los KPIs viene de `.dato`. Se acepta la lista sin CSS en el grupo 3; el grupo 4 añade controles dentro del panel y toca `estilos.css`. Descartado: devolver el grupo 3 por estilo.
- **Segunda literal de `Metricas` (grupo 2).** `tests/graficas/por-categoria.test.ts` también tenía una literal de `Metricas` que el pre-vuelo no contó; gana solo los 3 campos nuevos. Descartado: tratarlo como cambio fuera de alcance.

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- **Estilo del panel de hallazgos y su captura en contexto (#38, crítico pasada 1 NO BLOQUEA 4 y pasada 2 NO BLOQUEA 1).** El panel es una lista con viñetas sin estilo bajo las tarjetas de los KPIs, y `imgs/screenshots/38/panel-hallazgos-contexto-despues.png` quedó mal encuadrada en la retoma (corta el panel). Pasa al grupo 4, que toca `estilos.css` y debe capturar el panel completo, con controles, entre los KPIs y «Gasto por categoría».

- **Margen del encuadre recortado por el extent (#37, crítico NO BLOQUEA 1).** `src/graficas/mapa.ts:23-28`: con la semilla 1, CDMX es el extremo este y sur de todos los puntos, y ECharts recorta la ventana al extent de los datos en esos dos bordes. Impacto hoy: los puntos más al este y al sur pueden quedar pegados al borde. Se juzga en la captura del mapa del grupo 5; si se ve cortado, entra ahí.

- **Docstring de `hallazgos` (#36, crítico pasada 2, Comentarios y citas 1).** `src/dominio/hallazgos.ts:170-171` dice «sin él, el mes de las transacciones»; para `viajes` sin periodo son todas las transacciones. Por R-08 es lo mismo; no es falso. Impacto hoy: ninguno. Si no se hace: una lectura futura puede suponer un recorte que no ocurre.

## Se coló

- —

## Lo que queda fuera

- Fase 5 (exportar) y lo que `proposal.md` declara fuera de alcance.

## Entorno vivo

- Worktree del PM `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-4`).

## Coste

- —

## Handover

- **Estado estable:** #38 mergeada (`8f479c3`) y registro al día; nada en vuelo: sin implementadores ni críticos activos, sin servidores, candado de `pesado` libre, sin worktrees de grupo.
- **Hecho:** grupos 1 (#36), 2 (#37) y 3 (#38) mergeados en `ola/fase-4`; casillas 1.1–1.4, 2.1–2.2 y 3.1 marcadas (7/12).
- **Lo que queda en orden:** grupo 4 (umbrales desde la pantalla y su almacén, 4.1–4.3, rama `feat/fase-4-client-thresholds`, área `src/cliente/`, `tests/cliente/`, `tests/sistema/umbrales.spec.ts`), y después el grupo 5 (mapa en la página y flujo de sistema, 5.1–5.2, `feat/fase-4-client-map-system`), que depende del 2 y del 4. Los dos desde `ola/fase-4`, en serie. Luego el cierre (§5) con la plantilla B y la PR `ola/fase-4 → master`.
- **Avisos para los encargos:**
  - Contrato del dominio: `Hallazgo` unión por `tipo`; `hallazgos(tx, umbrales?, periodo?)` mezcla `Partial<Umbrales>` ignorando `undefined`; `leerUmbral(clave, texto)` → `{ valido: true, valor } | { valido: false }` (la dominante en % → proporción); `leerUmbralesGuardados(valor: unknown)` → `Umbrales`. Todo en `src/dominio/hallazgos.ts`.
  - El panel es `src/cliente/PanelDeHallazgos.tsx` con props `transacciones`, `periodo`, `umbrales?`; `Tablero` aún no recibe umbrales. Textos en `textos.hallazgos`.
  - Grupo 4 hereda: dar estilo al panel en `estilos.css` y capturar el panel completo en contexto (deuda de #38).
  - Grupo 5: `mapaDeGasto(metricas, ejes)` en `src/graficas/mapa.ts` exige los nombres de los ejes desde `textos.ts`; registrar en `src/cliente/echarts.ts` `ScatterChart`, `DataZoomComponent` (inside) y `TooltipComponent` (la opción lleva `tooltip`). En la captura del mapa, juzgar el margen del encuadre (deuda de #37) y el contraste de los puntos.
  - Worktrees: `.claude/da/da worktree montar <ruta> --rama <rama> --desde ola/fase-4` funciona (el `npm ci` de `preparar` va bien). Capturas: el PM levanta `npm run dev` del worktree con `setsid nohup <wt-pm>/.claude/da/da en <wt> -- <wt-pm>/.claude/da/da pesado -- npm run dev`, y lo para con `pkill -f "<wt>.*vite"` antes de cualquier `verify`. Las capturas se apartan del worktree antes de `verify` (si no, el SHA sale `+sucio`).
  - `gh pr edit` no funciona: cuerpos por `gh api -X PATCH repos/<repo>/pulls/<n> --input <json>`. Tras un rebase con commit de capturas, los permalinks del cuerpo se actualizan al SHA nuevo.
  - graft indexa el checkout principal (en `master` antiguo): los encargos dicen que no refleja la rama.
- **Pendiente con el Team Manager o el usuario:** nada.
- **Por qué paro:** 3 PRs internas mergeadas (§6).
