# Tasks

Una sola ola (`fase-2`), 5 PRs internas, una por grupo. Grafo:

- 1 → 2
- 1 → 3 → 4
- 2 y 4 → 5
- Paralelo declarado: el 2 (`src/graficas/`, `tests/graficas/`, `eslint.config.mjs`, `tests/arquitectura/capas.test.ts`) junto a la cadena 3 → 4 (`src/cliente/`, `tests/cliente/`). Áreas disjuntas.

Reglas de la fase:
- Nada de historial, API, comparación, mapa, hallazgos (R-16) ni exportar (`docs/PLAN.md`, fase 2).
- Ninguna dependencia nueva; TanStack Table es la 9.3.1 instalada (`design.md` D7).
- `GastoDeCategoria`, `parsearCsv` y la firma de un argumento de `metricas` siguen valiendo: lo de la fase 1 no cambia de comportamiento sin filtros.
- No se tocan `src/servidor/`, `generador/`, `tests/fixtures/`, `playwright.config.ts` ni `package.json`.

## 1. Dominio: filtros, periodo, calendario y series

Área: `src/dominio/`, `tests/dominio/`; además `tests/graficas/por-categoria.test.ts`, solo para dar al literal de `Metricas` los campos nuevos. Specs `filtros-del-tablero` (requisitos de dominio) y `metricas-del-mes`; `design.md` D1 a D4. Cada test nombra su regla (`R-10`, `R-11`, `R-12`, `R-13`, `R-14`).

- [x] 1.1 Tests primero de R-10 por `filtrar`: Y entre dimensiones, O dentro de una, lista vacía sin restricción, rangos de fecha y monto inclusivos con cada extremo opcional, inicio después del fin → 0 filas, orden conservado; luego `Filtro` y `filtrar`; verificar con una mutación por regla (Y↔O, extremo exclusivo, lista vacía = nada)
- [x] 1.2 Tests primero de `opcionesDeFiltro` (del mes completo, sin repetidos, orden es) y de `periodoDelFiltro` (sin fechas = mes completo, recorte al mes, solo inicio, inicio después del fin = 0 días); luego su implementación; verificar con una mutación de cada caso
- [x] 1.3 Tests primero de R-11 con periodo (del 1 al 10 de julio del fixture `2026-07-semilla-1`: 458 549.33 y 45 854.933; periodo de 0 días → 0; sin periodo, igual que antes); luego el segundo argumento de `metricas`; verificar que los tests de `tests/dominio/metricas-kpis.test.ts` siguen en verde y que dividir entre los días con gasto hace fallar el nuevo
- [x] 1.4 Tests primero de R-13 (julio, febrero de 2026 y de 2028, septiembre; el 1 y el 16 post-quincena) y de R-14 (1 a 7 de julio de 2026), con dos zonas horarias en el entorno del test; luego las funciones de calendario sin `Date` con zona; verificar con una mutación del último día y otra del primer día del fin de semana
- [x] 1.5 Tests primero de las series (por día con días sin gasto y su tipo, el 15 del fixture con 125 transacciones y 107 565.60; por hora con una fila sin hora; por día de la semana en julio de 2026 con 5 viernes y 4 lunes y su promedio; por zona y por cuenta con R-12 y `Centro Histórico, CDMX` primero; lista vacía sin `NaN`); luego las series en `Metricas`, dando los campos nuevos al literal de `tests/graficas/por-categoria.test.ts`; verificar una mutación por serie y que `npm run lint` no marca I/O en `src/dominio/`

## 2. Gráficas: cinco series, barra acotada y `import type` por lint

Depende del grupo 1. Área: `src/graficas/`, `tests/graficas/`, `eslint.config.mjs`, `tests/arquitectura/capas.test.ts`. Specs `tablero-del-mes` (las gráficas y «Una sola barra no ocupa la gráfica»); `design.md` D5.

- [x] 2.1 Tests primero en `tests/arquitectura/capas.test.ts`: un import de valor de `echarts` y de `echarts/core` en `src/graficas/` da error; `import type` de `echarts` no; `src/cliente/` sigue pudiendo importar valores de `echarts`; luego la regla en `eslint.config.mjs`; verificar que cada caso nuevo falla con la configuración anterior
- [x] 2.2 Tests primero de por zona y por cuenta (una barra por entrada en el orden de `Metricas`, etiquetas con R-17, `aria` activado) y de `barMaxWidth` en todas las barras, incluida `porCategoria`; luego las funciones; verificar que quitar el grosor máximo hace fallar el test
- [x] 2.3 Tests primero de por día (una barra por día del periodo, color y marca por tipo de día de R-13, eje con días en R-17) y por hora (24 barras); luego las funciones, con los rótulos visibles recibidos por argumento; verificar que cambiar el color de quincena por el normal hace fallar un test
- [x] 2.4 Tests primero de por día de la semana (7 barras de lunes a domingo con el `promedio`, viernes a domingo marcados por R-14, nombres de los días por argumento); luego la función; verificar que usar el `monto` total en lugar del promedio hace fallar el test y que `npm run lint` pasa sobre `src/graficas/`

## 3. Cliente: filtros, recálculo y estado vacío

Depende del grupo 1. Área: `src/cliente/`, `tests/cliente/`. Spec `filtros-del-tablero` (requisitos de la página); `design.md` D6. Textos visibles solo en `src/cliente/textos.ts`.

- [x] 3.1 Tests de componente primero: el panel ofrece fechas en dd/mm/aaaa del mes cargado, una casilla por categoría, cuenta y zona del mes completo y los dos campos de monto, todo por rol y nombre accesible del catálogo; luego el componente de filtros; verificar que las opciones no desaparecen tras filtrar
- [x] 3.2 Tests primero de que el tablero se recalcula (con un CSV pequeño: elegir una categoría cambia los KPIs y la lista por categoría; un rango de fechas cambia el promedio diario según el periodo; el resumen de validación no cambia; quitar filtros vuelve al total; otro archivo vacía el filtro); luego el estado del filtro en `Tablero` con `filtrar`, `periodoDelFiltro` y `metricas(tx, periodo)`; verificar que pasar `metricas` sin periodo hace fallar el test del promedio
- [x] 3.3 Tests primero del estado vacío (monto mínimo mayor que el máximo: mensaje con `role="status"`, sin KPIs ni gráficas, ningún `NaN` en la página, el panel sigue y quitar filtros vuelve al tablero) y de que `tests/cliente/App.test.tsx` sigue en verde; luego el estado vacío; verificar con una mutación que quite el mensaje y dejar captura del tablero filtrado con el fixture `2026-07-semilla-1`

## 4. Cliente: tabla de transacciones

Depende del grupo 3. Área: `src/cliente/`, `tests/cliente/`. Spec `detalle-de-transacciones`; `design.md` D7. Antes de escribir código, leer `node_modules/@tanstack/react-table/skills/getting-started/SKILL.md` y `node_modules/@tanstack/react-table/skills/table-state/SKILL.md`.

- [x] 4.1 Tests de componente primero: una fila por transacción filtrada con fecha y monto en R-17, una fila sin hora sin hora inventada, orden inicial por fecha y hora; luego la tabla con `useTable` de TanStack Table 9; verificar que la tabla sigue al filtro del grupo 3
- [x] 4.2 Tests primero del orden por columna (monto descendente pone primero el mayor, `aria-sort` anuncia el orden, fecha ascendente pone la fila sin hora antes que las de su día); luego los controles de orden; verificar que invertir la comparación hace fallar el test
- [x] 4.3 Tests primero de la paginación (50 por página, «página X de Y», anterior y siguiente, volver a la 1 al cambiar el filtro desde la 3); luego la paginación; verificar con una mutación que no vuelva a la 1 y dejar captura de la tabla ordenada por monto

## 5. Cliente: las gráficas nuevas y el flujo de sistema

Depende de los grupos 2 y 4. Área: `src/cliente/`, `tests/cliente/`, `tests/sistema/`. Spec `tablero-del-mes` (gráficas y flujo de sistema); `design.md` D5 y D8.

- [ ] 5.1 Tests de componente primero: con un CSV pequeño se ven las cinco gráficas con su título y su descripción accesible (montos y fechas en R-17), la de día marca la quincena con su significado legible y la de día de la semana el fin de semana; luego las secciones, los rótulos del catálogo y el registro en `src/cliente/echarts.ts` de cada componente que usen las opciones; verificar que quitar un componente registrado que la opción usa hace fallar un test y dejar captura del tablero completo con el fixture `2026-07-semilla-1`
- [ ] 5.2 Spec de sistema nueva que importa `test` de `./sin-red` y recorre `design.md` D8 con cifras literales, nunca llamando al dominio; verificar (PM, `.claude/da/da sistema`) que pasa junto con `flujo-principal.spec.ts` y `pagina-vacia.spec.ts`, y que falla con cada mutación: el filtro de fechas no se aplica, el promedio divide entre el mes completo, el orden de la tabla no cambia (mutaciones que no se commitean)
