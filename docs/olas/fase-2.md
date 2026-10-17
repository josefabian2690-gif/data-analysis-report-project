# Ola fase-2 — Dashboard completo, filtros y tabla

**Rama:** `ola/fase-2` · **Changes:** `fase-2-dashboard-filtros-y-tabla` · **Abierta:** 2026-10-16

## Arranque

- Base: `chore/fase-2-planning` @ `94cfdc2` (sobre `ola/fase-1` @ `35d5971`), por avance continuo del usuario; la PR de ola apunta a `chore/fase-2-planning`. Rama principal: `master`.
- `preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft).
- `verify` sobre la base (`94cfdc2`): format:check, lint, typecheck, test y citas OK; 402 tests en 25 archivos.
- `sistema` sobre la base (`94cfdc2`): 2/2 (`flujo-principal.spec.ts`, `pagina-vacia.spec.ts`). Sin specs heredados inestables.
- OpenSpec: `fase-2-dashboard-filtros-y-tabla`, `state: ready`, 0/17, sin `context` ni `operationGuidance`. Leídos proposal, design, tasks y los cuatro deltas.
- `design.md` contrastado con el código: `metricas.ts:17-21` y `:76`, `fecha.ts:13`, `eslint.config.mjs:23` y `:71-84`, `App.tsx:62`, `tests/graficas/por-categoria.test.ts:7`, todo como dice. Cifras del fixture `2026-07-semilla-1` recalculadas por el PM con Papa Parse fuera del tablero: 1–10 de julio 590 y 458 549.33 (45 854.933); día 15, 125 y 107 565.60; total 1 689 470.67; mayor monto 12 990.00 «Renta departamento» 2026-07-01 08:55:23.
- Nada que pedir al usuario: ninguna dependencia, credencial ni `[PENDIENTE]` en la ola.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| #17 | fase-2-dashboard-filtros-y-tabla · 1.1–1.5 | `feat/fase-2-domain-filters-series` | mergeada (`a74e9df`) — 0 mecánicas · 0 rondas · 0 por corrección; LISTA en la pasada 1 con 4 NO BLOQUEA cerrados en la pasada final trivial |
| #19 | fase-2-dashboard-filtros-y-tabla · 2.1–2.4 | `feat/fase-2-charts` | mergeada (`5f8a035`) — 0 mecánicas · 1 ronda (juicio del crítico: rótulos del test iguales a los que fijaría la capa) · 0 por corrección; pasada 2 LISTA sin hallazgos |
| #18 | fase-2-dashboard-filtros-y-tabla · 3.1–3.3 | `feat/fase-2-client-filters` | mergeada (`66d57be`) — 0 mecánicas · 1 ronda (juicio del crítico: el monto mínimo sin test de comportamiento) · 0 por corrección; pasada 2 LISTA con 1 NO BLOQUEA cerrado en la pasada final trivial |
| #20 | fase-2-dashboard-filtros-y-tabla · 4.1–4.3 | `feat/fase-2-transactions-table` | mergeada (`ee64c92`) — 0 mecánicas · 1 ronda (juicio del crítico: la fila sin hora empataba con una de `00:00:00` y el desempate de TanStack seguía el orden del archivo) · 0 por corrección; pasada 2 LISTA sin hallazgos |
| #21 | fase-2-dashboard-filtros-y-tabla · corrección de 2.3–2.4 | `fix/fase-2-chart-legend-position` | mergeada (`4366f7b`) — 0 mecánicas · 1 ronda (juicio del crítico: el test acotaba solo el borde superior de la leyenda) · 0 por corrección; pasada 2 LISTA sin hallazgos |
| #22 | fase-2-dashboard-filtros-y-tabla · 5.1–5.2 | `feat/fase-2-client-charts-system` | mergeada (`7c13376`) — 0 mecánicas · 0 rondas · 0 por corrección; LISTA en la pasada 1 con 9 NO BLOQUEA: 5 cerrados en la pasada final trivial (`3b4500e`), 4 a *Deuda*. Antes del PR, un defecto visual de #19 destapado al capturar → #21 |

## Decisiones del PM

- **D-TM1 (Team Manager).** Decisión 1 del pre-vuelo: (a), una sola ola de 5 PRs. Descartado: dos olas y 7 PRs.
- **D-TM2 (Team Manager).** Decisión 2: (a), de la deuda heredada entra solo el lint de «solo `import type` de `echarts`» en `graficas` (2.1) y la barra única (2.2). Descartado: absorber además las comillas mal puestas y `FieldMismatch` de `carga.ts`.
- **D-TM3 (Team Manager).** Decisión 3: (a), `metricas(tx, periodo?)` y `periodoDelFiltro(mes, filtro)`. Descartado: `metricas(tx, filtro)` y el promedio en el cliente.
- **D-TM4 (Team Manager).** Decisión 4: (a), tabla paginada de 50 filas, sin virtualizar. Descartado: todas las filas en el DOM y `@tanstack/react-virtual`.
- **D-TM5 (Team Manager).** Decisión 5: (a) y (a), fechas del filtro en listas con R-17 y gráfica por día de la semana con el promedio por día. Descartado: `<input type="date">` y el total por día de la semana.
- Las cinco coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.
- **Nombres del dominio (PR #17):** `Periodo { desde, hasta }` vive en `src/dominio/calendario.ts`; un periodo de 0 días es uno con `desde > hasta` (no se normaliza), distinto de no pasar periodo. `DiaDeLaSemana` es 0 = lunes … 6 = domingo. Series: `gastoPorDia`, `gastoPorHora` + `transaccionesSinHora`, `gastoPorDiaDeLaSemana`, `gastoPorZona`, `gastoPorCuenta`. Descartado: periodo opcional con `null` para el vacío.
- **Transacciones fuera del periodo (PR #17):** cuentan en `gastoTotal`, hora, zona y cuenta, pero no en las series por día y por día de la semana. Aceptado con el crítico: el cliente pasa el mismo filtro a `filtrar` y a `periodoDelFiltro`, así que lo filtrado siempre cae dentro del periodo. Descartado: recortar `tx` al periodo dentro de `metricas` (mezcla filtrar y medir, D2).
- **Pasada final de #17 trivial, sin otra pasada del crítico:** solo tests unitarios y un comentario; se repitió `sistema` porque tocó un archivo de producto.
- **El escenario «Las opciones no desaparecen al filtrar» se protege en el cliente (grupo 3):** en el dominio solo puede afirmarse que `opcionesDeFiltro` usa lo que recibe.
- **Grupos 2 y 3 en paralelo** tras #17, en worktrees disjuntos (`g2`: `src/graficas/`, `tests/graficas/`, `eslint.config.mjs`, `tests/arquitectura/capas.test.ts`; `g3`: `src/cliente/`, `tests/cliente/`). El crítico de #19 se lanzó mientras #18 estaba en su ronda (los críticos solo leen y las áreas son disjuntas); los merges siguieron en serie, con rebase de #19 sobre #18. Descartado: esperar a cerrar #18 para empezar a revisar #19.
- **Capturas del grupo 3 contra `npm run dev` del worktree** (`127.0.0.1:5173`), levantado por el PM con candado solo mientras el implementador capturaba. Descartado: dejarlo arriba durante la implementación (bloquea el candado del `verify` del otro grupo).
- **Título de la sección de KPIs (PR #18):** «Indicadores del mes» pasa a «Indicadores», porque con filtro las cifras no son del mes. Descartado: un título que cambie con el filtro (texto nuevo sin escenario en la spec).
- **Región de estado montada siempre (PR #18):** el `role="status"` vive vacío con resultados y solo cambia su contenido, para que los lectores de pantalla anuncien el mensaje. Descartado: montarlo solo con 0 filas.
- **Pasada final de #18 trivial, sin otra pasada del crítico:** solo un test unitario; `sistema` no se repitió (código de producto idéntico a `9c72563`).
- **Rótulos de las gráficas por argumento (PR #19):** `porDia(m, rotulos: Record<TipoDeDia, string>)` y `porDiaDeLaSemana(m, { dias: Record<DiaDeLaSemana, string>, entreSemana, finDeSemana })`; `porHora`, `porZona`, `porCuenta` sin rótulos (sus ejes solo llevan datos). Marca de quincena y fin de semana: color más patrón `decal` en `itemStyle`, con leyenda; el patrón lo aplica el núcleo de ECharts sin `aria.decal` (comprobado por el crítico en el instalado). Descartado: `markArea`.
- **Eje de días con todas las fechas a 45° (PR #19):** `interval: 0` y `rotate: 45`, para que el 15 y el 31 no queden ocultos por el `interval: 'auto'`. Descartado: dejar que ECharts oculte rótulos.
- **Lint de `echarts` en `graficas` (PR #19):** `@typescript-eslint/no-restricted-imports` con `allowTypeImports`, más selectores de `import()` dinámico; la sintaxis prohibida de las capas puras pasó a una constante para que el bloque de `graficas` no la pierda al redefinir `no-restricted-syntax`.
- **Corte por límite de la API (2026-10-16):** se cortaron el implementador del grupo 3 (capturando) y el crítico de #19; el Team Manager avisó del restablecimiento y se reanudaron las mismas instancias por mensaje, sin relanzar.
- **Tabla sin estado «sin orden» (PR #20):** `enableSortingRemoval: false` y orden inicial `fecha` ascendente, para que la tabla nunca vuelva al orden del archivo. Descartado: el ciclo por defecto de TanStack, cuyo tercer clic quita el orden.
- **Clave de fecha de la tabla (PR #20):** `${dia}T${hora ?? ''}`; la clave sin hora es prefijo de cualquier hora de su día y va antes también que las `00:00:00`. Descartado: `hora ?? '00:00:00'`, que empata y deja el desempate al orden del archivo.
- **Reinicio de página propio (PR #20):** `autoResetPageIndex: false`, paginación controlada y vuelta a la página 1 al cambiar la identidad del conjunto filtrado o al ordenar. Descartado: confiar en el auto-reset de la biblioteca (D7).
- **Columna Fecha (PR #20):** `dd/mm/aaaa HH:MM:SS`, sin hora solo `dd/mm/aaaa`; orden de columnas Fecha, Concepto, Categoría, Cuenta, Zona, Monto. Descartado: hora en columna propia.
- **Relevo de PM (2026-10-16):** el PM entrante tomó la ola por §1b tras #19; registro, PRs y OpenSpec coincidían (12/17).
- **Corrección de la leyenda como PR propia (#21) antes del grupo 5:** el defecto está en `src/graficas/`, fuera del área del grupo 5 (§2.9); el grupo 5 rehace sus capturas sobre ella. Descartado: que el cliente reescriba la posición de la leyenda en la opción (D5 lo descarta para ejes y leyendas) o ensanchar el área del grupo 5.
- **Mutaciones de sistema del grupo 5 sobre el árbol sin commitear (`a6f93b5+sucio`):** línea base 3/3, y cada mutación (filtro de fechas, promedio del mes completo, orden de la tabla) hizo fallar la spec nueva en su aserción. Corridas antes del rebase sobre #21, que solo toca `src/graficas/columnas.ts`.
- **Corte por límite de la API (2026-10-17, HTTP 429):** cortó al PM tras el reporte de `impl-fix-leyenda`; el Team Manager avisó del restablecimiento y se siguió con las mismas instancias.
- **Gráficas del grupo 5 (PR #22):** cinco secciones en `GraficasDelPeriodo` entre «Gasto por categoría» y la tabla; descripción accesible armada en `src/cliente/opciones-de-graficas.ts` con el catálogo (`textos.graficas`); `LegendComponent` registrado; ancho mínimo de 640 px para la gráfica por día. Descartado: rótulos inclinados que se tocan en tarjetas estrechas.
- **Pasada final de #22 trivial, sin otra pasada del crítico:** solo tests (`tests/cliente/graficas-del-mes.test.tsx`, `tests/sistema/dashboard-filtrado.spec.ts`); se repitió `sistema` porque cambió la spec de sistema.
- **Cuatro NO BLOQUEA de #22 a deuda y no a corrección:** tocan archivos de producto fuera del grupo (`src/graficas/`, `Grafica.tsx`, `GastoPorCategoria.tsx`) o no tienen comportamiento que proteger; una sexta PR (otra corrección de `graficas`) no compensaba. Descartado: abrirla antes del cierre.

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- **Marca de post-quincena casi lisa (#22, crítico NO BLOQUEA 1).** `src/graficas/estilo.ts:23-29`, `MARCA_DE_PUNTOS` se ve como rayas horizontales tenues y en el cuadro de la leyenda casi liso; el teal `#0f766e` y el gris `#64748b` tienen luminancia parecida. Impacto hoy: quien no distingue el color separa post-quincena de día normal casi solo por color (R-13, «marca que no dependa solo del color»). Si no se hace: el requisito queda cumplido a medias para la post-quincena. Postura del PM: deuda, porque es de la capa `graficas` (#19), fuera del área del grupo 5, y abrir otra PR de corrección pasaba el umbral de la ola; quincena y pre-quincena sí se distinguen.
- **`Grafica` recrea la instancia de ECharts en cada cambio de opción (#22, NO BLOQUEA 6).** `src/cliente/Grafica.tsx:9-19`: seis instancias liberadas y recreadas por cada cambio de filtro, con la animación de entrada desde cero. Impacto hoy: parpadeo y trabajo extra al teclear en Monto. Si no se hace: crece con cada gráfica que añada la fase siguiente.
- **`conDescripcion` duplicado (#22, NO BLOQUEA 7).** `src/cliente/opciones-de-graficas.ts:14-17` y `src/cliente/GastoPorCategoria.tsx`; también `padStart` de la hora repetido respecto de `src/graficas/por-hora.ts`. Impacto hoy: ninguno. Si no se hace: dos formatos de descripción que pueden divergir.
- **CSS y rejilla (#22, NO BLOQUEA 8).** Segundo bloque `.tarjeta-grafica` en `src/cliente/estilos.css` y `bottom: 72` en `src/graficas/columnas.ts` aunque no haya rótulos inclinados (franja vacía de unos 70 px en hora y día de la semana). Impacto hoy: espacio en blanco. Si no se hace: ninguno funcional.

## Se coló

- **Leyenda de las gráficas de columnas abajo (#19 → #21).** ECharts 6.1.0 pone la leyenda abajo por defecto (`node_modules/echarts/lib/component/legend/LegendModel.js:250`); `columnas` no fijaba posición y reservaba la franja de arriba. En la gráfica por día la leyenda tapaba los 31 rótulos de fecha. Lo vio el implementador del grupo 5 al capturar; ningún test de #19 miraba la posición resuelta. Corregido en #21 (§2.9).

## Lo que queda fuera

- Deuda heredada de la fase 1 no absorbida (D-TM2): comillas mal puestas y `FieldMismatch` en `src/dominio/carga.ts`, el literal `'dist'` de `src/servidor/main.ts`, el aviso de archivo ilegible de `src/cliente/App.tsx` y los detalles visuales de #13. Siguen en `docs/olas/fase-1.md`, *Deuda*.

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm-fase-2` (`ola/fase-2`), tomado por el PM entrante el 2026-10-16 (relevo por §1b; registro, PRs y OpenSpec coinciden: 12/17).
- Grupo 4: mergeado; worktree `g4` quitado.
- Grupo 5 y corrección #21: mergeados; worktrees `g5` y `fix-leyenda` quitados. Ningún servidor ni comando en vuelo.

## Coste

- —

## Handover

- **Estado estable:** #22 mergeada en `ola/fase-2` (`7c13376`); nada en vuelo (sin implementadores ni críticos activos, sin servidores, sin worktrees de grupo; solo el del PM).
- **Hecho:** grupos 1 a 5 cerrados y la corrección #21; #17, #18, #19, #20, #21 y #22 mergeadas. `openspec instructions apply`: 17/17, `all_done`.
- **Lo que queda en orden:** solo el cierre (`desarrollo-autonomo-pm` §5) en el worktree del PM `/home/fabs/da-wt/tablero-gastos/pm-fase-2`:
  - `.claude/da/da verify --wt /home/fabs/da-wt/tablero-gastos/pm-fase-2` y `.claude/da/da sistema --wt …` sobre la punta de `ola/fase-2` (esperado: `verify` con 41 archivos y 578 tests; `sistema` 3/3 con `dashboard-filtrado.spec.ts`);
  - `## Coste` a mano (`.claude/da/da medir` falla con este entorno, brief §5);
  - PR `ola/fase-2` → `chore/fase-2-planning` con la plantilla B; seis bloques de grupo (#17, #18, #19, #20, #21, #22) con las cifras de la tabla *PRs*; *Deuda* con los cuatro items de arriba;
  - entregar número y enlace al Team Manager.
- **Avisos:**
  - El cuerpo de una PR se edita con `gh api -X PATCH repos/josefabian2690-gif/data-analysis-report-project/pulls/<n> -F body=@cuerpo.md` (`gh pr edit` falla).
  - `.claude/da/da cuerpo-pr armar --sha <sha>` se corre desde la raíz del checkout principal (desde el worktree no encuentra el estado).
  - `sistema` y `verify` de #22 y #20 están en sus hilos; las mutaciones de 5.2 en el cuerpo de #22.
- **Pendiente con el Team Manager o el usuario:** nada que bloquee; la deuda de la marca de post-quincena (R-13) es una decisión a confirmar en la PR de ola.
- **Por qué paro:** 3 PRs internas mergeadas por este PM (#20, #21, #22), umbral de handover de `desarrollo-autonomo-pm` §6.
