# Proposal

## Why

Tras la fase 4 el tablero muestra KPIs, gráficas, mapa, hallazgos, historial y comparación, pero solo dentro de la página local: el analista no puede guardar ni compartir lo que ve. La fase 5 de `docs/PLAN.md` («Exportar reporte») añade un botón que genera un HTML autocontenido, sin URLs externas, que se abre sin conexión y se imprime a PDF desde el navegador; es el «reporte presentable» del éxito a tres meses.

## What Changes

- **Formato de exportación** (la decisión cerrada de la fase en `docs/PLAN.md`): un solo archivo `.html` **estático**, con las gráficas ya dibujadas como SVG dentro de la página, **sin JavaScript** y con una política de seguridad de contenido que impide al navegador pedir cualquier recurso. Se abre sin conexión y se imprime a PDF con el diálogo de impresión del navegador; no hay generación de PDF propia (`docs/STACK.md`, *Descartado*).
- **Contenido del reporte:** el tablero del mes **tal como está filtrado** al pulsar el botón (R-10):
  - encabezado con el mes, el periodo y los filtros aplicados (o «sin filtros»);
  - los cinco KPIs de R-11;
  - los hallazgos de R-16 con los umbrales vigentes en la página, o el mensaje de que ninguno supera su umbral;
  - el gasto por categoría (lista y gráfica, con la dominante destacada);
  - las gráficas por día, día de la semana, hora, zona y cuenta;
  - el mapa con el mismo encuadre inicial que en la página, o el mensaje de «sin coordenadas».
  - Montos y fechas en R-17; textos en es-MX, del catálogo `src/cliente/textos.ts`.
- **Capa `reporte` (pura):** genera el HTML como string a partir de un contenido ya redactado (textos es-MX y SVG de cada gráfica) que arma el cliente: la capa no importa `cliente` y los textos visibles viven solo en el catálogo del cliente. Escapa todo texto que viene de los datos (categorías, zonas, cuentas). Trae estilos propios para pantalla e impresión.
- **Cliente:**
  - Arma el contenido del reporte con lo que ya calcula el tablero (métricas, hallazgos con los umbrales vigentes, periodo y filtro) y dibuja cada gráfica como SVG con ECharts, sin montarla en la página.
  - Un botón «Exportar reporte» en el tablero, visible cuando el filtro deja filas, descarga `reporte-AAAA-MM.html`. La descarga es una cáscara delgada de I/O que `App` recibe como prop opcional y `main.tsx` le pasa, como el historial y el almacén de umbrales.
- **Suite de sistema:** una spec nueva carga la semilla 1, exporta, abre el archivo descargado en un contexto sin conexión, comprueba KPIs, hallazgos y gráficas, comprueba que ninguna petición sale, y lo imprime a PDF.
- **Lo que cambia de las fases anteriores (declarado):**
  - El contrato `reporte.generarHtml(m, h, figuras)` de `docs/ARQUITECTURA.md` cambia a `generarHtml(contenido)`: los textos visibles no pueden venir de la capa `reporte` y las opciones de ECharts no se pueden serializar (`src/graficas/columnas.ts:60` usa una función para el eje). Va en la PR de documentos para el usuario, junto con la decisión de formato en `docs/PLAN.md`.
  - `src/cliente/PanelDeHallazgos.tsx` y `src/cliente/GastoPorCategoria.tsx` ceden la redacción de los hallazgos y la opción de la gráfica de categorías a módulos que también usa el reporte, sin cambio de comportamiento.
- **Fuera de alcance** (`docs/PLAN.md`, fase 5 y *Fuera de alcance*): importar bancos, edición, presupuestos. Tampoco entran: la tabla de transacciones, la lista de filas inválidas y la comparación de meses en el reporte; gráficas interactivas en el reporte (tooltip, zoom); generar el PDF desde la app; exportar un mes del historial sin cargarlo; guardar los reportes en el servidor o en `output/`.

## Interpretación del entregable

- «Un botón genera un HTML autocontenido»: con `tests/fixtures/generador/2026-07-semilla-1.csv` cargado, «Exportar reporte» descarga `reporte-2026-07.html`, un solo archivo que muestra los KPIs (2 000 transacciones, `$1,689,470.67`), los hallazgos (Compras con 48.2 %, Centro Histórico, CDMX, viaje a Monterrey, N.L.), el gasto por categoría con Compras destacada, las cinco gráficas del periodo y el mapa.
- «Sin URLs externas, que se abre sin conexión»: el archivo no referencia ningún recurso fuera de sí mismo y, abierto sin red, se ve completo sin hacer ninguna petición.
- «Se imprime a PDF»: imprimirlo desde el navegador da un PDF con todas las secciones, sin gráficas partidas por un salto de página.
- Con un filtro activo (solo Compras), el reporte dice el filtro y sus cifras son las del tablero filtrado.

## Capabilities

### New Capabilities
- `reporte-exportado`: el botón de exportar, el contenido del reporte, su formato autocontenido y sin red, la impresión a PDF y su recorrido en la suite de sistema.

### Modified Capabilities
- Ninguna. El botón se añade al tablero sin cambiar sus requisitos; el cambio de contrato de `docs/ARQUITECTURA.md` no cambia ninguna spec principal.

## Impact

- **Nuevos:**
  - `src/reporte/`: el generador del HTML y el tipo de su contenido; sus tests en `tests/reporte/`.
  - `src/cliente/`: el armado del contenido del reporte, la redacción compartida de los hallazgos, la cáscara de la descarga; sus tests en `tests/cliente/`.
  - `tests/sistema/`: una spec nueva del reporte.
- **Modificados:**
  - `src/cliente/echarts.ts` (dibujar una opción como SVG sin montarla), `opciones-de-graficas.ts` (recibe la opción de categorías), `GastoPorCategoria.tsx`, `PanelDeHallazgos.tsx`, `Tablero.tsx` (el botón), `App.tsx` (la prop opcional de descarga), `main.tsx` (le pasa la descarga del navegador), `textos.ts`, `estilos.css`.
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `generarHtml(contenido)` sustituye a `generarHtml(m, h, figuras)` (PR de documentos para el usuario). `metricas`, `hallazgos`, `filtrar` y la API del historial no cambian.
- **Dependencias:** ninguna nueva (ECharts ya está; su modo de dibujo a SVG sin DOM viene en él).
- **No se toca:** `generador/`, `tests/fixtures/`, `src/dominio/`, `src/graficas/`, `src/servidor/`, `docs/`, `.claude/`, `openspec/specs/`, `package.json`, `vite.config.mts`, `eslint.config.mjs`, `playwright.config.ts`, `tests/sistema/sin-red.ts`.
- Una sola ola (`fase-5`) de 3 PRs internas.
