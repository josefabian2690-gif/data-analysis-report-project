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
| #39 | fase-4-mapa-y-hallazgos · 4.1–4.3 | `feat/fase-4-client-thresholds` | mergeada (`55c4ba7`) — 1 mecánica (dos comentarios con cita que no decía lo afirmado, panel pegado a los KPIs, captura «antes» recortada) · 1 ronda · 0 por corrección; NO LISTA en la pasada 1 (1 BLOQUEA de test: tres de los cinco controles podían dejar de recalcular con la suite en verde, más 5 NO BLOQUEA corregidos en la ronda), LISTA en la pasada 2 con 1 NO BLOQUEA aceptado |
| #40 | fase-4-mapa-y-hallazgos · 5.1–5.2 | `feat/fase-4-client-map-system` | mergeada (`73c2be0`) — 0 mecánicas · 0 rondas · 0 por corrección; LISTA en la pasada 1 con 5 NO BLOQUEA: 4 cerrados en la pasada final (`b7cbc2f`: rótulos crudos de los ejes, test del tooltip acoplado, `DataZoomInsideComponent`, rótulo de una captura) con pasada corta LISTA y 2 NO BLOQUEA aceptados; 1 aceptado |

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

- **Relevo del PM (2026-10-22).** Entra un PM nuevo por §1b sobre `9fcd292`; estado verificado contra las PRs (#36–#38 mergeadas, 7/12, sin PRs abiertas).
- **Texto inválido de un umbral al remontar (#39, crítico pasada 1 NO BLOQUEA 3).** Si un control queda inválido y se carga otro CSV o se filtra hasta 0 filas, el control vuelve al último valor válido y pierde el texto y la marca. Aceptado: nunca muestra un valor distinto del vigente. Descartado: subir el texto de cada control a `App`.
- **Desviación de TDD declarada (#39).** Los tests de la cáscara del almacén se escribieron junto con su implementación mínima, sin rojo previo; la mitigan los mutantes por test (crítico, pasada 1 NO BLOQUEA 6). Descartado: rehacerlos.
- **«Antes» del panel en #39.** Se usa la captura de `imgs/screenshots/38/` como «antes»; la del implementador salió recortada y el servidor de desarrollo ya servía el código nuevo. Descartado: montar otra rama solo para retomarla.
- **Comentario de `marcaDeHallazgo` (#39, pasada 2 NO BLOQUEA 1).** Aceptado sin acción: es cierto hoy y una colisión deja los tests en rojo, no en verde falso.

- **`src/graficas/mapa.ts` en la pasada final de #40.** Los extremos de los ejes del mapa salían con el valor crudo del encuadre (`-99.18862999999999`), visibles en el demo; se corrigió en la pasada final, fuera del área del grupo 5, ocultando los rótulos extremos (redondear la ventana no bastaba: ECharts la reconvierte), con pasada corta del crítico. Descartado: dejarlo como deuda (las issues están deshabilitadas y el analista lo ve).
- **Mutaciones de sistema corridas por el PM.** 4.3: con `main.tsx` sin pasar el almacén falla `tests/sistema/umbrales.spec.ts:37`. 5.2: con la dominante por defecto en 0.5 falla `tests/sistema/flujo-principal.spec.ts:102`. Ninguna se commiteó.

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- ~~**Estilo del panel de hallazgos y su captura en contexto (#38).**~~ Cerrada en #39: tarjeta con controles y captura completa entre los KPIs y «Gasto por categoría» (`imgs/screenshots/39/umbrales-por-defecto-despues.png`).

- **Margen del encuadre recortado por el extent (#37, juzgado en #40).** `src/graficas/mapa.ts:23-28`: el 10 % de margen no se respeta al este ni al sur; el crítico midió unos 21 px entre el punto extremo y el borde. Ningún símbolo queda cortado y las zonas de CDMX se distinguen. Impacto hoy: estético. Si no se hace: con otros datos un punto extremo puede quedar más pegado al borde.

- **Rótulos del mapa protegidos sobre la opción (#40, pasada corta NO BLOQUEA 1).** `tests/graficas/mapa.test.ts:199-211` afirma `showMinLabel`/`showMaxLabel: false`, no lo que se ve; en jsdom el contenedor mide 0 px y el SVG no dibuja los extremos. Impacto hoy: ninguno. Si no se hace: un rótulo intermedio crudo no lo detectaría ningún test.

- **Tooltip del mapa sin test (#40, pasada corta NO BLOQUEA 2).** `TooltipComponent` está registrado en `src/cliente/echarts.ts`, pero ningún test lo protege: en jsdom no hay detección de impacto. Impacto hoy: ninguno. Si no se hace: quitar el registro dejaría el mapa sin cuadro de detalle sin que falle nada; se cubriría con un hover en la suite de sistema.

- **Texto inválido de un umbral que se pierde al remontar (#39, pasada 1 NO BLOQUEA 3).** Ver *Decisiones*. Impacto hoy: tras cargar otro CSV o filtrar a 0 filas, un control inválido vuelve a su último valor válido.

- **`.claude/da/da medir` no corre con `gh` 2.46.0.** Falla con `Unknown JSON field: "closingIssuesReferences"` (igual que en la fase 3); las tablas de *Coste* salen en cero. Impacto hoy: la ola no tiene cifras de coste automáticas. Si no se hace: tampoco las tendrán las siguientes; requiere actualizar `gh` (lo instala el usuario).

- **Docstring de `hallazgos` (#36, crítico pasada 2, Comentarios y citas 1).** `src/dominio/hallazgos.ts:170-171` dice «sin él, el mes de las transacciones»; para `viajes` sin periodo son todas las transacciones. Por R-08 es lo mismo; no es falso. Impacto hoy: ninguno. Si no se hace: una lectura futura puede suponer un recorte que no ocurre.

## Se coló

- Nada.

## Lo que queda fuera

- Fase 5 (exportar) y lo que `proposal.md` declara fuera de alcance.

## Entorno vivo

- Vacío: worktrees de grupo quitados, sin servidores y con el candado libre. El worktree del PM `/home/fabs/da-wt/tablero-gastos/pm` se quita al entregar.

## Coste

Salida de `.claude/da/da medir fase-4`, tal cual (falló la consulta a `gh`; ver *Deuda*):

```
da medir: gh pr list falló -- Unknown JSON field: "closingIssuesReferences"
```

### Mecánica

| Métrica | Valor |
| --- | --- |
| PRs a GitHub | 0 |
| Merges a master — cierre o arreglo | 0 |
| Merges a master — planeación y archivado | 0 |
| Horas de espera (promedio) — cierre o arreglo | 0.0 |
| Horas de espera (promedio) — planeación y archivado | 0.0 |
| Corridas de evidencia | 0 |
| Pasadas de crítico | 0 |
| BLOQUEA en veredictos | 0 |
| NO BLOQUEA en veredictos | 0 |
| Actions — Citas | 2 min |

### Trabajo

| PR | Caché leída/línea (producto) | Horas/línea (producto) | Caché leída/línea (test) | Horas/línea (test) |
| --- | --- | --- | --- | --- |

### Guardas

| Guarda | Valor |
| --- | --- |
| Se coló | 0 |
| BLOQUEA de código | 0 (los 3 BLOQUEA de la ola fueron de test: #36, #38, #39) |
| sistema al cierre | 5/5 sobre `73c2be0` |

## Handover

- **Cierre (2026-10-22).** Las 5 PRs internas mergeadas (#36–#40) y 12/12 casillas (`openspec instructions apply`: `all_done`).
- `verify` verde sobre `73c2be0` (64 archivos, 994 tests) y `sistema` 5/5 sobre `73c2be0`.
- PR de ola `ola/fase-4 → master` abierta para el usuario; el post-merge (Archivador) es del Team Manager.
- Pendiente con el Team Manager o el usuario: confirmar o revertir las decisiones de arriba en la PR de ola.
