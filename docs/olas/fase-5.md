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

- Worktree del PM `/home/fabs/da-wt/tablero-gastos/pm5` (`ola/fase-5` @ `8f47efb`). Worktrees de grupo quitados; servidor de desarrollo apagado; nada en vuelo.

## Coste

- `.claude/da/da medir` no corre con el `gh` 2.46.0 de la máquina (igual que en la fase 4): se rellena a mano al cierre desde la tabla de PRs.

## Handover

- **Estado estable:** las 3 PRs internas mergeadas en `ola/fase-5` (#45, #46, #47), punta `8f47efb`; 7/7 casillas (`openspec instructions apply`). Nada en vuelo: ningún implementador ni crítico con trabajo pendiente, ningún comando pesado corriendo.
- **Hecho:** grupos 1, 2 y 3 cerrados. `verify` verde sobre el último commit de cada grupo (`3f4856a`, `c7ae7f3`, `f46538f`: 1049 tests al final) y `sistema` 6/6 sobre `c7ab176` (código de producto idéntico a la punta de #47).
- **Lo que queda en orden:** solo el cierre (§5): `verify` y `sistema` sobre `ola/fase-5` tras el último merge (worktree del PM ya montado en `/home/fabs/da-wt/tablero-gastos/pm5`, haz `git pull` antes); registro con la sección *Coste* a mano; PR `ola/fase-5 → master` con la plantilla B (no hay `Closes #N`: issues deshabilitadas); entregar al Team Manager el número, el enlace, el estado de CI y las instrucciones del demo.
- **Instrucciones del demo (borrador verificado contra `package.json` y `src/servidor/config.ts`, `main.ts`):** `git -C <repo> fetch origin` · `git -C <repo> worktree add /home/fabs/tablero-demo-fase5 origin/ola/fase-5` (ruta sin espacios) · `cd /home/fabs/tablero-demo-fase5` · `npm ci` (lo corre el usuario) · `npm start` (compila el servidor, reconstruye el bundle si hace falta y abre el navegador en `http://127.0.0.1:4310`; `TABLERO_PUERTO` cambia el puerto, `TABLERO_SIN_NAVEGADOR=1` no abre navegador, el historial va a `historial/` del worktree) · elegir `tests/fixtures/generador/2026-07-semilla-1.csv` · pulsar «Exportar reporte» → descarga `reporte-2026-07.html` · desconectar la red y abrir el archivo con doble clic · Ctrl+P → «Guardar como PDF». Probar también con un filtro (solo Compras: gasto total `$814,566.30` y la línea del filtro en el encabezado). Al terminar: `git -C <repo> worktree remove /home/fabs/tablero-demo-fase5`.
- **Avisos:** los worktrees van bajo `/home/fabs/da-wt/tablero-gastos/` (el gancho `preparar` falla con espacios); `gh pr edit` falla con `gh` 2.46.0, se usa `gh api -X PATCH repos/josefabian2690-gif/data-analysis-report-project/pulls/<n> -F body=@<archivo>`; `cuerpo-pr armar` se corre desde la raíz del repo principal (desde el worktree no ve el estado) y exige árbol limpio (sin `imgs/screenshots/pendiente/` sin trackear) para no marcar `+sucio`.
- **Pendiente con el Team Manager o el usuario:** nada abierto. Las cinco decisiones de arranque y las del PM esperan confirmación del usuario en la PR de ola.
- **Por qué paro:** relevo de §6 a las 3 PRs internas mergeadas (contexto en torno a 270 mil tokens, bajo el umbral).
