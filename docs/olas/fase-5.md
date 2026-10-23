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
| #45 | fase-5-exportar-reporte · 1.1–1.2 | `feat/fase-5-report-html` | mergeada (`30d9281`) — 0 mecánicas · 1 ronda · 0 por corrección; pasada final trivial |
| #46 | fase-5-exportar-reporte · 2.1–2.3 | `feat/fase-5-report-content` | mergeada (`5f582e3`) — 0 mecánicas · 1 ronda · 0 por corrección; pasada final trivial |
| #47 | fase-5-exportar-reporte · 3.1–3.2 | `feat/fase-5-export-button` | mergeada (`8f47efb`) — 0 mecánicas · 0 rondas · 0 por corrección; LISTA en la pasada 1 con 4 NO BLOQUEA: 2 en la pasada final trivial, 2 a deuda |

## Decisiones del PM

- D-U1 (usuario): formato de exportación 1 (a), HTML estático con las gráficas como SVG, sin JavaScript y con CSP que bloquea toda red. Descartadas: ECharts embebido; las dos cosas.
- D-U2 (usuario): contenido 2 (a), el tablero filtrado sin la tabla de transacciones. Descartadas: con la tabla; con la comparación.
- D-TM3 (Team Manager): contrato 3 (a), `generarHtml(contenido)` con el contenido ya redactado por el cliente. Descartadas: catálogo de textos en `reporte`; `textos` como argumento.
- D-TM4 (Team Manager): 4 (a), el reporte sigue al filtro y a los umbrales vigentes y lo dice en el encabezado. Descartada: siempre el mes completo con umbrales por defecto.
- D-TM5 (Team Manager): 5 (a), el mapa del reporte con el encuadre inicial de la página (ciudad principal). Descartada: todos los puntos.
- #45: los títulos de sección y las cabeceras de la tabla viajan en `ContenidoDelReporte` (la capa no tiene texto fijo); «sin filtros» es una línea más de `encabezado.filtros`. Descartado: títulos fijos en `src/reporte/` (contra D2).
- #45: NO BLOQUEA 4 de la pasada 1 (patrones `//`, `srcset`, `xlink:href` en el test de URLs) aceptado sin acción: la CSP de D4 lo bloquea en el navegador. Descartado: ampliar el test.
- `graft build` tras el merge no se corre: el grafo vive en el checkout principal, que sigue en `master` antiguo y no se cambia de rama; los encargos leen el código del worktree (igual que en la fase 4).
- #46: `dibujarComoSvg` fija `animation: false` sobre la opción (en SSR ECharts no la apaga solo: con animación el SVG trae `@keyframes`). La mutación de la tarea («sin barras») se observó como «con `@keyframes`»; el test la protege así.
- #46: tres KPIs de la semilla 1 (ticket promedio `$844.74`, mediana `$586.37`, gasto promedio por día `$54,499.05`) no están en el `esperado.json` ni en las specs: literales calculados desde el CSV fuera de la app por el implementador y recalculados por el crítico. Descartado: compararlos con la misma función (tautológico).
- #46: el implementador escribió `dibujarComoSvg` antes que sus tests para explorar el SVG; el crítico corrió las mutaciones y cada test muerde. Se anota como desvío de TDD, sin efecto en la protección.
- #46: el tamaño del HTML de la semilla 1 sin filtros es 682 555 bytes (el SVG del mapa, 404 KB); aceptado (`design.md`, *Risks*).
- #47: mutaciones de sistema de la tarea 3.2 corridas por el PM sobre `tests/sistema/reporte.spec.ts`, no commiteadas: con `main.tsx` sin la descarga falla en `toBeVisible` del botón; con la CSP con `https:` y un `@import` de fuente remota falla la vigilancia de `sin-red.ts` («peticiones a hosts distintos de 127.0.0.1», `fonts.googleapis.com`).
- #47: la «captura del PDF impreso» es la vista de impresión emulada (`emulateMedia print`); el PDF lo valida `%PDF` en la spec de sistema. Descartado: commitear el PDF.
- #47: las capturas del tablero se hicieron contra el servidor de desarrollo de vite (sin API del historial: sale el aviso «No se pudo guardar…»). Descartado: reconstruir y relanzar `npm start` para cada captura.
- Nota de mecánica: en la pasada 1 de #45 el crítico corrió `npx --no-install eslint` (lo declaró y no lo contó como evidencia); se le recordó la regla.
## Deuda

- #47 (pasada 1, NO BLOQUEA 4) — gráficas horizontales del reporte: en «Gráfica del gasto por categoría» (y en menor grado zona y cuenta) las barras ocupan una franja estrecha con mucho blanco y rótulos pequeños; en pantalla a 1000 px la quinta tarjeta de KPI queda sola en otra fila (en impresión caben las cinco). Origen: tamaño fijo de `dibujarComoSvg` (`src/cliente/contenido-del-reporte.ts`, 720 × 320) y `.kpi` en `src/reporte/estilos.ts`. Visible; no rompe requisito.
- #47 (pasada 1, NO BLOQUEA 3) — `src/cliente/descargar.ts:9-10`: `revokeObjectURL` en el mismo tick que `click()` y el `<a>` sin insertar en el documento. Funciona en Chromium (lo prueba `tests/sistema/reporte.spec.ts`); en Firefox o Safari sin verificar y sin fuente que diga que falla. Diferir la revocación costaría una línea.
- #45 (pasada 1, NO BLOQUEA 4) — el test de URLs externas no busca `//host`, `srcset` ni `xlink:href`; la CSP de D4 los bloquea en el navegador. Aceptado sin acción.

## Se coló

- —

## Lo que queda fuera

- —

## Entorno vivo

- Worktree del PM `/home/fabs/da-wt/tablero-gastos/pm5` (`ola/fase-5`): se quita tras abrir la PR de ola. El ensayo del demo corrió en `/home/fabs/da-wt/tablero-gastos/demo5`, ya quitado junto con su rama local; servidor apagado; nada en vuelo.
- Ajeno a esta ola, sigue en `git worktree list`: `/home/fabs/tablero-demo-fase3` (demo de la fase 3, detached en `2700804`).

## Coste

`.claude/da/da medir fase-5` sale con `gh pr list falló -- Unknown JSON field: "closingIssuesReferences"` (el `gh` 2.46.0 de la máquina no tiene ese campo) y deja en 0 todas las cifras de GitHub. Rellenado a mano desde `gh pr view 45|46|47 --json createdAt,mergedAt,files,comments` y los veredictos pegados en cada PR; lo único que el script sí midió es la fila de Actions.

### Mecánica

| Métrica | Valor |
| --- | --- |
| PRs a GitHub | 3 internas (#45, #46, #47) + la de ola |
| Merges a main — cierre o arreglo | 0 (la de ola espera al usuario) |
| Merges a main — planeación y archivado | 2 antes de la ola (#43 planeación, #44 decisiones) |
| Horas de espera (promedio) — cierre o arreglo | — |
| Horas de espera (promedio) — planeación y archivado | — (no medido) |
| Corridas de evidencia | 8 en PRs (#45: 3, #46: 3, #47: 2) + `verify` y `sistema` al cierre |
| Pasadas de crítico | 5 (#45: 2, #46: 2, #47: 1) |
| BLOQUEA en veredictos | 3 (#45: 2, #46: 1) |
| NO BLOQUEA en veredictos | 12 (#45: 4 + 1, #46: 3, #47: 4) |
| Actions — Citas | 4 min (salida de `medir`) |

### Trabajo

Sin las transcripciones (`medir` no llega a leerlas) no hay caché leída; las horas son de apertura a merge de cada PR, y las líneas, las añadidas según `gh pr view --json files`.

| PR | Caché leída/línea (producto) | Horas/línea (producto) | Caché leída/línea (test) | Horas/línea (test) |
| --- | --- | --- | --- | --- |
| #45 | — | 0.19 h / 142 líneas | — | 0.19 h / 276 líneas |
| #46 | — | 0.16 h / 216 líneas | — | 0.16 h / 308 líneas |
| #47 | — | 0.10 h / 59 líneas | — | 0.10 h / 171 líneas |

### Guardas

| Guarda | Valor |
| --- | --- |
| Se coló | 0 |
| BLOQUEA de código | 0 (los 3 BLOQUEA fueron de test: #45, dominante y mensaje de ninguno sin afirmar; #46, tres KPIs sin valor afirmado) |
| sistema al cierre | 6/6 sobre `6b5a5c4` |

## Handover

- **Estado estable:** ola cerrada. `verify` verde (1049 tests) y `sistema` 6/6 sobre `6b5a5c4`, la punta de `ola/fase-5` antes del commit de cierre, que solo toca este registro; PR de ola abierta contra `master`.
- **Hecho:** grupos 1, 2 y 3 (#45, #46, #47) mergeados; 7/7 casillas; cierre de §5.
- **Lo que queda en orden:** el merge del usuario y, tras él, el Archivador (`team-manager` §7).
- **Demo ensayado de punta a punta** (worktree sin espacios, `TABLERO_SIN_NAVEGADOR=1`, `TABLERO_HISTORIAL` temporal, script de Playwright fuera del repositorio): semilla 1 → 2,000 transacciones y `$1,689,470.67`; «Exportar reporte» descarga `reporte-2026-07.html` (684,975 bytes); abierto por `file://` sin red: cinco KPIs, seis hallazgos, siete gráficas con ancho natural > 0, cero peticiones fuera de `file:`, PDF con cabecera `%PDF`. Con «Compras» marcada en *Categorías*: 404 transacciones, `$814,566.30`, encabezado «Categorías: Compras». `git worktree remove` sin `--force` acepta `node_modules/`, `dist/` y `dist-server/` dentro (están ignorados). Correcciones al borrador: el CSV se elige desde el navegador de Windows con la ruta `\\wsl.localhost\Ubuntu\…`; la segunda descarga sale con el mismo nombre (el navegador le añade ` (1)`); el servidor se apaga con Ctrl+C antes de quitar el worktree. Sin ensayar: que `open` abra el navegador de Windows desde WSL (el ensayo corrió sin navegador).
- **Pendiente con el Team Manager o el usuario:** confirmar o revertir las decisiones en la PR de ola.
- **Por qué paro:** misión cumplida (cierre).
