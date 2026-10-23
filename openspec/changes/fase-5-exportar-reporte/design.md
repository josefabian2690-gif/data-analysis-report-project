# Design

## Context

Ver `proposal.md` (*Why*). Estado verificado en `master` @ `fa71e7a`:

- `src/reporte/` y `tests/reporte/` no existen. La capa ya está en la tabla de capas del lint (`eslint.config.mjs:11`, puede importar `dominio` y `graficas`) y entre las capas puras (`eslint.config.mjs:15`): sin `window`, `document`, `fetch`, reloj ni `import.meta`. La regla «solo tipos de echarts» aplica a `graficas`, no a `reporte` (`tests/arquitectura/capas.test.ts:345-355`), pero `docs/ARQUITECTURA.md` no le da `echarts` a `reporte`.
- `docs/ARQUITECTURA.md` fija `reporte.generarHtml(m: Metricas, h: Hallazgo[], figuras: EChartsOption[]): string` y describe la capa con «ECharts y datos en línea». Dos hechos del código lo hacen inviable tal cual:
  - los textos visibles viven solo en `src/cliente/textos.ts` (convención de `CLAUDE.md`), y `reporte` no puede importar `cliente`. La redacción de los hallazgos es `descripcion()` de `src/cliente/PanelDeHallazgos.tsx:17-57`, privada; los rótulos de KPIs, gráficas y mapa están en `textos.ts:123-130` y `:207-263`;
  - las opciones de ECharts llevan funciones: `src/graficas/columnas.ts:60` formatea el eje de montos con `formatearMonto`. Serializarlas a JSON para un ECharts embebido pierde el formato R-17 de los ejes.
- El cliente ya arma cada opción con su descripción accesible: `src/cliente/opciones-de-graficas.ts:27-91` (día, día de la semana, hora, zona, cuenta, comparación, mapa) y `opcionDeCategorias`, privada en `src/cliente/GastoPorCategoria.tsx:11-20`.
- `src/cliente/echarts.ts` registra `BarChart`, `ScatterChart`, `Grid`, `Aria`, `Legend`, `DataZoomInside`, `Tooltip` y `SVGRenderer`, y monta con `init(contenedor, undefined, { renderer: 'svg' })`.
- `Tablero` (`src/cliente/Tablero.tsx:26-30`) tiene `filtro`, `filtradas`, `periodo` y `metricas`; los hallazgos se calculan dentro de `PanelDeHallazgos` (`:73-76`) con `ajuste.umbrales`. Con 0 filas, todo bajo el mensaje se oculta (`Tablero.tsx:44-58`).
- `App` recibe `historial` y `almacen?` (`src/cliente/App.tsx:43`) y `main.tsx:16-29` le pasa los del navegador: el modelo de la cáscara de descarga.
- La vigilancia de red de la suite (`tests/sistema/sin-red.ts:4,10-13`) acepta `data:` y `blob:` y escucha `request` en todo el contexto. Una URL `file://` cuenta como salida (su anfitrión no es 127.0.0.1).
- Cifras de la semilla 1 que las pruebas escriben literales (de las specs principales y del change archivado de la fase 4): 2 000 transacciones, gasto total `$1,689,470.67`, Compras `$814,566.30` con 48.2 %, zona favorita Centro Histórico, CDMX, viaje a Monterrey, N.L. del 24/07/2026 al 26/07/2026.

## Goals / Non-Goals

**Goals:**
- Un reporte estático que se ve igual en cualquier navegador, sin red ni JavaScript, y que imprime bien.
- La capa `reporte` pura y probada sin DOM; el cliente reutiliza lo que ya arma para la página.

**Non-Goals:**
- Gráficas interactivas en el reporte.
- Paridad pixel a pixel con la página: el reporte tiene su propia hoja de estilos.
- Tocar `src/cliente/Grafica.tsx` por rendimiento (`docs/olas/fase-2.md`, *Deuda*).

## Decisions

**D1. HTML estático con las gráficas como SVG ya dibujado.** El cliente dibuja cada opción con ECharts en modo de render en servidor (`init(null, null, { renderer: 'svg', ssr: true, width, height })`, `setOption` con la animación apagada, `renderToSVGString()`, `dispose()`), sin montar nada en la página. El reporte no lleva JavaScript. *Alternativas descartadas:* (a) embeber el runtime de ECharts (~1 MB) y las opciones en JSON: pierde los formateadores con función (`src/graficas/columnas.ts:60`), pesa, y la impresión depende de que el script haya dibujado; (b) imágenes PNG desde un canvas: canvas falla en jsdom (`src/cliente/echarts.ts:23`) y se imprime borroso. El mecanismo exacto de ECharts 6.1.0 se verifica en el instalado en el grupo 2; lo que se fija es el objetivo: SVG sin DOM y sin animación.

**D2. Contrato `generarHtml(contenido: ContenidoDelReporte): string`.** El contenido es un dato llano ya redactado: título, encabezado (mes, periodo, filtros como líneas de texto), KPIs como pares rótulo-valor, hallazgos como frases (o el mensaje de ninguno), la tabla de categorías (filas con nombre, monto, porcentaje y cuál es la dominante) y las secciones de gráfica (título, descripción accesible y SVG, o un mensaje en lugar de la gráfica). El tipo vive en `src/reporte/`; el cliente lo arma. `reporte` no redacta ni formatea: compone, escapa y da estilo. *Alternativas descartadas:* (a) mantener `generarHtml(m, h, figuras)` con un catálogo de textos en `src/reporte/`: dos catálogos de textos visibles, contra la convención; (b) pasar `textos` como argumento: acopla la capa pura a la forma del catálogo del cliente. El cambio de contrato va a `docs/ARQUITECTURA.md` en la PR de documentos para el usuario.

**D3. Cada SVG va como imagen `data:`.** `<img src="data:image/svg+xml;charset=utf-8,…" alt="<descripción accesible>">`, con el SVG codificado con `encodeURIComponent`. Así un SVG nunca se interpreta como marcado del documento (un SVG como imagen no ejecuta scripts ni carga recursos), el texto alternativo es la descripción que ya tiene la página, y el HTML no contiene el `xmlns="http://www.w3.org/2000/svg"` en claro, que haría saltar la comprobación de URLs externas sin serlo.

**D4. Sin red por construcción y por prueba.** El `<head>` lleva `<meta charset="utf-8">`, `lang="es-MX"` y `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">`. La hoja de estilos va en un `<style>` y usa solo fuentes del sistema. El test de `tests/reporte/` rechaza `src=`, `href=`, `url(` y `@import` hacia `http(s)://` en el HTML y comprueba la CSP; la prueba se dirige a lo que carga recursos, no a cualquier aparición de `http` en el texto.

**D5. Escape de todo texto.** `reporte` escapa `& < > " '` en todo texto y atributo que compone, incluidas las frases de los hallazgos y la descripción accesible. Es la única defensa: los nombres de categoría, zona y cuenta vienen del CSV.

**D6. El contenido se arma al pulsar el botón, no en cada render.** Una función pura del cliente recibe `{ resultado, filtro, filtradas, periodo, metricas, umbrales }` y devuelve el `ContenidoDelReporte`: calcula los hallazgos con `hallazgos(filtradas, umbrales, periodo)`, los redacta con la misma función que el panel, y dibuja las siete gráficas. Así `PanelDeHallazgos` no cambia su interfaz (`tests/cliente/hallazgos.test.tsx` lo monta con sus props) y no hay coste por render.
- `descripcion()` sale de `PanelDeHallazgos.tsx` a un módulo propio de `src/cliente/` que importan el panel y el reporte.
- `opcionDeCategorias` sale de `GastoPorCategoria.tsx` a `opciones-de-graficas.ts`.
- Los textos nuevos (botón, encabezado, filtros, «sin filtros») van en `textos.ts`.

**D7. Tamaño de las gráficas del reporte.** Ancho fijo de 720 px (cabe en A4 vertical con márgenes por defecto) y alto 320 px; el mapa y la gráfica por día, 720 × 420. En pantalla, `max-width: 100%`.

**D8. Estilos de impresión.** `@media print`: fondo blanco, texto oscuro, `break-inside: avoid` en cada sección de gráfica, en la tarjeta de KPIs y en cada hallazgo; el reporte no tiene botones ni controles que ocultar.

**D9. Descarga como cáscara inyectada.** `descargar(nombre: string, html: string)` en un módulo de `src/cliente/`: `Blob` `text/html;charset=utf-8`, `URL.createObjectURL`, un `<a download>` pulsado y `revokeObjectURL`. `App` la recibe como prop opcional y la pasa a `Tablero`; sin ella el botón no se muestra, de modo que los tests existentes que montan `<App historial=… />` no cambian. `main.tsx` le pasa la del navegador. Los tests de componente pasan una descarga falsa que guarda nombre y HTML (es la frontera de I/O, como `historial-falso.ts` y `almacen-falso.ts`). Nombre del archivo: `reporte-${resultado.mes}.html`.

**D10. Posición del botón.** Dentro del bloque que se oculta con 0 filas, antes de los KPIs (`Tablero.tsx:46`). No es un `h2`, así que el orden de `tests/cliente/graficas-del-mes.test.tsx` no cambia.

**D11. Suite de sistema.** Spec nueva `tests/sistema/reporte.spec.ts` que importa `test` de `./sin-red`: carga la semilla 1, espera el evento `download` al pulsar el botón, lee el archivo descargado, abre una página nueva del mismo contexto con `context.setOffline(true)` y le pone el HTML con `page.setContent` (no con `file://`, que la vigilancia contaría como salida), comprueba KPIs y la `categoriaDominante` del esperado por sus textos, que las siete imágenes de gráfica cargaron (`naturalWidth > 0`), y que `page.pdf()` devuelve bytes que empiezan por `%PDF`. La vigilancia de `sin-red.ts` cubre la página nueva porque escucha en el contexto.

## Risks / Trade-offs

- [El modo SSR de ECharts 6.1.0 no está verificado: sin `node_modules` en la máquina del pre-vuelo no se abrió] → el grupo 2 lo comprueba en el instalado antes de escribir el test (firma de `init` con `ssr`, `renderToSVGString`, que corre en jsdom y en Node), y escala si no existe: no se sustituye por un mock.
- [El encuadre inicial del mapa (dataZoom) o las marcas `decal` de la quincena y el fin de semana pueden no salir en el SVG estático] → tarea 2.2 lo prueba sobre el SVG real (el mapa no dibuja los puntos del destino con la semilla 1; la gráfica por día contiene un patrón); si ECharts no lo dibuja, se escala al Team Manager con captura.
- [Un SVG por gráfica en `data:` puede pesar varios cientos de KB con 20 000 filas en el mapa] → aceptado: un solo usuario, archivo local. El grupo 2 anota el tamaño del reporte de la semilla 1 en su PR.
- [La comprobación de URLs externas puede dar falso verde si se limita a `http` en claro] → D3 y D4: la prueba de `tests/reporte/` cubre `src`, `href`, `url(` y `@import`, y la de sistema abre el archivo sin conexión con la vigilancia de red.
- [El escape olvidado en un solo campo abre inyección de marcado desde un CSV] → tarea 1.2: un test por cada tipo de texto del contenido (encabezado, filtros, rótulos, frases, filas de la tabla, título y descripción de gráfica) con `<script>`.
- [La descarga real no se puede probar en jsdom (`URL.createObjectURL` no existe)] → la cáscara es delgada y la protege la spec de sistema (D11); la mutación «`main.tsx` no pasa la descarga» la deja en rojo.

## Migration Plan

No aplica: no hay datos ni contratos de red que migren. El cambio de contrato de `reporte` no tiene llamadores hoy (la capa está vacía).
