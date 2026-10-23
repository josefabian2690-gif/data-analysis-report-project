# Ola fase-5 — Exportar reporte

**Rama:** `ola/fase-5` · **Changes:** `fase-5-exportar-reporte` · **Abierta:** 2026-10-22

## Arranque

- Base: `master` @ `0b5dcba` (#44 mergeada). Sin avance continuo; la PR de ola apunta a `master`. Las ramas `ola/fase-0` a `ola/fase-4` son de olas ya mergeadas: no hay otra ola activa.
- `preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft).
- `verify` sobre la base: verde en `0b5dcba` desde el worktree del PM (64 archivos, 994 tests, enlaces del worktree OK).
- `sistema` sobre la base: 5/5 sobre `73c2be0` al cierre de la fase 4 (`docs/olas/fase-4.md`); desde `2a920e9` solo cambiaron `docs/` y `openspec/`. Sin specs heredados inestables.
- OpenSpec: `instructions apply` → `ready`, 0/7, `contextFiles` proposal, specs, design y tasks, sin `context` ni `operationGuidance`. `openspec validate fase-5-exportar-reporte --strict`: válido.
- Hipótesis de `design.md` D1 comprobada con un experimento fuera del repositorio sobre el ECharts 6.1.0 instalado: `init(null, null, { renderer: 'svg', ssr: true, width: 720, height: 320 })` + `renderToSVGString()` corre en Node; con `animation: false` dibuja las barras, las marcas `decal` salen como `<pattern>` y el encuadre de un `dataZoom` `inside` recorta las categorías fuera de él. La tarea 2.2 lo prueba sobre las opciones reales y en jsdom.
- Inventario de lo que el equipo no puede procurarse: nada. Sin `[PENDIENTE]`, sin dependencias nuevas, sin scopes.
- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm5` (`ola/fase-5`), con su propio `node_modules`.
- **Trampa de entorno:** el gancho `preparar` (`npm ci --prefix {wt}`) falla si la ruta del worktree tiene espacios (la raíz del repo los tiene): los worktrees van bajo `/home/fabs/da-wt/tablero-gastos/`.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | fase-5-exportar-reporte · 1.1–1.2 | `feat/fase-5-report-html` | pendiente |
| — | fase-5-exportar-reporte · 2.1–2.3 | `feat/fase-5-report-content` | pendiente |
| — | fase-5-exportar-reporte · 3.1–3.2 | `feat/fase-5-export-button` | pendiente |

## Decisiones del PM

- D-U1 (usuario): formato de exportación 1 (a), HTML estático con las gráficas como SVG, sin JavaScript y con CSP que bloquea toda red. Descartadas: ECharts embebido; las dos cosas.
- D-U2 (usuario): contenido 2 (a), el tablero filtrado sin la tabla de transacciones. Descartadas: con la tabla; con la comparación.
- D-TM3 (Team Manager): contrato 3 (a), `generarHtml(contenido)` con el contenido ya redactado por el cliente. Descartadas: catálogo de textos en `reporte`; `textos` como argumento.
- D-TM4 (Team Manager): 4 (a), el reporte sigue al filtro y a los umbrales vigentes y lo dice en el encabezado. Descartada: siempre el mes completo con umbrales por defecto.
- D-TM5 (Team Manager): 5 (a), el mapa del reporte con el encuadre inicial de la página (ciudad principal). Descartada: todos los puntos.

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- —

## Entorno vivo

- Worktree del PM `/home/fabs/da-wt/tablero-gastos/pm5`.

## Coste

- —

## Handover

- —
