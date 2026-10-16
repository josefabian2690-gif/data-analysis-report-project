# Design

## Context

Motivación en `proposal.md`. Estado de partida, verificado en `ola/fase-1` @ `35d5971` el 2026-10-16:

- `src/dominio/metricas.ts` exporta `metricas(tx)` y `Metricas` con los cinco KPIs y `gastoPorCategoria`. El promedio diario divide entre los días naturales del mes de la primera transacción (`metricas.ts:17-21`, `:76`). `diasDelMes(anio, mes)` está en `src/dominio/fecha.ts:13`.
- `Transaccion` (`src/dominio/esquema.ts`) guarda `dia` (`AAAA-MM-DD`) y `hora` (`HH:MM:SS` o `null`), sin `Date`.
- No existen `Filtro` ni `filtrar` (`docs/ARQUITECTURA.md`, *Contratos*, los anuncia).
- `src/graficas/por-categoria.ts` construye barras horizontales, importa de `echarts` solo tipos, y cada barra lleva su color en `itemStyle`.
- El cliente: `Tablero.tsx` calcula `metricas(resultado.transacciones)` con `useMemo` y monta `Resumen`, `Kpis` y `GastoPorCategoria`. `GastoPorCategoria.tsx` arma la descripción accesible de la gráfica con textos del catálogo y los formateadores de R-17. `echarts.ts` registra `BarChart`, `GridComponent`, `AriaComponent` y `SVGRenderer`, nada más.
- Quién construye un `Metricas` completo: `tests/graficas/por-categoria.test.ts:7` (literal tipado). Al crecer `Metricas` deja de compilar y hay que darle los campos nuevos. `tests/dominio/metricas-kpis.test.ts:48-59` compara el caso vacío con `toMatchObject` y sigue valiendo.
- El lint de capas excluye `./node_modules` de sus zonas (`eslint.config.mjs:23`): hoy nada impide un import de valor de `echarts` en `src/graficas/`.
- TanStack Table instalado es la **9.3.1** (`package.json`), cuya API no es la de la 8: `useTable` con `tableFeatures({...})`, `rowSortingFeature`, `createSortedRowModel()`, `rowPaginationFeature`, `createPaginatedRowModel()`. Comprobado con React 18.3.1: orden descendente y páginas de 50 sobre 120 filas dan `pages=3`. El paquete trae su propia guía en `node_modules/@tanstack/react-table/skills/` y `node_modules/@tanstack/table-core/skills/`.
- Cifras del fixture `2026-07-semilla-1` (calculadas con Papa Parse fuera del código del tablero): 2 000 filas, todas con hora; Compras 404 transacciones y 814 566.30; del 1 al 10 de julio 590 y 458 549.33; el 15, 125 y 107 565.60; mayor monto 12 990.00 («Renta departamento», 01/07); primera zona `Centro Histórico, CDMX`; 10 categorías, 3 cuentas, 7 zonas. El 1 de julio de 2026 es miércoles.

## Goals / Non-Goals

**Goals:**
- Cada regla R-10, R-11 (periodo), R-13 y R-14 con su test que la nombra, y los casos borde de `docs/DOMINIO.md` que tocan: filtros que dejan 0 filas; meses de 28, 29, 30 y 31 días para R-13.
- El dashboard entero responde a los filtros sin recalcular nada fuera del dominio.

**Non-Goals:**
- Hallazgos de R-16, incluido el cociente quincena/resto o fin de semana/entre semana como texto con umbral (fase 4).
- Historial, API, comparación, mapa y exportar.
- Filtros propios de la tabla (búsqueda de texto, filtros por columna) y virtualización de filas.
- Guardar los filtros entre cargas o en la URL.
- Deuda de carga (`docs/olas/fase-1.md`, *Deuda*: comillas mal puestas, `FieldMismatch` sin test), de `src/servidor/main.ts` (literal `'dist'`) y de `App.tsx` (aviso de archivo ilegible): esta fase no toca esos archivos.

## Decisions

### D1. `Filtro` y `filtrar`

- `Filtro` es un objeto plano con todo opcional: `desde` y `hasta` (días `AAAA-MM-DD`), `categorias`, `cuentas` y `zonas` (listas), `montoMinimo` y `montoMaximo`.
- Una lista vacía o ausente no restringe; los extremos son inclusivos; la fecha compara el `dia` (la hora no cuenta). Inicio después del fin: 0 filas.
- `filtrar(tx, filtro)` con la firma de `docs/ARQUITECTURA.md`; conserva el orden de entrada.
- `opcionesDeFiltro(tx)`: categorías, cuentas y zonas distintas, ordenadas con `localeCompare(…, 'es')`, del mes completo.
- `periodoDelFiltro(mes, filtro)`: `{ desde, hasta }` recortado al mes; sin fechas, el mes completo.

Alternativa descartada: lista vacía = 0 filas. Con casillas, «ninguna marcada» dejaría el tablero vacío por defecto.

### D2. El periodo entra en `metricas` como segundo argumento opcional

`metricas(tx, periodo?)`. Con periodo, el promedio diario divide entre sus días naturales (0 días → 0) y la serie por día lo recorre entero; sin periodo, el mes de las transacciones, como hoy, para que los llamadores y tests de la fase 1 no cambien. El cliente siempre pasa `periodoDelFiltro(mes, filtro)`.

Es un añadido a la firma de `docs/ARQUITECTURA.md` (*Contratos*). Ese documento solo lo cambia una PR del usuario; queda anotado junto a los añadidos de la fase 1 (`CargaRechazada`, `pideConfirmacion`).

Alternativas descartadas:
- Pasar el `Filtro` a `metricas`: mezcla filtrar y medir, que ARQUITECTURA separa.
- Calcular el promedio en el cliente: lógica de dominio fuera del dominio.

### D3. Calendario sin zona horaria

`tipoDeDia(dia)` devuelve `'quincena' | 'post-quincena' | 'pre-quincena' | 'normal'` con el orden de precedencia del generador (`generador/generar_transacciones.py`, `tipo_dia`): primero quincena, luego post, luego pre. `esFinDeSemana(dia)` y el día de la semana se calculan desde la cadena `AAAA-MM-DD` con aritmética de calendario o con `new Date('AAAA-MM-DD')` y métodos `getUTC*` (el lint de pureza permite `new Date` con argumento). Los tests corren con al menos dos zonas horarias, como los formateadores de la fase 1.

### D4. Series de `Metricas` (aditivas)

`Metricas` gana, sin tocar lo que ya tiene:
- `gastoPorDia`: por día del periodo, `{ dia, monto, transacciones, tipo, finDeSemana }`.
- `gastoPorHora`: 24 entradas `{ hora, monto, transacciones }` y `transaccionesSinHora`.
- `gastoPorDiaDeLaSemana`: 7 entradas de lunes a domingo, `{ diaDeLaSemana, monto, dias, promedio, finDeSemana }`.
- `gastoPorZona` y `gastoPorCuenta`: como `gastoPorCategoria` (monto, transacciones, proporción sobre el monto, mismo orden).

Los nombres exactos los fija el grupo 1; `GastoDeCategoria` y sus campos no cambian (los usan `graficas` y el cliente).

La gráfica por día de la semana usa `promedio` y no el total: julio de 2026 tiene cinco miércoles, jueves y viernes y cuatro de los demás, y el total premia a esos días; es además la medida de R-16 (fin de semana). Descartado: el total.

### D5. Gráficas

- Una función por gráfica en `src/graficas/` (`docs/ARQUITECTURA.md`, *Contratos*): por día, por hora, por día de la semana, por zona y por cuenta. Zona y cuenta reutilizan la construcción de barras de `porCategoria`.
- Los textos visibles que no son datos (nombres de los días de la semana, nombres de los tipos de día, «fin de semana») viven en `src/cliente/textos.ts`, que `graficas` no puede importar. Las funciones que los necesitan los reciben en un argumento de rótulos. Montos y fechas, con los formateadores de R-17 del dominio.
- Quincena y fin de semana: color por tipo de día y una marca que no dependa solo del color (patrón o leyenda con texto). Si la opción usa un componente de ECharts más allá de barras, rejilla y aria (leyenda, `markArea`, `visualMap`…), el cliente lo registra en `src/cliente/echarts.ts`; sin registrarlo, ECharts lo ignora sin fallar.
- Todas las barras llevan un grosor máximo (`barMaxWidth`), también `porCategoria`: con una sola categoría hoy dibuja una barra que llena el alto (`docs/olas/fase-1.md`, *Deuda*).
- `echarts` solo con `import type` en `src/graficas/`, ahora **por lint**: regla en `eslint.config.mjs` para `src/graficas/**` que rechaza imports de valor de `echarts` y `echarts/*` y permite `import type`, con sus casos en `tests/arquitectura/capas.test.ts`. Se absorbe aquí porque la fase añade cinco módulos a la capa.

Alternativa descartada: los rótulos los pone el cliente reescribiendo la opción, como la descripción accesible. Funciona para `aria`, pero para ejes y leyendas obliga al cliente a conocer la estructura interna de cada opción.

### D6. Filtros en el cliente

- Fechas: dos listas desplegables (`<select>`) con los días del mes formateados con R-17, no `<input type="date">`, cuyo formato visible depende del idioma del navegador y no cumpliría R-17.
- Categorías, cuentas y zonas: casillas dentro de un `fieldset` con `legend` por dimensión.
- Monto: dos campos numéricos (mínimo y máximo).
- Un botón para quitar todos los filtros.
- Las opciones salen de `opcionesDeFiltro` sobre el mes completo; el filtro vive en el estado del `Tablero` y vuelve a vacío al cargar otro archivo. Ojo: con el tablero a la vista, elegir otro archivo vuelve a pintar `<Tablero>` en el mismo sitio (`src/cliente/App.tsx:62`) y React no lo remonta; el reinicio hay que provocarlo (por ejemplo, una `key` por carga).
- Estado vacío: mensaje con `role="status"`, no `alert`. Las pruebas de `tests/cliente/App.test.tsx` cuentan los `alert` para el rechazo y la lectura fallida.
- Nombres accesibles: los `fieldset` son `group` como las tarjetas de KPI (`tests/cliente/kpis.test.tsx`, `tests/sistema/flujo-principal.spec.ts:42` buscan `group` por nombre exacto). Ninguna `legend` repite el nombre de un KPI.

### D7. Tabla de transacciones con TanStack Table 9

- `useTable` con `rowSortingFeature` + `createSortedRowModel` y `rowPaginationFeature` + `createPaginatedRowModel`; `features` y `columns` a nivel de módulo (la guía del paquete lo exige para no recalcular en cada render).
- Páginas de 50 filas. 20 000 filas en el DOM a la vez vuelven lenta la página; virtualizar exigiría `@tanstack/react-virtual`, que no está instalado.
- Orden por fecha con la clave `dia` + `hora`, y una fila sin hora cuenta como inicio de su día (el mismo criterio que los ids generados de R-02, `docs/olas/fase-1.md`, *Decisiones del PM*). Orden inicial: fecha ascendente.
- El control de orden es un botón dentro del `th`, y el `th` lleva `aria-sort`.
- Al cambiar el conjunto filtrado, la página vuelve a la 1 (se comprueba con un test; no se confía en el valor por defecto de la biblioteca).

Alternativas descartadas: tabla a mano (el STACK eligió TanStack Table) y todas las filas sin paginar.

### D8. Suite de sistema

Una spec nueva en `tests/sistema/` que importa `test` de `./sin-red` (lo exige el lint):
- Carga `2026-07-semilla-1.csv` tal cual.
- Comprueba que la gráfica por día identifica el 15 y el 31 como quincena.
- Filtra del `01/07/2026` al `10/07/2026` y comprueba 590 transacciones, `$458,549.33` y `$45,854.93` de promedio diario (R-11 con periodo).
- Ordena la tabla por monto descendente y comprueba la primera fila (`$12,990.00`).
- Quita los filtros y vuelve a `$1,689,470.67`.

Las cifras van como literales (calculadas fuera del tablero, *Context*). La spec de la fase 1 (`flujo-principal.spec.ts`) no cambia.

## Risks / Trade-offs

- [Los implementadores conocen la API de TanStack Table 8 (`useReactTable`, `getSortedRowModel`), que en la 9 no existe] → el encargo del grupo 4 manda leer antes `node_modules/@tanstack/react-table/skills/getting-started/SKILL.md` y `table-state/SKILL.md`, y los tipos de `node_modules/@tanstack/react-table/dist/index.d.ts`. Nada se instala.
- [Con el rango de fechas y el filtro de monto, el promedio diario puede confundir: filtra transacciones pero divide entre todos los días del periodo] → es lo que dice R-11 («del periodo filtrado»); el test de D2 lo fija.
- [Rendimiento con 20 000 filas: cada cambio de filtro recorre todas las transacciones y ordena montos para la mediana] → O(n log n) sobre 20 000 cabe en un cuadro; se recalcula con `useMemo` por filtro. Sin pruebas de rendimiento.
- [Un componente de ECharts que la opción usa y el cliente no registra se ignora en silencio] → D5; los tests de componente montan la gráfica real y afirman la descripción accesible y, donde la marca es leyenda, que aparece.
- [Los textos de gráficas viven en el catálogo del cliente; el reporte de la fase 5 tampoco podrá importarlos] → no es de esta fase; el argumento de rótulos de D5 deja la puerta abierta a pasarle otros.
- [Grupos más grandes que las ~600 líneas orientativas: en la fase 1 cada PR acabó en 960–1 130 líneas] → la partición de `tasks.md` reparte el trabajo en 5 grupos con el riesgo (TanStack 9) aislado en uno; partir más supone partir la ola, y el PM lo escala antes.
- [`metricas-del-mes` y `tablero-del-mes` aún no están en `openspec/specs/`] → los deltas solo añaden requisitos. El Archivador archiva `fase-0-andamiaje` y `fase-1-cargar-y-ver-el-mes` antes que este change.
