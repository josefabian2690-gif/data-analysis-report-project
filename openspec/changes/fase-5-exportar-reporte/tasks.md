# Tasks

Una sola ola (`fase-5`), 3 PRs internas, una por grupo, en serie: 1 → 2 → 3.

- El 2 espera al 1: arma el `ContenidoDelReporte` que define el 1.
- El 3 espera al 2: el botón exporta el contenido que arma el 2, y los dos tocan `textos.ts`.
- Sin paralelo declarado.

Reglas de la fase:
- Nada de tabla de transacciones, filas inválidas ni comparación en el reporte; nada de gráficas interactivas, PDF generado por la app ni reportes guardados en disco (`proposal.md`).
- El reporte no lleva JavaScript ni referencia ningún recurso fuera de sí mismo (`design.md` D1, D3, D4).
- `src/reporte/` no redacta ni formatea: los textos visibles solo en `src/cliente/textos.ts` (`design.md` D2).
- Ninguna dependencia nueva.
- Las cifras de las pruebas con fixtures son literales, las de `design.md` *Context*.
- No se tocan `generador/`, `tests/fixtures/`, `src/dominio/`, `src/graficas/`, `src/servidor/`, `package.json`, `vite.config.mts`, `eslint.config.mjs`, `playwright.config.ts` ni `tests/sistema/sin-red.ts`.

## 1. Reporte: el HTML autocontenido a partir de su contenido

Área: `src/reporte/`, `tests/reporte/`. Spec `reporte-exportado` («El reporte trae el tablero del mes» en su orden, «Autocontenido y sin red», «Los datos se muestran como texto», «Imprimible a PDF» en sus estilos); `design.md` D2 a D5, D7 y D8.

- [x] 1.1 Tests primero de `generarHtml(contenido)` por su interfaz, con un `ContenidoDelReporte` hecho a mano y SVG pequeños escritos en el test: el documento declara `lang="es-MX"`, `utf-8` y el título; las secciones salen en el orden de la spec, con cada KPI como rótulo y valor, cada hallazgo como elemento de lista o el mensaje de ninguno, la tabla de categorías con la dominante marcada, y cada gráfica como imagen `data:image/svg+xml` con su descripción como texto alternativo que, decodificada, es el SVG recibido; una sección con mensaje en lugar de gráfica muestra el mensaje y no tiene imagen; luego el tipo `ContenidoDelReporte` y `generarHtml` en `src/reporte/`; verificar con mutaciones: omitir una sección, perder el texto alternativo, insertar el SVG sin codificar
- [x] 1.2 Tests primero de la seguridad del documento: un texto con `<script>alert(1)</script>` en cada lugar del contenido (encabezado, filtro, rótulo y valor de KPI, hallazgo, fila de categoría, título y descripción de gráfica, mensaje) aparece escapado y el HTML no contiene ningún elemento `script`; la CSP de `design.md` D4 está en el `<head>`; ningún `src=`, `href=`, `url(` ni `@import` apunta a `http://` o `https://`, y un test con un SVG que trae `xmlns="http://www.w3.org/2000/svg"` sigue pasando; la hoja de estilos tiene reglas `@media print` con `break-inside: avoid` para las secciones de gráfica, los KPIs y los hallazgos; luego el escape, la CSP y los estilos; verificar con mutaciones: no escapar un campo, quitar la CSP, cargar la hoja de estilos desde una URL, y que `npm run lint` no marca I/O en `src/reporte/`

## 2. Cliente: armar el contenido del reporte y dibujar las gráficas en SVG

Depende del grupo 1. Área: `src/cliente/` (sin `Tablero.tsx`, `App.tsx` ni `main.tsx`), `tests/cliente/`. Spec `reporte-exportado` («El reporte trae el tablero del mes», «El reporte sigue al filtro», «Hallazgos con los umbrales vigentes»); `design.md` D1, D6 y D7. Textos visibles solo en `src/cliente/textos.ts`.

- [x] 2.1 Sin cambio de comportamiento: `descripcion()` de `src/cliente/PanelDeHallazgos.tsx` pasa a un módulo propio de `src/cliente/` y `opcionDeCategorias` de `src/cliente/GastoPorCategoria.tsx` a `src/cliente/opciones-de-graficas.ts`; verificar que `tests/cliente/hallazgos.test.tsx`, `categorias.test.tsx` y `graficas-del-mes.test.tsx` siguen en verde sin cambios
- [x] 2.2 Comprobar en ECharts 6.1.0 instalado el modo SSR de `design.md` D1 y anotarlo en el reporte del grupo; tests primero de la función de `src/cliente/echarts.ts` que dibuja una opción como SVG sin DOM: con la opción por día de la semilla 1 devuelve un SVG de 720 de ancho que contiene los rótulos de los días y un patrón de la marca de quincena; con la opción del mapa de la semilla 1, el SVG nombra `Centro Histórico, CDMX` en la leyenda y no dibuja puntos fuera del encuadre de la ciudad principal; no deja nada montado en el documento; luego la función; verificar con mutaciones: animación encendida (el SVG sale sin barras), olvidar `dispose`
- [x] 2.3 Tests primero de la función pura que arma el `ContenidoDelReporte` desde `{ resultado, filtro, filtradas, periodo, metricas, umbrales }`, nombrando `R-10`, `R-11`, `R-16` y `R-17`: con la semilla 1 sin filtros, julio de 2026, «sin filtros», 2 000 transacciones, `$1,689,470.67`, Compras primero y dominante con 48.2 %, los hallazgos con el mismo texto que el panel, y siete secciones de gráfica con SVG y su descripción; solo Compras: el filtro nombrado, `$814,566.30`, Compras al 100 % y sin zona favorita; umbral de dominante en 0.5: sin ese hallazgo y con los demás; `tests/fixtures/a-mano/minimo.csv`: el mapa con el mensaje de sin coordenadas; un filtro de fechas y de monto se nombran con R-17; luego la función y sus textos en `textos.ts`; verificar con mutaciones: hallazgos sobre el mes sin filtrar, umbrales por defecto en lugar de los vigentes, y anotar en el reporte del grupo el tamaño del HTML de la semilla 1

## 3. Cliente: botón, descarga y recorrido de sistema

Depende del grupo 2. Área: `src/cliente/Tablero.tsx`, `App.tsx`, `main.tsx`, el módulo nuevo de la descarga, `textos.ts`, `estilos.css`, `tests/cliente/`, `tests/sistema/reporte.spec.ts`. Spec `reporte-exportado` («Botón de exportar», «Reporte en la suite de sistema», «Imprimible a PDF»); `design.md` D9 a D11.

- [ ] 3.1 Tests de componente primero con una descarga falsa pasada a `App`: con la semilla 1, el botón «Exportar reporte» aparece antes de los KPIs, y al pulsarlo la descarga recibe `reporte-2026-07.html` y un HTML con `$1,689,470.67`; tras filtrar solo Compras el HTML trae `$814,566.30`; con el umbral de dominante en 50 el HTML no tiene ese hallazgo; con un filtro que deja 0 filas no hay botón; sin la prop de descarga no hay botón y los tests existentes de `tests/cliente/` no cambian; luego el botón, la prop opcional en `App` y `Tablero`, la cáscara de descarga del navegador (`design.md` D9) y `main.tsx`; verificar con mutaciones: exportar el mes sin filtrar, nombre del archivo sin el mes, y dejar captura del botón en el tablero y del reporte abierto en el navegador
- [ ] 3.2 Spec de sistema nueva `tests/sistema/reporte.spec.ts`, que importa `test` de `./sin-red` (`design.md` D11): carga la semilla 1, exporta, abre el HTML descargado sin conexión con `setContent`, comprueba 2 000 transacciones, `$1,689,470.67`, la `categoriaDominante` del esperado en los hallazgos y que las siete gráficas cargaron, y que `page.pdf()` da un PDF; verificar (PM, `.claude/da/da sistema`) que pasa con las otras specs y que falla con la mutación «`main.tsx` no pasa la descarga» y con la mutación «la CSP permite `https:` y la hoja de estilos importa una fuente remota» (no se commitean), y dejar captura del PDF impreso

## Workflow follow-up

- Archivar tras el merge de la ola a `master`: crea la spec principal `reporte-exportado`; no hay deltas MODIFIED.
