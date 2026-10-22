# Proposal

## Why

Tras la fase 3 el tablero muestra KPIs, gráficas, tabla, historial y comparación, pero el analista todavía tiene que descubrir a ojo los patrones que el generador imprime con `-v` y no ve dónde gasta. La fase 4 de `docs/PLAN.md` («Mapa y hallazgos») dibuja el gasto por latitud y longitud, sin teselas ni red, y detecta solo los hallazgos de R-16 (categoría dominante, zona favorita, quincena, fin de semana, viaje y atípicos), con un test de semillas que los compara con cada `*.esperado.json`.

## What Changes

- **Hallazgos (R-16, dominio):** `hallazgos(tx, umbrales?)` con la firma de `docs/ARQUITECTURA.md` (más un `periodo` opcional, aditivo, como el de `metricas`): cada hallazgo es un dato estructurado con su evidencia numérica; solo aparece si supera su umbral. `Umbrales`, sus valores por defecto y la validación de un umbral escrito en pantalla o leído del navegador viven en el dominio, como lógica pura.
- **Ciudad principal (dominio):** la ciudad de una zona y la ciudad principal del conjunto (la de mayor gasto), que usan la zona favorita, el viaje y el encuadre del mapa.
- **Test de semillas:** `hallazgos()` sobre cada fixture del generador coincide con su `*.esperado.json` en categoría dominante, zona favorita y viaje (destino y días).
- **Mapa (dominio + gráficas):** `Metricas` gana los puntos con coordenadas agrupados por zona y la cuenta de transacciones sin coordenadas; una función nueva de `src/graficas/` dibuja un scatter de longitud/latitud sobre ejes cartesianos, un color y una forma por zona, encuadrado en la ciudad principal y con zoom y desplazamiento para llegar al resto.
- **Cliente:**
  - Un panel de hallazgos tras los KPIs, cada hallazgo como texto es-MX con su evidencia en R-17.
  - Los umbrales de R-16 se ajustan **desde la pantalla** (decisión del usuario del 2026-10-21): un control por umbral, «Restablecer» a los valores por defecto, y un valor inválido no se aplica.
  - Los umbrales ajustados **se conservan en el navegador** (`localStorage`, decisión del usuario del 2026-10-21): sobreviven a cargar otro CSV, a recargar la página y a reiniciar, solo en ese navegador, y nunca viajan al servidor. La lectura y la escritura son una cáscara delgada de I/O en `src/cliente/`; un valor guardado inválido cae a los valores por defecto, y sin almacenamiento disponible la página funciona igual, sin conservarlos.
  - Una sección de mapa tras la gráfica por cuenta; un mes sin coordenadas muestra «sin coordenadas» en lugar de fallar.
  - Mapa y hallazgos se recalculan con el filtro (R-10) y se ocultan con los demás cuando el filtro deja 0 filas.
- **Suite de sistema:** el flujo principal comprueba además, contra el `*.esperado.json` de la semilla 1, la categoría dominante, la zona favorita y el destino del viaje en el panel de hallazgos, y que el mapa se dibuja. Una spec nueva comprueba que un umbral ajustado sigue tras recargar la página y que ninguna petición lo lleva.
- **Lo que cambia de las fases anteriores (declarado):**
  - `filtros-del-tablero`, «Todo el dashboard se recalcula» y «Filtro que deja 0 filas»: incluyen el mapa y los hallazgos.
  - `tablero-del-mes`, «Flujo principal en la suite de sistema»: comprueba también hallazgos y mapa.
  - `tests/cliente/graficas-del-mes.test.tsx:56` (cuenta de gráficas) y `:63` (orden de los títulos hasta la tabla) cambian con la sección del mapa.
- **Decisiones del usuario que gobiernan la fase (2026-10-21):** el mapa es **solo puntos coloreados por zona**, sin contorno de CDMX ni GeoJSON; los umbrales de R-16 **se ajustan desde la pantalla** y **se conservan en el navegador** (`localStorage`), no en el servidor.
- **Fuera de alcance** (`docs/PLAN.md`, fase 4): exportar. Tampoco entran: contorno o GeoJSON en el mapa, guardar los umbrales en el servidor o compartirlos entre navegadores, hallazgos o mapa de un mes del historial (abrir un mes guardado en el tablero no existe), proyección cartográfica exacta, y recrear menos instancias de ECharts en `src/cliente/Grafica.tsx` (`docs/olas/fase-2.md`, *Deuda*).

## Interpretación del entregable

- «Mapa local por latitud y longitud con color por zona»: con el fixture `2026-07-semilla-1`, cada zona de CDMX se distingue a la vista con su color y su forma, la leyenda las nombra, y el destino del viaje (Monterrey, N.L.) se alcanza con zoom o desplazamiento; ninguna petición sale de 127.0.0.1.
- «Panel de hallazgos»: con el mismo fixture se ven categoría dominante (Compras, 48.2 %), zona favorita (Centro Histórico, CDMX), quincena, fin de semana, viaje (Monterrey, N.L., del 24/07/2026 al 26/07/2026) y atípicos (2), y subir el umbral de categoría dominante a 50 % la quita; tras recargar la página, el umbral sigue en 50.
- «El test de semillas pasa contra `esperado.json`»: un test de `tests/dominio/` por fixture de `tests/fixtures/generador/`.

## Capabilities

### New Capabilities
- `hallazgos-automaticos`: los hallazgos de R-16 con su evidencia y sus umbrales, el test de semillas, el panel de la página, el ajuste de umbrales desde la pantalla y su conservación en el navegador.
- `mapa-de-gasto`: el mapa local de los gastos con coordenadas, color y forma por zona, encuadre en la ciudad principal y el caso «sin coordenadas».

### Modified Capabilities
- `filtros-del-tablero`: «Todo el dashboard se recalcula» y «Filtro que deja 0 filas» incluyen el mapa y los hallazgos.
- `tablero-del-mes`: «Flujo principal en la suite de sistema» comprueba también los hallazgos de la semilla y que el mapa se dibuja.

## Impact

- **Nuevos:**
  - `src/dominio/`: módulo de hallazgos (con `Umbrales`, sus valores por defecto y la validación de umbrales escritos o guardados) y módulo de zonas (ciudad de una zona, ciudad principal).
  - `src/graficas/`: la gráfica del mapa.
  - `src/cliente/`: panel de hallazgos con el control de umbrales, la cáscara que lee y escribe los umbrales en `localStorage`, y sección del mapa.
  - Sus tests en `tests/dominio/` (incluido el de semillas), `tests/graficas/` y `tests/cliente/`; una spec nueva en `tests/sistema/` para los umbrales tras recargar.
- **Modificados:**
  - `src/dominio/metricas.ts` (`Metricas` gana los puntos del mapa y la cuenta sin coordenadas) y `tests/graficas/metricas-de-prueba.ts` (`METRICAS_VACIAS`).
  - `src/graficas/estilo.ts` (paleta y formas por zona).
  - `src/cliente/echarts.ts` (registrar scatter, zoom y lo que el mapa necesite: `graficas` solo importa tipos de `echarts`, `eslint.config.mjs`), `Tablero.tsx`, `App.tsx` (los umbrales sobreviven a otro CSV y reciben su almacén opcional), `main.tsx` (le pasa el almacén del navegador), `textos.ts`, `estilos.css`, `opciones-de-graficas.ts`.
  - `tests/cliente/graficas-del-mes.test.tsx` (cuenta y orden de las gráficas), `tests/sistema/flujo-principal.spec.ts`.
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `hallazgos(tx, umbrales?)`, `Hallazgo` y `Umbrales` en `src/dominio/`. Añadidos declarados en `design.md`: el `periodo` opcional de `hallazgos`, los campos nuevos de `Metricas` y la función de `graficas` del mapa. La API del historial no cambia.
- **Dependencias:** ninguna nueva (ECharts ya está; scatter y zoom vienen en él).
- **No se toca:** `generador/`, `tests/fixtures/`, `src/servidor/`, `src/reporte/`, `docs/`, `.claude/`, `openspec/specs/`, `package.json`, `vite.config.mts`, `eslint.config.mjs`, `playwright.config.ts`.
- Una sola ola (`fase-4`) de 5 PRs internas.
