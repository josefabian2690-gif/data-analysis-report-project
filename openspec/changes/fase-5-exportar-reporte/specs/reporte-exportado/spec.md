# Spec Delta

## Purpose

Permite al analista llevarse el tablero del mes, tal como lo tiene filtrado, en un único archivo HTML autocontenido que se abre sin conexión y se imprime a PDF desde el navegador.

## ADDED Requirements

### Requirement: Botón de exportar
El tablero SHALL ofrecer un botón con nombre accesible «Exportar reporte» mientras el filtro deja al menos una fila. Al pulsarlo, el navegador SHALL descargar un único archivo llamado `reporte-AAAA-MM.html`, con el mes cargado. Con un filtro que deja 0 filas, el botón SHALL ocultarse junto con el resto del tablero.

#### Scenario: Exportar el mes cargado
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv` y pulsa «Exportar reporte»
- **THEN** se descarga un único archivo `reporte-2026-07.html`

#### Scenario: Filtro sin filas
- **WHEN** el filtro deja 0 filas
- **THEN** no hay botón «Exportar reporte»

### Requirement: El reporte trae el tablero del mes
El reporte SHALL contener, en este orden: el encabezado con el mes, el periodo y los filtros aplicados; los cinco KPIs de R-11; los hallazgos de R-16; el gasto por categoría como lista ordenada con la dominante destacada y como gráfica; las gráficas por día, día de la semana, hora, zona y cuenta; y el mapa. Montos y fechas SHALL seguir R-17 y los textos SHALL estar en español de México.

#### Scenario: Reporte de la semilla 1 sin filtros
- **WHEN** el analista exporta con la semilla 1 cargada y sin filtros
- **THEN** el reporte dice julio de 2026 y que no hay filtros, muestra 2 000 transacciones y un gasto total de `$1,689,470.67`, pone primero Compras destacada con 48.2 %, y tiene una gráfica por cada una de las siete secciones con gráfica

#### Scenario: Mes sin coordenadas
- **WHEN** el analista exporta con `tests/fixtures/a-mano/minimo.csv` cargado
- **THEN** la sección del mapa del reporte muestra el mensaje de «sin coordenadas» y las demás secciones están completas

### Requirement: El reporte sigue al filtro
El reporte SHALL calcularse sobre el conjunto filtrado y su periodo en el momento de exportar (R-10), igual que el tablero, y SHALL nombrar cada filtro activo.

#### Scenario: Solo Compras
- **WHEN** el analista filtra solo Compras con la semilla 1 y exporta
- **THEN** el reporte nombra el filtro de categoría Compras, su gasto total es `$814,566.30`, su categoría dominante es Compras con 100 % y no tiene hallazgo de zona favorita

### Requirement: Hallazgos con los umbrales vigentes
Los hallazgos del reporte SHALL ser los del panel de la página en el momento de exportar, con los umbrales vigentes y con el mismo texto y evidencia.

#### Scenario: Umbral ajustado
- **WHEN** el analista pone el umbral de categoría dominante en 50 con la semilla 1 y exporta
- **THEN** el reporte no tiene el hallazgo de categoría dominante y sí los demás hallazgos del panel

#### Scenario: Ningún hallazgo
- **WHEN** ningún hallazgo supera su umbral al exportar
- **THEN** el reporte muestra el mismo mensaje que el panel de la página

### Requirement: Autocontenido y sin red
El reporte SHALL ser un único archivo sin referencias a recursos fuera de sí mismo: ni scripts, hojas de estilo, fuentes ni imágenes externas. SHALL declarar una política de seguridad de contenido que impida al navegador pedir cualquier recurso de red, y SHALL verse completo abierto sin conexión.

#### Scenario: Abierto sin conexión
- **WHEN** el archivo exportado se abre en un navegador sin conexión
- **THEN** se ven todas sus secciones y gráficas y el navegador no hace ninguna petición

#### Scenario: Una referencia externa
- **WHEN** el HTML generado contiene un `src`, un `href`, un `url(` o un `@import` que apunta a `http://` o `https://`
- **THEN** el test del reporte falla

### Requirement: Los datos se muestran como texto
Todo texto que viene del CSV (categorías, zonas, cuentas) SHALL aparecer en el reporte como texto, nunca interpretado como marcado.

#### Scenario: Una categoría con marcado
- **WHEN** una categoría se llama `<script>alert(1)</script>`
- **THEN** el reporte la muestra tal cual como texto y no contiene ese elemento `script`

### Requirement: Imprimible a PDF
El reporte SHALL tener estilos de impresión: fondo claro, ninguna gráfica ni KPI partido entre dos páginas y ningún control de la página. Imprimirlo desde el navegador SHALL dar un PDF.

#### Scenario: Imprimir el reporte
- **WHEN** el reporte de la semilla 1 se imprime a PDF desde el navegador
- **THEN** se obtiene un PDF válido

### Requirement: Reporte en la suite de sistema
La suite de sistema SHALL recorrer la exportación contra `npm start`: cargar la semilla 1, exportar, abrir el archivo descargado sin conexión, comprobar sus KPIs, la `categoriaDominante` del `*.esperado.json` en los hallazgos y que sus gráficas se dibujan, e imprimirlo a PDF, sin peticiones fuera de 127.0.0.1.

#### Scenario: Exportar de punta a punta
- **WHEN** la prueba de sistema carga la semilla 1 y pulsa «Exportar reporte»
- **THEN** descarga `reporte-2026-07.html`, que abierto sin conexión muestra 2 000 transacciones, `$1,689,470.67` y la `categoriaDominante` del esperado en sus hallazgos, dibuja sus gráficas, se imprime a PDF, y ninguna petición salió de 127.0.0.1
