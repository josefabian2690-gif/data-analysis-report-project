# Brief — Ola fase-2 «Dashboard completo, filtros y tabla»

Eres el **project manager** de la Ola fase-2 de tablero-gastos. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- **Base: `chore/fase-2-planning` sobre `ola/fase-1`, por petición del usuario, 2026-10-15 (avance continuo, sin merges a master).**
  - Verificado contra `ola/fase-1` @ `35d5971`.
  - `ola/fase-2` sale de la punta de `chore/fase-2-planning` y su PR de ola apunta a `chore/fase-2-planning`.
  - Registro: `docs/olas/fase-2.md`.
- **Pila de PRs abiertas** (nadie mergea a `master` ni las de la cadena; el usuario las mergea todas después, en orden):
  - #3 → `master`, #4 → `master`, #8 → `chore/fase-0-planning`, #9 → `ola/fase-0`, #15 → `chore/fase-1-planning`
  - la PR de planeación de esta ola, contra `ola/fase-1`
  - La rama principal es `master`, no `main`.
- **Change:** `fase-2-dashboard-filtros-y-tabla`, ya propuesto y refinado; lo tomas, no lo reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable: `openspec-update-change` y registro.
- **Entregable:**
  - gráficas por día (quincena, post-quincena y pre-quincena marcadas, R-13), hora, día de la semana (promedio por día, viernes a domingo marcados, R-14), zona y cuenta;
  - filtros de R-10 (fechas en dd/mm/aaaa, categorías, cuentas, zonas, monto) con los que KPIs, gráficas y tabla se recalculan, y estado vacío si quedan 0 filas;
  - tabla de transacciones ordenable y paginada;
  - una spec de sistema nueva que recorre el dashboard filtrado contra `npm start`.
- **Reglas de la fase:** nada de historial, API, comparación, mapa, hallazgos (R-16) ni exportar; **ninguna dependencia nueva**; sin filtros, lo de la fase 1 se comporta igual.
- **PRs internas: 5**, una por grupo.
  - Grafo: 1 → 2; 1 → 3 → 4; 2 y 4 → 5.
  - Paralelo declarado: el 2 (`src/graficas/`, `tests/graficas/`, `eslint.config.mjs`, `tests/arquitectura/capas.test.ts`) junto a la cadena 3 → 4 (`src/cliente/`, `tests/cliente/`). Revisión y merge en serie.
  - Estimados de ~500 a ~750 líneas por grupo (en la fase 1 acabaron entre 960 y 1 130). La ola está en el tope de 5: si un grupo hay que partirlo, escala al Team Manager antes.
- No se empieza la fase 3.

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4. Los encargos de dominio citan `docs/DOMINIO.md` (R-10 a R-14 y *Casos borde*), que sí leen los implementadores.
3. Los artefactos del change por la mecánica de OpenSpec. `instructions apply` devuelve `state: ready`, 0/17, **sin** `context` ni `operationGuidance` (comprobado el 2026-10-16).
4. `docs/olas/fase-2-revision.md` (hallazgos y decisiones del pre-vuelo) y `docs/olas/fase-1.md`, *Decisiones del PM* y *Deuda*.
5. Guardas que no se ablandan:
   - `tests/arquitectura/` (capas, pureza, imports de la suite);
   - `tests/sistema/flujo-principal.spec.ts` y `pagina-vacia.spec.ts`, sin cambios;
   - los tests R-xx de la fase 1 en `tests/dominio/`, `tests/graficas/` y `tests/cliente/` (solo cambia el literal de `Metricas` de `tests/graficas/por-categoria.test.ts`, por el grupo 1).

## 3. Reglas de la fase que mandan en cada PR

- **Decisiones del pre-vuelo** (`docs/olas/fase-2-revision.md` §7), escritas en el change con la recomendación:
  1. Una ola de 5 PRs.
  2. Solo entra la deuda que guarda lo que la ola añade: lint de `echarts` en `graficas` (2.1) y barra única (2.2). Carga, `'dist'` y el aviso de `App.tsx` quedan fuera.
  3. `metricas(tx, periodo?)` y `periodoDelFiltro(mes, filtro)` (D2).
  4. Tabla en páginas de 50 (D7).
  5. Fechas del filtro en listas con R-17; gráfica por día de la semana con el promedio por día (D4, D6).

  Si el Team Manager te comunica otra cosa, manda lo suyo y se pasa por `openspec-update-change`.
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `filtrar(tx, filtro): Transaccion[]` con esa firma. Los únicos añadidos son los de `design.md`: segundo argumento opcional de `metricas`, `opcionesDeFiltro`, `periodoDelFiltro`, campos nuevos de `Metricas` y el argumento de rótulos de las funciones de `graficas` que lo necesiten. `GastoDeCategoria` y `porCategoria(m)` no cambian de forma. Cualquier otro cambio de firma se escala.
- **Textos visibles** solo en `src/cliente/textos.ts`, también los de ejes y leyendas: `graficas` los recibe por argumento. Las pruebas buscan por rol y nombre accesible del catálogo.
- **Las cifras de las pruebas que usan el fixture son literales** (§4, grupo 1). Una prueba que calcula lo esperado llamando al dominio es tautológica y no vale (`CLAUDE.md`, *Test driven development* 6).
- **Comentarios:** ninguno cita `openspec/changes/`. Si el porqué de D2 (periodo) o de D7 (fila sin hora al inicio del día) hace falta en el código, se escribe entero. El comentario de `src/dominio/metricas.ts:17-20` («mientras no haya filtros, el periodo es ese mes») queda falso con el grupo 1 y se reescribe ahí.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-16)

- **Grupo 1 — Dominio: filtros, periodo, calendario y series** (`implementador`)
  - **Partida:** `metricas(tx)` en `src/dominio/metricas.ts:57`; el promedio divide en `:76` entre `diasNaturalesDelMes(primera.dia)`; `diasDelMes(anio, mes)` en `src/dominio/fecha.ts:13`. `Transaccion` (`src/dominio/esquema.ts`) tiene `dia` y `hora` (`null` sin hora), sin `Date`. No hay `Filtro` ni `filtrar`.
  - **Lint de pureza** (`eslint.config.mjs:71-84`): prohíbe `Date.now()`, `new Date()` sin argumentos y `Date(...)` como llamada; permite `new Date('AAAA-MM-DD')` y los `getUTC*`.
  - **R-13** igual que `tipo_dia` del generador (`generador/generar_transacciones.py:106`): primero quincena (15 y último), luego post (16 y 1), luego pre (12-14 y los 3 previos al último).
  - **Cifras del fixture `tests/fixtures/generador/2026-07-semilla-1.csv`** (Papa Parse, fuera del tablero):
    - 2 000 filas, todas con hora; 10 categorías, 3 cuentas, 7 zonas.
    - Del 1 al 10 de julio: 590 transacciones, 458 549.33, promedio 45 854.933.
    - Día 15: 125 transacciones, 107 565.60.
    - Compras: 404 transacciones, 814 566.30.
    - Primera zona: `Centro Histórico, CDMX` (700 525 aprox.).
    - Mayor monto: 12 990.00, «Renta departamento», 2026-07-01 08:55:23.
    - El 1 de julio de 2026 es miércoles: cinco miércoles, jueves y viernes, cuatro de los demás días.
  - **Fuera del área pero obligatorio:** `tests/graficas/por-categoria.test.ts:7` construye un `Metricas` literal; al crecer `Metricas` no compila. El grupo 1 le da los campos nuevos (sin cambiar sus aserciones). `tests/dominio/metricas-kpis.test.ts:48-59` usa `toMatchObject` y no se rompe.
  - **Guarda:** cada test nombra su `R-xx` (regla innegociable 5); R-13 con meses de 28, 29, 30 y 31 días (caso borde de `docs/DOMINIO.md`).
  - **Skills de área:** `typescript-advanced-types`, `vitest`, `javascript-testing-patterns`.
- **Grupo 2 — Gráficas y lint de `echarts`** (`implementador-graficas`)
  - **Partida:** `src/graficas/por-categoria.ts` importa solo tipos de `echarts`, colorea cada barra en `itemStyle` y no fija grosor. Su test es `tests/graficas/por-categoria.test.ts`.
  - **Lint (2.1):** las zonas de capas excluyen `./node_modules` (`eslint.config.mjs:23`), así que hoy un `import { graphic } from 'echarts'` en `src/graficas/` pasa. La regla nueva va solo para `src/graficas/**` y permite `import type`. `tests/arquitectura/capas.test.ts` monta un árbol temporal con un `node_modules/papaparse` falso (`:63-68`) y lintea con la configuración real: los casos de `echarts` siguen ese patrón con un `node_modules/echarts` falso. `src/cliente/echarts.ts` importa valores de `echarts/*` y debe seguir pasando.
  - **Rótulos:** los nombres de los días y de los tipos de día llegan por argumento; montos y fechas con `formatearMonto` y `formatearFecha` del dominio.
  - **Si una opción usa leyenda, `markArea` u otro componente,** dilo en el reporte: el grupo 5 tiene que registrarlo en `src/cliente/echarts.ts`.
  - **Skills:** `typescript-advanced-types`, `vitest`.
- **Grupo 3 — Cliente: filtros, recálculo y estado vacío** (`implementador-cliente`)
  - **Partida:** `src/cliente/Tablero.tsx` calcula `metricas(resultado.transacciones)` en un `useMemo` y monta `Resumen`, `Kpis`, `GastoPorCategoria`. Ojo: al elegir otro archivo con el tablero a la vista, `App.tsx:62` vuelve a pintar `<Tablero resultado=…>` en el mismo sitio y React **no** lo remonta, así que un filtro guardado en el estado del `Tablero` sobreviviría a la carga nueva (con categorías que quizá no existen). La spec pide que otro archivo vacíe el filtro (tarea 3.2); el mecanismo (p. ej. una `key` por carga) lo elige el implementador.
  - **Trampas de nombres accesibles:**
    - los KPI son `group` con el nombre de la tarjeta (`tests/cliente/kpis.test.tsx:21`, `tests/sistema/flujo-principal.spec.ts:42`, con `exact: true`), y un `fieldset` también es `group`: ninguna `legend` repite el nombre de un KPI;
    - `tests/cliente/App.test.tsx` usa `findByRole('alert')` y `queryByRole('alert')`: el estado vacío es `role="status"`.
  - **Fechas:** `<select>` con los días del mes formateados con `formatearFecha`; no `<input type="date">` (R-17).
  - Es el área `visual` del perfil: captura del tablero filtrado con el fixture `2026-07-semilla-1`.
  - **Skills:** `typescript-advanced-types`, `vitest`, `vercel-react-best-practices`, `javascript-testing-patterns`.
- **Grupo 4 — Cliente: tabla de transacciones** (`implementador-cliente`)
  - **TanStack Table 9.3.1, no la 8:** no existen `useReactTable` ni `getSortedRowModel`. La API es `useTable({ features, columns, data })` con `features = tableFeatures({ rowSortingFeature, rowPaginationFeature, sortedRowModel: createSortedRowModel(), paginatedRowModel: createPaginatedRowModel(), sortFns })`, `createColumnHelper()` y `helper.columns([...])`; `features` y `columns` a nivel de módulo. Comprobado con React 18.3.1: `initialState` con `sorting` y `pagination` ordena y pagina (120 filas en páginas de 50 → 3).
  - **Antes de escribir código**, el encargo manda leer `node_modules/@tanstack/react-table/skills/getting-started/SKILL.md`, `node_modules/@tanstack/react-table/skills/table-state/SKILL.md` y los tipos de `node_modules/@tanstack/react-table/dist/index.d.ts`. La guía menciona `intent load …`: es otra herramienta, no se instala ni se corre.
  - **Orden por fecha:** clave `dia` + `hora`, y sin hora cuenta como inicio del día (`docs/olas/fase-1.md`, *Decisiones del PM*, ids generados).
  - **Volver a la página 1 al filtrar:** con test propio; no se confía en el valor por defecto de la biblioteca.
  - Captura de la tabla ordenada por monto.
  - **Skills:** las del grupo 3.
- **Grupo 5 — Gráficas en el cliente y flujo de sistema** (`implementador-cliente`)
  - **Arranca con el 2 y el 4 mergeados.**
  - `GastoPorCategoria.tsx` es el precedente: arma la descripción accesible con textos del catálogo y los formateadores de R-17 (`conDescripcion`) y monta `Grafica` con SVG. `src/cliente/echarts.ts` registra solo `BarChart`, `GridComponent`, `AriaComponent` y `SVGRenderer`: lo que el grupo 2 reporte que usa, se registra aquí.
  - **Spec de sistema nueva** (D8), importando `test` de `./sin-red`:
    - quincena: el `15/07/2026` y el `31/07/2026` identificados en la gráfica por día;
    - filtro del `01/07/2026` al `10/07/2026`: 590 transacciones, `$458,549.33`, `$45,854.93`;
    - tabla por monto descendente: primera fila `$12,990.00`;
    - quitar filtros: `$1,689,470.67`.
  - **Mutaciones** (las aplica el implementador en su árbol y las corres tú con `.claude/da/da sistema`, como en la fase 1, #14): el filtro de fechas no se aplica; el promedio divide entre el mes completo; el orden de la tabla no cambia.
  - Captura del tablero completo con el fixture `2026-07-semilla-1`.
  - **Skills:** las del grupo 3.

## 5. Mecánica de esta fase

- **Base de la ola:** `chore/fase-2-planning` sobre `ola/fase-1` (avance continuo pedido por el usuario el 2026-10-15; la PR de ola de la fase 1 es la #15). De ahí sale `ola/fase-2` y a ahí apunta su PR. Cuando el usuario mergee la pila, el Team Manager hará rebasar y reapuntar.
- **`master` frente a `main`:**
  - `.claude/da/da worktree montar` supone `main` (`.claude/da/lib/worktree.mjs`), así que pasa **siempre** `--desde`.
  - Los worktrees van en `/home/fabs/da-wt/tablero-gastos/<grupo>`, fuera de OneDrive: la ruta del repo tiene un espacio que rompe los ganchos del perfil.
  - En ellos el lanzador se invoca con `node ./.claude/da/da`.
  - No toques `.claude/`. En el checkout principal hay un cambio de esfuerzo de agentes sin commitear que no es de la ola.
- **Sin `"type": "module"`** en `package.json` (rompe `.claude/da/da`).
- **`gh pr edit` falla** con este `gh`: el cuerpo se edita con `gh api -X PATCH repos/<repo>/pulls/<n> -F body=@cuerpo.md`. `.claude/da/da medir` también falla: el *Coste* del registro se completa a mano.
- **Issues deshabilitadas en el repositorio:** la deuda va al registro.
- **Ni `npx` ni instalaciones,** tampoco para consultar versiones: los agentes lo repitieron en las fases 0 y 1. Recuérdalo en cada encargo y en cada lanzamiento de crítico.
- **Sin CI:** el CI de citas solo se dispara en PRs a `main`; el gate es tu `verify`.
- **Estado de partida esperado:** `verify` verde con 402 tests y `sistema` 2/2 sobre `ola/fase-1` @ `35d5971`.
- **Escalado:** propone el Team Manager (vía el Planeador), tomas tú, escalas al Team Manager. La sesión del Team Manager comparte el checkout principal: no cambies su rama. Handover, comando pesado uno a la vez y worktrees: `desarrollo-autonomo-pm` y `CLAUDE.md` (*Desarrollo agéntico* 8-9).
- **Cierre:** PR `ola/fase-2` → `chore/fase-2-planning` con la plantilla B, abierta para el usuario. Nada llega a `master` por el PM.

## 6. Primer paso concreto

1. `.claude/da/da preflight`, `.claude/da/da verify` y `.claude/da/da sistema` sobre la base, y la mecánica de OpenSpec sobre `fase-2-dashboard-filtros-y-tabla`.
2. La lista de arranque al Team Manager **solo si hay algo que pedir al usuario**. No se espera ninguna instalación: si un grupo pide una dependencia, se escala, no se instala.
3. Rama `ola/fase-2` desde `chore/fase-2-planning`, registro, y el primer encargo: el grupo 1. Tras su merge, el 2 y el 3 en paralelo, en worktrees disjuntos.
