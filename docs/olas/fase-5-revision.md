# Pre-vuelo — Ola fase-5 «Exportar reporte»

Verificado el 2026-10-22 contra `master` @ `fa71e7a` (fases 0 a 4 mergeadas y archivadas; `openspec/changes/` sin changes activos; ninguna rama `ola/fase-5`).

## 1. Veredicto

- `fase-5-exportar-reporte`: propuesto en este pre-vuelo; valida con `--strict`.
- Ola entera: **no lista** hasta que el usuario cierre las decisiones 1 y 2 (alcance) y mergee la PR de documentos (#44); el Team Manager cierra la 3 a la 5. Todo lo demás está escrito con la opción recomendada: si el usuario la confirma, la ola queda lista sin tocar el change y el brief (`docs/olas/fase-5-brief.md`) vale tal cual.
- Lo más importante: el contrato de `reporte` de `docs/ARQUITECTURA.md` no se puede cumplir tal cual (textos visibles solo en el cliente; opciones de ECharts con funciones). El change lo sustituye por `generarHtml(contenido)`.

## 2. La ola

- **Ola fase-5 — `fase-5-exportar-reporte`** (3 PRs internas, en serie)
  - **Entregable**
    - Botón «Exportar reporte» en el tablero que descarga `reporte-AAAA-MM.html`.
    - El archivo: encabezado con mes, periodo y filtros; KPIs; hallazgos con los umbrales vigentes; gasto por categoría; cinco gráficas del periodo; mapa. Todo estático, gráficas en SVG, sin JavaScript, con CSP que bloquea la red.
    - `tests/reporte/` (nuevo) y `tests/sistema/reporte.spec.ts` (nueva): abre el archivo sin conexión y lo imprime a PDF.
  - **Componentes que se modifican**
    - `src/reporte/` (nuevo: `generarHtml(contenido)` y `ContenidoDelReporte`)
    - `src/cliente/echarts.ts` (dibujar una opción como SVG sin DOM)
    - `src/cliente/PanelDeHallazgos.tsx` y `GastoPorCategoria.tsx` (ceden `descripcion()` y `opcionDeCategorias`, sin cambio de comportamiento)
    - `src/cliente/Tablero.tsx`, `App.tsx`, `main.tsx` (botón y descarga como prop opcional)
    - `src/cliente/textos.ts`, `estilos.css`, `opciones-de-graficas.ts`
    - No se toca: `src/dominio/`, `src/graficas/`, `src/servidor/`, `eslint.config.mjs` (ya tiene la capa `reporte`), `tests/sistema/sin-red.ts`, `package.json`.

## 3. Hallazgos

### BLOQUEA EL ARRANQUE

- **H1. El contrato de `reporte` es inviable tal cual.**
  - Qué pasa: `docs/ARQUITECTURA.md:39` fija `generarHtml(m: Metricas, h: Hallazgo[], figuras: EChartsOption[])` y `:11` dice «ECharts y datos en línea».
  - Evidencia (verificado):
    - la redacción de los hallazgos es privada del cliente (`src/cliente/PanelDeHallazgos.tsx:17-57`) y los rótulos están en `src/cliente/textos.ts:123-130`, `:207-263`; `reporte` no puede importar `cliente` (`eslint.config.mjs:11`);
    - `src/graficas/columnas.ts:60` lleva un formateador con función: un ECharts embebido con las opciones en JSON pierde el formato R-17 de los ejes;
    - ya lo anticipó `docs/olas/fase-2-revision.md:68`.
  - Por qué importa: un implementador que siga el contrato o duplica el catálogo de textos (contra la convención de `CLAUDE.md`) o pierde los ejes en MXN.
  - Recomendación: `generarHtml(contenido)` con el contenido ya redactado por el cliente y las gráficas en SVG (`design.md` D1-D3). Corrección en `docs/ARQUITECTURA.md` por la PR de documentos para el usuario. Decisiones 1 y 3.
- **H2. «Formato de exportación» figura como decisión cerrada de la fase y no está escrita en ningún sitio.**
  - Evidencia (verificado): `docs/PLAN.md`, tabla de fases, fila 5; *Pendientes* no la recoge; `docs/STACK.md:85` solo descarta Puppeteer.
  - Recomendación: decisión 1; se escribe en *Pendientes* de `docs/PLAN.md` y en *Decisión* de `docs/STACK.md` (PR de documentos).

### CORREGIR ANTES DE ENCARGAR (ya corregido en el change)

- **H3. La comprobación «ninguna `http(s)://`» de `docs/ARQUITECTURA.md:63` daría rojo falso con SVG en línea** (`xmlns="http://www.w3.org/2000/svg"`) y verde falso si se busca solo texto en claro. El change la dirige a `src`, `href`, `url(` y `@import`, añade la CSP y la prueba sin conexión (`design.md` D3, D4; tarea 1.2). La fila de `docs/ARQUITECTURA.md` se ajusta en la PR de documentos.
- **H4. Abrir el archivo con `file://` en la suite falla la vigilancia de red**: `tests/sistema/sin-red.ts:4,10-13` solo exime `data:` y `blob:`. El change usa `page.setContent` en un contexto sin conexión (`design.md` D11). No se toca `sin-red.ts`.
- **H5. Los hallazgos se calculan dentro del panel** (`src/cliente/PanelDeHallazgos.tsx:73-76`), no en `Tablero`. Subirlos cambiaría la interfaz que monta `tests/cliente/hallazgos.test.tsx`. El change arma el contenido al pulsar el botón y recalcula ahí (`design.md` D6).
- **H6. La descarga no se puede ejercer en jsdom** (sin `URL.createObjectURL`). Cáscara inyectada como el historial y el almacén (`src/cliente/App.tsx:43`, `main.tsx:16-29`), protegida por la spec de sistema (`design.md` D9).

### DEUDA (no bloquea; issues deshabilitadas en el repositorio, vive aquí)

- `docs/ARQUITECTURA.md`, *Contratos*, sigue sin nombrar los añadidos de las fases 1 a 4 (`docs/olas/fase-2-revision.md:67`). La PR de documentos solo corrige la línea de `reporte`, que esta ola necesita.
- Deuda de `docs/olas/fase-4.md` (*Deuda*): margen del encuadre del mapa, rótulos del mapa protegidos sobre la opción, tooltip sin test, texto inválido de un umbral, `da medir` roto con `gh` 2.46.0, docstring de `hallazgos`. Ninguna toca el reporte; el mapa del reporte hereda el margen recortado (estético).

## 4. Tope de PRs y partición

- 3 grupos, 3 PRs internas, en serie (1 → 2 → 3). Cabe en una ola.
- Estimados de diff:
  - grupo 1 (`src/reporte/` + tests): ~400 líneas;
  - grupo 2 (mover `descripcion()` y `opcionDeCategorias`, SVG, armado del contenido, textos, tests): ~600;
  - grupo 3 (botón, descarga, `App`/`main`, estilos, tests de componente, spec de sistema): ~350.

## 5. Lo que la ola absorbe

- Nada de la deuda heredada: ninguna entrada de *Deuda* de `docs/olas/fase-0.md` a `fase-4.md` cae en el área del reporte.

## 6. Lo que está bien

- La capa `reporte` ya está en el lint de capas y de pureza (`eslint.config.mjs:11,15`) y en `tests/arquitectura/capas.test.ts:11-20`: no hace falta tocar el lint.
- `docs/STACK.md` ya descarta generar PDF con Puppeteer: imprimir desde el navegador es lo previsto.
- El cliente ya arma cada opción con su descripción accesible (`src/cliente/opciones-de-graficas.ts`): el reporte la reutiliza como texto alternativo.
- Ninguna dependencia nueva; skills del perfil bastan.

## 7. Decisiones

1. **Formato de exportación (alcance, usuario).**
   - (a) HTML estático: gráficas como SVG ya dibujado, sin JavaScript, CSP que bloquea toda red. Pesa poco, imprime igual en cualquier navegador. Sin tooltip ni zoom. **Recomendada.**
   - (b) HTML con ECharts embebido (~1 MB) y gráficas interactivas. Pierde el formato MXN de los ejes salvo rehacer los formateadores, pesa más, y la impresión depende del script.
   - (c) Las dos cosas en el mismo archivo. Suma los costes de ambas.
2. **Contenido del reporte (alcance, usuario).**
   - (a) El tablero filtrado sin la tabla: encabezado con filtros, KPIs, hallazgos, categorías, cinco gráficas y mapa. **Recomendada.**
   - (b) (a) más la tabla de transacciones: hasta ~20 000 filas, cientos de páginas al imprimir.
   - (c) (a) más la comparación de meses del historial: necesita elegir meses en el momento de exportar; alcance nuevo.
3. **Contrato de `reporte` (técnica, Team Manager; el texto de `docs/ARQUITECTURA.md` lo mergea el usuario).**
   - (a) `generarHtml(contenido)` con el contenido ya redactado por el cliente. **Recomendada.**
   - (b) Mantener `generarHtml(m, h, figuras)` con un catálogo de textos en `src/reporte/`: dos catálogos.
   - (c) Pasar `textos` como argumento: acopla la capa pura al catálogo del cliente.
4. **El reporte sigue al filtro y a los umbrales vigentes (técnica, Team Manager).**
   - (a) Sí, y lo dice en el encabezado. Coherente con R-10 y con D-TM2 de la fase 4. **Recomendada.**
   - (b) Siempre el mes completo con umbrales por defecto.
5. **Mapa del reporte (técnica, Team Manager).**
   - (a) El mismo encuadre inicial que la página (ciudad principal); el destino del viaje queda en su hallazgo. **Recomendada.**
   - (b) Todos los puntos: el destino aplasta las zonas de la ciudad en un rincón.
