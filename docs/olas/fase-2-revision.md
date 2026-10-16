# Revisión del pre-vuelo — Ola `fase-2` «Dashboard completo, filtros y tabla»

Verificado el 2026-10-16 contra `ola/fase-1` @ `35d5971`. La ola se apila sobre la fase 1 por petición del usuario (avance continuo, sin merges a `master`). La rama principal se llama `master`.

## 1. Veredicto

- `fase-2-dashboard-filtros-y-tabla`: propuesto en este pre-vuelo (`openspec validate --strict` válido, 17 tareas en 5 grupos); listo para un PM.
- **Ola `fase-2`: lista para delegar**, con las decisiones 1 a 5 escritas en los artefactos con la opción recomendada. Si el Team Manager o el usuario cambian alguna, se reescribe por `openspec-update-change` antes del primer encargo.
- Lo más importante:
  - la fase cabe en una ola de 5 PRs; no hace falta partirla;
  - TanStack Table instalado es la **9.3.1**, con otra API que la 8 que conocen los implementadores (verificado que funciona con React 18; el paquete trae su guía);
  - R-11 obliga a que `metricas` reciba el periodo del filtro: añadido opcional a la firma.

## 2. La ola

- **Ola `fase-2` — `fase-2-dashboard-filtros-y-tabla`** (5 PRs internas)
  - **Entregable**
    - Gráficas por día (con quincena, post-quincena y pre-quincena marcadas), hora, día de la semana (promedio por día, viernes a domingo marcados), zona y cuenta
    - Panel de filtros (fechas en dd/mm/aaaa, categorías, cuentas, zonas, monto) con el que KPIs, gráficas y tabla se recalculan; estado vacío con mensaje si quedan 0 filas
    - Tabla de transacciones ordenable por columna y paginada
    - Una prueba de sistema nueva: cargar, ver la quincena, filtrar del 1 al 10, ver 590 transacciones y `$45,854.93` de promedio diario, ordenar por monto, quitar filtros
    - El lint rechaza imports de valor de `echarts` en `src/graficas/`
  - **Componentes que se modifican**
    - `src/dominio/` (filtro y calendario nuevos; `metricas.ts` gana periodo y series), `tests/dominio/`
    - `src/graficas/` (cinco funciones nuevas; `por-categoria.ts` con grosor máximo), `tests/graficas/`
    - `src/cliente/` (`Tablero.tsx`, `textos.ts`, `estilos.css`, `echarts.ts` y componentes nuevos), `tests/cliente/`
    - `tests/sistema/` (spec nueva)
    - `eslint.config.mjs`, `tests/arquitectura/capas.test.ts`
    - No se toca: `src/servidor/`, `src/dominio/carga.ts`, `generador/`, `tests/fixtures/`, `playwright.config.ts`, `package.json`, `docs/` (salvo el registro), `.claude/`, `openspec/specs/`

## 3. Hallazgos

### BLOQUEA EL ARRANQUE

Ninguno abierto. Lo que bloqueaba se corrigió en los artefactos:

- **No existía el change de la ola.** `openspec list --json` solo tenía `fase-0-andamiaje` y `fase-1-cargar-y-ver-el-mes`. Corregido: propuesto `fase-2-dashboard-filtros-y-tabla`.

### CORREGIR ANTES DE ENCARGAR (ya escrito en `design.md` y `tasks.md`)

- **R-11 «del periodo filtrado» no cabe en `metricas(tx)`.**
  - Evidencia (verificado): `src/dominio/metricas.ts:76` divide entre los días del mes de la primera transacción; el comentario de `:17-20` ya lo anuncia.
  - Por qué importa: con el filtro del 1 al 10 de julio el promedio correcto es `$45,854.93` (10 días); con la firma actual saldría entre 31.
  - Corrección: `design.md` D2, `metricas(tx, periodo?)` y `periodoDelFiltro(mes, filtro)`. Decisión 3.
- **TanStack Table 9.3.1, no la 8.**
  - Evidencia (verificado): `package.json` fija `@tanstack/react-table` 9.3.1; exporta `useTable`, `tableFeatures`, `rowSortingFeature`, `createSortedRowModel`, `rowPaginationFeature`, `createPaginatedRowModel`; no hay `useReactTable`. Con React 18.3.1, orden descendente y páginas de 50 sobre 120 filas funcionan (`pages=3`).
  - Por qué importa: un implementador que escriba la API de la 8 no compila; son rondas.
  - Corrección: `design.md` D7 y tarea 4 mandan leer `node_modules/@tanstack/react-table/skills/getting-started/SKILL.md` y `table-state/SKILL.md` antes de escribir código. Ningún skill de `.claude/skills/` cubre TanStack Table; la guía del paquete basta y no hay que instalar nada (comprobación 18).
- **`<input type="date">` no cumple R-17.** Su formato visible depende del idioma del navegador. Corrección: D6, listas desplegables con los días formateados por el dominio. Decisión 5.
- **Los textos de ejes y leyendas (días de la semana, tipos de día) son visibles y viven en `src/cliente/textos.ts`, que `graficas` no puede importar** (`eslint.config.mjs:8-14`). Corrección: D5, argumento de rótulos.
- **Un componente de ECharts que la opción usa y el cliente no registra se ignora sin error.** `src/cliente/echarts.ts` registra solo barras, rejilla, aria y SVG. Corrección: D5 y tarea 5.1 (registro y su test).
- **`tests/graficas/por-categoria.test.ts:7` construye un `Metricas` literal** y deja de compilar cuando `Metricas` crezca. Es del área de gráficas, pero lo rompe el grupo 1. Corrección: tarea 1.5 lo nombra en su área.
- **Choques de nombres accesibles.** Los `fieldset` del filtro son `group`, igual que las tarjetas de KPI (`tests/sistema/flujo-principal.spec.ts:42`, `tests/cliente/kpis.test.tsx:21`); `tests/cliente/App.test.tsx` cuenta `alert`. Corrección: D6 (estado vacío con `role="status"`, ninguna `legend` repite el nombre de un KPI).
- **Con filtros, una sola categoría pasa a ser lo común, y su barra llena el alto** (`docs/olas/fase-1.md`, *Deuda*, #13). Corrección: D5, `barMaxWidth` en todas las barras; requisito en `tablero-del-mes`.

### DEUDA (no bloquea; las issues están deshabilitadas en el repositorio, así que van aquí)

- **Deuda de la fase 1 que esta ola absorbe:**
  - `import type` de `echarts` en `src/graficas/` por lint (`eslint.config.mjs:23`), en la tarea 2.1;
  - barra única demasiado alta, en la tarea 2.2.
- **Deuda de la fase 1 que esta ola no absorbe** (la ola no toca esos archivos; decisión 2):
  - `src/dominio/carga.ts` (`leerRegistros`): las comillas mal puestas se tragan filas sin reportarlas;
  - `src/dominio/carga.ts:75`: el filtro `FieldMismatch` sin test (va con la anterior);
  - `src/servidor/main.ts:10` y `:28`: el literal `'dist'` dos veces;
  - `src/cliente/App.tsx` (`alElegir`): el aviso de archivo ilegible afirma una causa que puede no ser la real;
  - detalles visuales de #13 («Sin categoría» partida en dos líneas, el nombre del archivo cargado no se ve).
- **`docs/ARQUITECTURA.md`, *Contratos*, se queda atrás:** no nombra `CargaRechazada` ni `pideConfirmacion` (fase 1), ni `metricas(tx, periodo?)`, `opcionesDeFiltro`, `periodoDelFiltro` ni el argumento de rótulos de `graficas` (esta fase). Son añadidos declarados en `design.md`. Corregirlo es una PR de documentación para el usuario, y conviene hacerla una vez, al cerrar la pila.
- **Los textos visibles de las gráficas viven en el cliente;** el reporte de la fase 5 tampoco podrá importarlos. El argumento de rótulos de D5 deja la puerta abierta. Para la planeación de la fase 5.
- Mecánica (no producto), sin cambios: `master` frente a `main` (pasar `--desde`), worktrees fuera de OneDrive, lanzador con `node`, `gh pr edit` roto, `da medir` roto, `npx` repetido por los agentes pese a la prohibición. No se toca `.claude/`.

## 4. Tope de PRs y partición

- `fase-2-dashboard-filtros-y-tabla`: 5 grupos → 5 PRs internas, en el tope.
- Grafo: 1 → 2; 1 → 3 → 4; 2 y 4 → 5. Paralelo declarado: el 2 junto a la cadena 3 → 4, con áreas disjuntas (gráficas y lint frente a cliente).
- Estimación de diff (código y tests, sin capturas):

| Grupo | Contenido | Estimado | Referencia de la fase 1 |
|---|---|---|---|
| 1 | Dominio: filtro, periodo, calendario, series | ~750 | #11 (dominio de carga): 968 |
| 2 | Gráficas ×5, barra acotada, lint de `echarts` | ~650 | #12 (métricas y gráfica): 441 |
| 3 | Cliente: filtros, recálculo, estado vacío | ~600 | #13 (cliente): 1 127 |
| 4 | Cliente: tabla TanStack 9 | ~500 | — |
| 5 | Cliente: gráficas nuevas + spec de sistema | ~700 | #13 y #14: 1 127 y 99 |

- Por encima de las ~600 orientativas, por debajo de las 1 800 que agotan el tope. En la fase 1 cada PR acabó entre 960 y 1 130 líneas con 2 rondas en total.
- La tabla (lo más incierto, por la versión 9) va aislada en su grupo.
- Partir cualquier grupo supone partir la ola: el PM lo escala antes. Decisión 1.

## 5. Lo que la ola absorbe

- `docs/olas/fase-1.md`, *Deuda*:
  - zonas de capas sin `node_modules` → grupo 2 (2.1), solo para `echarts` en `graficas`
  - barra única demasiado alta → grupo 2 (2.2)
  - comillas mal puestas, `FieldMismatch`, `'dist'`, aviso de archivo ilegible, detalles visuales → no (decisión 2)
- `docs/olas/fase-1.md`, *Lo que queda fuera*: WebSockets y peticiones tardías → fase 3 (D-TM1 de la fase 1), sin cambio.
- `docs/DOMINIO.md`, *Casos borde*: filtros que dejan 0 filas → grupos 1 (1.1, 1.5) y 3 (3.3); meses de 28, 29, 30 y 31 días para R-13 → grupo 1 (1.4).

## 6. Lo que está bien

- Ninguna dependencia nueva: ECharts, TanStack Table, React y Papa Parse cubren la fase.
- R-13 de `docs/DOMINIO.md` coincide con `tipo_dia` del generador (`generador/generar_transacciones.py`), también en la precedencia quincena → post → pre.
- El patrón se ve con el fixture: en `2026-07-semilla-1` el gasto medio de quincena y post-quincena es 2.83 veces el del resto, y el de viernes a domingo 1.67 veces el de lunes a jueves.
- `filtrar(tx, filtro)` y «una función por gráfica» ya están en `docs/ARQUITECTURA.md`, *Contratos*.
- `tests/dominio/metricas-kpis.test.ts:48-59` compara el caso vacío con `toMatchObject`: crecer `Metricas` no lo rompe.
- El lint de la suite de sistema (`eslint.config.mjs:85-110`) ya obliga a importar `test` de `./sin-red`.
- `[PENDIENTE]` de `docs/PLAN.md`: los dos que quedan son de la fase 4.

## 7. Decisiones

Escritas en los artefactos con la recomendación; la ola arranca con ellas salvo que se reviertan.

1. **Una ola o dos** (*técnica*, Team Manager).
   - Opciones:
     - (a) una ola de 5 PRs, con grupos de ~500 a ~750 líneas estimadas;
     - (b) dos olas: «gráficas completas» (dominio de series, gráficas, cliente) y «filtros y tabla» (dominio de filtro, cliente de filtros, tabla, sistema), 7 PRs y otro ciclo de planeación.
   - Recomendación: (a). Cabe en el tope, los tamaños son los de la fase 1, que salió con 2 rondas, y la tabla va aislada.
2. **Qué deuda heredada entra** (*técnica*, Team Manager; habilitar issues es *del usuario*).
   - Opciones:
     - (a) solo la que guarda lo que esta ola añade: lint de `echarts` en `graficas` y barra única;
     - (b) además las comillas mal puestas y `FieldMismatch` en el grupo 1 (+~150 líneas en `carga.ts`, que esta ola no toca).
   - Recomendación: (a). Lo demás no amenaza el entregable; queda en los registros. Para que no se pierda, se propone al usuario habilitar las issues del repositorio y llevar la deuda de carga como arreglo.
3. **Cómo entra el periodo de R-11** (*técnica*, Team Manager).
   - Opciones:
     - (a) `metricas(tx, periodo?)` y `periodoDelFiltro(mes, filtro)`, añadido declarado;
     - (b) `metricas(tx, filtro)`;
     - (c) el promedio en el cliente.
   - Recomendación: (a). Conserva la firma de un argumento para la fase 1 y separa filtrar de medir, como `docs/ARQUITECTURA.md`. El documento se actualiza en una PR del usuario al cerrar la pila.
4. **Tabla con 20 000 filas** (*técnica*, Team Manager; la virtualización sería *del usuario*, por la dependencia).
   - Opciones:
     - (a) páginas de 50 con la paginación de TanStack Table;
     - (b) todas las filas en el DOM;
     - (c) virtualizar con `@tanstack/react-virtual` (dependencia nueva que instala el usuario).
   - Recomendación: (a).
5. **Presentación del filtro de fechas y de la gráfica por día de la semana** (*técnica*, Team Manager).
   - Opciones:
     - fechas: (a) listas con los días en dd/mm/aaaa; (b) `<input type="date">`, que no cumple R-17;
     - día de la semana: (a) promedio por día; (b) total, que premia a los días que caen cinco veces en el mes.
   - Recomendación: (a) y (a).

Brief: `docs/olas/fase-2-brief.md`.
