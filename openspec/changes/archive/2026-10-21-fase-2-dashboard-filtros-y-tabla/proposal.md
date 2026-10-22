# Proposal

## Why

Tras la fase 1 el tablero muestra un mes entero sin poder recortarlo: cinco KPIs y el gasto por categoría. La fase 2 de `docs/PLAN.md` («Dashboard completo, filtros y tabla») completa el dashboard del MVP: las gráficas por día, hora, día de la semana, zona y cuenta; los filtros de R-10, con los que todo se recalcula; y la tabla de transacciones ordenable. En la demo, con el fixture de semilla, se tienen que ver la quincena (R-13) y el fin de semana (R-14) que imprime el generador.

## What Changes

- **Filtros (R-10), en el dominio:** `filtrar(tx, filtro)` con rango de fechas, categorías, cuentas, zonas y rango de monto; dimensiones distintas con Y, valores de una misma dimensión con O. Las opciones de cada filtro salen del mes completo.
- **Periodo filtrado (R-11):** el gasto promedio por día divide entre los días del periodo filtrado; sin filtro de fechas, el mes completo (como hoy). `metricas` recibe el periodo como segundo argumento opcional (añadido declarado a la firma de `docs/ARQUITECTURA.md`).
- **Calendario del gasto (R-13, R-14):** tipo de día (quincena, post-quincena, pre-quincena, normal) y fin de semana (viernes a domingo), sin depender de la zona horaria.
- **Series nuevas de `Metricas`:** por día del periodo (con su tipo de día y si es fin de semana), por hora (las filas sin hora no cuentan, R-03), por día de la semana, por zona y por cuenta (porcentajes sobre el monto, R-12).
- **Gráficas:** una función por gráfica en `src/graficas/` para las cinco series; la de categoría deja de dibujar una barra gigante cuando solo queda una categoría (deuda de la fase 1, que con filtros pasa a ser lo común).
- **Cliente:** panel de filtros, dashboard que se recalcula al filtrar, estado vacío con mensaje cuando el filtro deja 0 filas, las cinco gráficas nuevas con la quincena y el fin de semana marcados, y la tabla de transacciones ordenable y paginada sobre el conjunto filtrado.
- **Suite de sistema:** una prueba nueva del dashboard filtrado de punta a punta.
- **Deuda que se absorbe:** el lint hace cumplir que `src/graficas/` solo importe tipos de `echarts` (`docs/olas/fase-1.md`, *Deuda*, `eslint.config.mjs:23`), porque esta fase añade cinco módulos a esa capa.
- Fuera de alcance (`docs/PLAN.md`, fase 2): historial y su API, comparación, mapa, hallazgos (R-16; la quincena y el fin de semana se **ven** en las gráficas, pero el texto de hallazgo con su umbral es de la fase 4), exportar.

## Interpretación del entregable

- «En la demo se ven la quincena y el fin de semana»: la gráfica por día marca los días de quincena, post-quincena y pre-quincena de R-13, y la de día de la semana marca viernes a domingo (R-14). Con `2026-07-semilla-1` el gasto medio de quincena y post-quincena es 2.83 veces el del resto, y el de viernes a domingo 1.67 veces el de lunes a jueves (calculado fuera del código del tablero el 2026-10-16): el patrón salta a la vista sin calcular hallazgos.
- «Tabla ordenable»: la tabla de transacciones se filtra con los filtros de R-10 (no lleva filtros propios) y se ordena por cualquiera de sus columnas.

## Capabilities

Las capacidades `metricas-del-mes` y `tablero-del-mes` las crea `fase-1-cargar-y-ver-el-mes`, aún sin archivar; este change solo les **añade** requisitos y se archiva después de aquel.

### New Capabilities
- `filtros-del-tablero`: qué transacciones deja un filtro (R-10), qué opciones ofrece y qué periodo define, y cómo la página entera se recalcula al filtrar.
- `detalle-de-transacciones`: la tabla de transacciones del conjunto filtrado, ordenable por columna y paginada.

### Modified Capabilities
- `metricas-del-mes`: añade el periodo filtrado del promedio diario (R-11), el calendario de R-13 y R-14 y las series por día, hora, día de la semana, zona y cuenta.
- `tablero-del-mes`: añade las cinco gráficas nuevas con la quincena y el fin de semana marcados, y el flujo del dashboard filtrado en la suite de sistema.

## Impact

- **Nuevos:** módulos de filtro y de calendario en `src/dominio/`; cinco funciones en `src/graficas/`; componentes de filtros, de gráficas y de la tabla en `src/cliente/`; sus tests en `tests/dominio/`, `tests/graficas/`, `tests/cliente/`; una spec nueva en `tests/sistema/`.
- **Modificados:**
  - `src/dominio/metricas.ts` (periodo y series; `Metricas` crece de forma aditiva).
  - `src/graficas/por-categoria.ts` (alto de barra acotado).
  - `src/cliente/Tablero.tsx`, `src/cliente/textos.ts`, `src/cliente/estilos.css`, `src/cliente/echarts.ts` (componentes de ECharts que usen las gráficas nuevas).
  - `tests/graficas/por-categoria.test.ts`: construye un `Metricas` completo y hay que darle los campos nuevos.
  - `eslint.config.mjs` y `tests/arquitectura/capas.test.ts` (solo `import type` de `echarts` en `src/graficas/`).
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `filtrar(tx, filtro)` con la firma escrita. Añadidos declarados en `design.md`: `metricas(tx, periodo?)`, las funciones de opciones y de periodo del filtro, y un argumento con los rótulos visibles en las funciones de `graficas` que los necesitan.
- **Dependencias:** ninguna nueva. TanStack Table 9.3.1 ya está instalado (`package.json`) y funciona con React 18.3.1 (comprobado el 2026-10-16).
- **No se toca:** `src/servidor/`, `generador/`, `tests/fixtures/`, `docs/`, `.claude/`, `openspec/specs/`, `playwright.config.ts`, `package.json`.
- Una sola ola (`fase-2`) de 5 PRs internas.
