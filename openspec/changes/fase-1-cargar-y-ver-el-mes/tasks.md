# Tasks

Una sola ola (`fase-1`), 5 PRs internas, una por grupo. Grafo:

- 1 → 2 → 4 → 5
- 3 es independiente de 1, 2 y 4 (toca `src/servidor/`, `tests/servidor/`, la raíz y la configuración de la suite de sistema; no importa el dominio) y va antes del 5.

Reglas de la fase:
- Nada de filtros, historial ni API, ni de otras gráficas que la de categoría (`docs/PLAN.md`, fase 1).
- Ninguna dependencia nueva (`design.md` D1).
- `generador/` y `tests/fixtures/generador/` no cambian.

## 1. Dominio: esquema y carga del CSV

Área: `src/dominio/`, `tests/dominio/`, `tests/fixtures/a-mano/`, `.gitattributes`. Spec `carga-de-csv`; `design.md` D4, D5, D6 y D12. Cada test nombra su regla (`R-0x`).

- [x] 1.1 Fixtures hechos a mano en `tests/fixtures/a-mano/` (con BOM y `\r\n`, sin columnas opcionales, con filas inválidas, con filas de otro mes, con comas entre comillas) y `-text` para ellos en `.gitattributes`; verificar con `git check-attr text` que quedan sin normalizar y que el test de integridad de `tests/fixtures/` sigue en verde
- [x] 1.2 Tests primero de R-01 y R-02 por `parsearCsv`; luego `src/dominio/esquema.ts` (D5) y la carga del encabezado, los valores por defecto y los ids generados; verificar que cada test falla sin su regla y pasa con ella
- [x] 1.3 Tests primero de R-03, R-04 y R-05 (número de fila con el encabezado como fila 1, motivo como código cerrado, `pideConfirmacion` con 6 % y con 5 % exacto); luego su implementación; verificar la mutación de cada umbral y de cada formato
- [x] 1.4 Tests primero de R-06 (primera aparición válida), R-07 (fuera de rango, ilegible, solo una coordenada) y R-08 (mayoría, empate al más antiguo, «fuera del mes»); luego su implementación; verificar con una mutación por regla
- [x] 1.5 Tests primero de los casos borde de carga de `docs/DOMINIO.md` (vacío, solo encabezado, sin filas válidas → `CargaRechazada` con su motivo; BOM y acentos; comas entre comillas; monto con más de dos decimales sin redondear) y de `tests/fixtures/generador/2026-07-semilla-1.csv` (2 000 transacciones de `2026-07`, 0 inválidas); verificar que pasan y que `npm run lint` no marca I/O en `src/dominio/`

## 2. Dominio y gráficas: métricas, formato y gasto por categoría

Depende del grupo 1 (usa `Transaccion`). Área: `src/dominio/`, `tests/dominio/`, `src/graficas/`, `tests/graficas/`. Specs `metricas-del-mes` y `presentacion-es-mx`; `design.md` D7, D8 y D9.

- [x] 2.1 Tests primero de R-11 (los cinco KPIs, mediana par e impar, promedio por día natural del mes con julio y con febrero bisiesto, lista vacía sin `NaN` ni infinitos); luego `metricas`; verificar con mutaciones del divisor de días y de la mediana
- [x] 2.2 Tests primero de R-12 (proporción sobre el monto y no sobre el conteo, orden por monto y por nombre con empate, Compras primero en `2026-07-semilla-1` según su `*.esperado.json`); luego el gasto por categoría en `Metricas`; verificar que contar en lugar de sumar hace fallar el test
- [x] 2.3 Tests primero de R-17 (`$12,345.67`, `$900.00`, `$10.13`, `15/09/2026`, `01/07/2026`, `48.2%`); luego los formateadores del dominio sin `Date`; verificar que pasan con otra zona horaria en el entorno del test
- [x] 2.4 Tests primero en `tests/graficas/` de `porCategoria` (una barra por categoría en el orden de `Metricas`, la primera con el color de énfasis, etiquetas con R-17, `aria` activado); luego `src/graficas/`; verificar que `npm run lint` no marca imports fuera de `dominio` ni I/O

## 3. Servidor y `npm start`

Independiente de los grupos 1, 2 y 4. Área: `src/servidor/`, `tests/servidor/`, `package.json` (solo scripts), `.gitignore`, `.prettierignore`, `eslint.config.mjs`, `playwright.config.ts`, `tests/arquitectura/sistema.test.ts`; `vite.config.mts` solo si la construcción del servidor lo exige. Spec `arranque-local` y el requisito añadido de `sin-red`; `design.md` D1, D2, D3 y D11.

- [x] 3.1 Tests primero en `tests/servidor/` del servidor de estáticos contra una carpeta temporal: escucha exactamente en `127.0.0.1`, `/` da la página, un `.js` su tipo, `..` y `%2e%2e` dan 404 sin leer fuera, un método distinto de `GET`/`HEAD` da 405; luego el servidor con `node:http`; verificar que el test de dirección falla con `0.0.0.0` y con `localhost`
- [x] 3.2 Tests primero de la decisión de bundle viejo (sin bundle, al día, una fuente más reciente, misma fecha) y del arranque (puerto por `TABLERO_PUERTO`, puerto ocupado con mensaje que nombra puerto y variable, con `TABLERO_SIN_NAVEGADOR=1` no se llama a quien abre el navegador); luego el arranque; verificar con una mutación por caso
- [x] 3.3 Construcción del servidor con Vite a un `.mjs` en su propia carpeta y el script `start` (D1, D2), sin `npx`; esa carpeta en `.gitignore`, `.prettierignore` y los `ignores` de ESLint; verificar en el worktree, con checks ligeros, que `typecheck`, `lint` y `format:check` siguen en verde (el PM corre `npm start` y la suite de sistema)
- [x] 3.4 `playwright.config.ts`: `webServer` con `npm start`, `TABLERO_SIN_NAVEGADOR=1` y `TABLERO_PUERTO=4173`; verificar (PM, `.claude/da/da sistema`) que `tests/sistema/pagina-vacia.spec.ts` pasa contra el arranque real y que el servidor se baja al terminar
- [x] 3.5 Tests primero en `tests/arquitectura/sistema.test.ts`: el import por defecto de `@playwright/test`, `import * as` de `@playwright/test` y `import { test } from 'playwright/test'` dan error; `import type` de `@playwright/test` no; luego la regla en `eslint.config.mjs`; verificar que cada caso nuevo falla con la regla anterior

## 4. Cliente: cargar y ver el mes

Depende de los grupos 1 y 2. Área: `src/cliente/`, `tests/cliente/`. Spec `tablero-del-mes`, salvo el requisito de la suite de sistema; `design.md` D10. Los textos visibles van todos en `src/cliente/textos.ts`.

- [x] 4.1 Tests de componente primero: el estado inicial muestra el título y el control para elegir un CSV; un CSV sin `monto` muestra el rechazo que nombra `monto` y no muestra KPIs; luego la carga con `File.text()` y `parsearCsv`; verificar que los tests encuentran todo por rol y nombre accesible del catálogo
- [x] 4.2 Tests primero del resumen de validación (mes, válidas, inválidas, lista con fila y motivo en es-MX para cada código de D4) y de la confirmación de R-05 (confirmar muestra el tablero, cancelar vuelve al inicio); luego los componentes; verificar que quitar la confirmación hace fallar su test
- [x] 4.3 Tests primero de los KPIs con R-17 (nombre accesible de cada KPI y su valor formateado); luego el componente; verificar con un CSV pequeño de valores conocidos
- [x] 4.4 Tests primero de la lista por categoría (orden, monto, porcentaje, la primera con la marca de dominante) y de que la gráfica se monta con el renderizador SVG; luego los componentes con `porCategoria`; verificar que invertir el orden hace fallar el test y dejar captura del tablero con el fixture `2026-07-semilla-1`

## 5. Suite de sistema: el flujo principal

Depende de los grupos 3 y 4. Área: `tests/sistema/`. Requisito «Flujo principal en la suite de sistema» de la spec `tablero-del-mes`; `design.md` D11.

- [ ] 5.1 Spec de sistema que importa `test` de `./sin-red`, carga `2026-07-semilla-1.csv` con tres filas inválidas añadidas en memoria y comprueba las tres filas con su motivo, 2 000 transacciones, `$1,689,470.67` y la `categoriaDominante` del esperado como primera categoría, con cifras literales y nunca llamando al dominio; verificar (PM, `.claude/da/da sistema`) que pasa, y que falla con cada mutación: el cliente no lista las inválidas, otra categoría primero, un `<link>` a una fuente externa en `index.html` (mutaciones que no se commitean)
