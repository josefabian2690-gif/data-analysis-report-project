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
| — | fase-2-dashboard-filtros-y-tabla · 4.1–4.3 | `feat/fase-2-transactions-table` | pendiente |
| — | fase-2-dashboard-filtros-y-tabla · 5.1–5.2 | `feat/fase-2-client-charts-system` | pendiente |

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

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- Deuda heredada de la fase 1 no absorbida (D-TM2): comillas mal puestas y `FieldMismatch` en `src/dominio/carga.ts`, el literal `'dist'` de `src/servidor/main.ts`, el aviso de archivo ilegible de `src/cliente/App.tsx` y los detalles visuales de #13. Siguen en `docs/olas/fase-1.md`, *Deuda*.

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm-fase-2` (`ola/fase-2` @ `5f8a035`); el PM entrante lo puede tomar (lo montó `.claude/da/da worktree montar`, comprobado). Ningún worktree de grupo, servidor ni comando en vuelo.

## Coste

- —

## Handover

- **Estado estable:** #19 mergeada en `ola/fase-2` (`5f8a035`); nada en vuelo (sin implementadores ni críticos activos, sin servidores, sin worktrees de grupo).
- **Hecho:** grupos 1, 2 y 3 cerrados; #17, #18 y #19 mergeadas. `openspec instructions apply`: 12/17.
- **Lo que queda en orden:**
  - grupo 4 (tabla, `implementador-cliente`), rama `feat/fase-2-transactions-table` desde `ola/fase-2`, worktree `/home/fabs/da-wt/tablero-gastos/g4` con `.claude/da/da worktree montar … --desde ola/fase-2`;
  - después el grupo 5 (gráficas en el cliente y spec de sistema), que depende del 2 y del 4;
  - luego el cierre: PR `ola/fase-2` → `chore/fase-2-planning` con la plantilla B.
- **Avisos para los encargos:**
  - Grupo 4: el conjunto filtrado es `filtradas` en `src/cliente/Tablero.tsx` (variable local con `useMemo`); la tabla cuelga de la rama con resultados (con 0 filas solo se ve la región `role="status"`, siempre montada). Leer antes la guía de TanStack Table 9.3.1 (`node_modules/@tanstack/react-table/skills/getting-started/SKILL.md`, `table-state/SKILL.md`). El título de la sección de KPIs ahora es «Indicadores».
  - Grupo 5: registrar `LegendComponent` en `src/cliente/echarts.ts` (lo usan `porDia` y `porDiaDeLaSemana`; sin él la leyenda desaparece en silencio) y afirmar en un test de componente que la leyenda aparece. Rótulos desde `src/cliente/textos.ts`: tipos de día (`quincena`, `post-quincena`, `pre-quincena`, `normal`), días de lunes (0) a domingo (6), «entre semana» y «fin de semana». Con `interval: 0`, si la rejilla mide menos de unos 600 px los 31 rótulos inclinados pueden tocarse: la captura del tablero completo lo debe mostrar. La barra única del gráfico por categoría ya está acotada (`barMaxWidth` 32).
  - Capturas: el PM levanta `npm run dev` del worktree con `.claude/da/da pesado -- npm --prefix <wt> run dev` en dos tiempos (el implementador avisa «listo para capturar»), y lo apaga al terminar matando el proceso de vite por PID (un `pkill -f` con la ruta mata también la propia shell).
  - `verify` y `sistema` salen `+sucio` mientras las capturas están sin commitear en `imgs/screenshots/pendiente/`; se declara en el cuerpo.
  - Recordar en cada encargo y crítico: sin `npx` ni instaladores; el crítico de #19 se coló una vez con `git checkout --` para restaurar (sin efecto): pedir restaurar desde copias.
- **Pendiente con el Team Manager o el usuario:** nada.
- **Por qué paro:** 3 PRs internas mergeadas (umbral de handover de `desarrollo-autonomo-pm`).
