# Brief — Ola fase-5 «Exportar reporte»

Eres el **project manager** de la Ola fase-5 de tablero-gastos. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

> **Condición de arranque.** Este brief asume las opciones recomendadas de `docs/olas/fase-5-revision.md` §7: formato estático con SVG (1a), contenido sin tabla ni comparación (2a), `generarHtml(contenido)` (3a), reporte que sigue al filtro y a los umbrales (4a), mapa con el encuadre de la página (5a). El Team Manager te lanza solo con esas decisiones cerradas y con la PR de documentos de la fase 5 mergeada en `master`. Si alguna cambió, el change se actualizó por `openspec-update-change` antes de lanzarte y este brief también.

## 1. La ola

- **Base: `master` @ `fa71e7a` o posterior** (rama principal `master`, no `main`). Pasa siempre `--desde` explícito a `.claude/da/da worktree montar`. Las fases 0 a 4 están en `master` y archivadas.
  - Rama `ola/fase-5` desde `master`, después de mergear la PR de planeación y la de documentos de esta ola. Registro: `docs/olas/fase-5.md`.
- **Change:** `fase-5-exportar-reporte`, ya propuesto y refinado; lo tomas, no lo reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable: `openspec-update-change` y registro.
- **Entregable:**
  - un botón «Exportar reporte» en el tablero, visible mientras el filtro deja filas, que descarga `reporte-AAAA-MM.html`;
  - el archivo es estático: gráficas como SVG en imágenes `data:`, sin JavaScript, con una CSP que bloquea toda red; se abre sin conexión y se imprime a PDF desde el navegador;
  - contiene encabezado (mes, periodo, filtros o «sin filtros»), KPIs, hallazgos con los umbrales vigentes, gasto por categoría (lista y gráfica), las cinco gráficas del periodo y el mapa (o «sin coordenadas»);
  - `tests/reporte/` (nuevo) y `tests/sistema/reporte.spec.ts` (nueva).
- **PRs internas: 3**, una por grupo, en serie: 1 → 2 → 3.
  - El 2 espera al 1 (usa `ContenidoDelReporte`); el 3 espera al 2 (exporta lo que el 2 arma; los dos tocan `textos.ts`).
  - Estimados de diff: grupo 1 ~400 líneas, grupo 2 ~600, grupo 3 ~350.
- Es la última fase del PLAN: no hay ola siguiente que no empezar.

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4.
   - Los encargos citan `docs/DOMINIO.md`: R-10, R-11, R-12, R-16, R-17 y *Casos borde* («Un mes sin coordenadas», «Filtros que dejan 0 filas»).
3. Los artefactos del change por la mecánica de OpenSpec.
   - `instructions apply` devuelve `ready`, 0/7, `contextFiles` proposal, specs, design y tasks, **sin** `context` ni `operationGuidance` (comprobado el 2026-10-22).
   - `openspec validate fase-5-exportar-reporte --strict` pasa.
4. `docs/olas/fase-5-revision.md` (hallazgos H1 a H6 y decisiones).
5. Guardas que no se ablandan:
   - `tests/arquitectura/` (capas, pureza; `reporte` ya está en `tests/arquitectura/capas.test.ts:11-20`);
   - `tests/cliente/hallazgos.test.tsx`, `categorias.test.tsx` y `graficas-del-mes.test.tsx` sin cambios: guardan que la tarea 2.1 no cambia comportamiento;
   - `tests/sistema/flujo-principal.spec.ts`, `dashboard-filtrado.spec.ts`, `persistencia.spec.ts`, `umbrales.spec.ts`, `pagina-vacia.spec.ts` y `sin-red.ts` sin cambios;
   - los tests de `tests/cliente/` que montan `<App historial=… />` sin descarga no cambian (prop opcional, `design.md` D9).

## 3. Reglas de la fase que mandan en cada PR

- Fuera de alcance: tabla de transacciones, filas inválidas y comparación en el reporte; gráficas interactivas; PDF generado por la app; exportar un mes del historial; guardar reportes en el servidor o en `output/`.
- El reporte no lleva `<script>` ni referencia ningún recurso fuera de sí mismo; la CSP es la de `design.md` D4.
- `src/reporte/` no redacta ni formatea: compone, escapa y da estilo. Los textos visibles solo en `src/cliente/textos.ts` (`design.md` D2). `reporte` no importa `echarts` (la tabla de capas de `docs/ARQUITECTURA.md` no se lo da): el SVG lo dibuja el cliente.
- Contratos:
  - `generarHtml(contenido: ContenidoDelReporte): string` sustituye al de `docs/ARQUITECTURA.md` anterior (lo corrige la PR de documentos de la fase 5).
  - `metricas`, `hallazgos`, `filtrar` y la API del historial no cambian.
- Ninguna dependencia nueva.
- Cifras de las pruebas con fixtures: literales, las de `design.md` *Context*.
- No se tocan `generador/`, `tests/fixtures/`, `src/dominio/`, `src/graficas/`, `src/servidor/`, `package.json`, `vite.config.mts`, `eslint.config.mjs`, `playwright.config.ts` ni `tests/sistema/sin-red.ts`.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-22, `master` @ `fa71e7a`)

- **Grupo 1 — Reporte: el HTML autocontenido.**
  - `src/reporte/` y `tests/reporte/` no existen. `tests/reporte/*.test.ts` entra en el proyecto `nucleo` de Vitest (`vite.config.mts`, `include: ['tests/**/*.test.{ts,tsx}']`, entorno `node`): sin DOM. Un parser de HTML no está en las dependencias; las aserciones van sobre el string (o con `DOMParser` solo si el test se mueve a jsdom, que no hace falta).
  - Lint de la capa: `eslint.config.mjs:11` (importa `dominio` y `graficas`), `:15` y `:85-93` (sin `window`, `document`, `fetch`, `Date()`, `import.meta`). `encodeURIComponent` no está prohibido.
  - Trampa: un SVG real trae `xmlns="http://www.w3.org/2000/svg"`; codificado con `encodeURIComponent` no aparece en claro. El test de URLs externas apunta a `src=`, `href=`, `url(` y `@import` (`design.md` D3, D4).
  - Trampa: el escape cubre texto **y** atributos (`alt` lleva la descripción, que trae nombres de zona del CSV).
- **Grupo 2 — Cliente: contenido y SVG.**
  - `descripcion()` es privada en `src/cliente/PanelDeHallazgos.tsx:17-57`; `opcionDeCategorias`, en `src/cliente/GastoPorCategoria.tsx:11-20`. Se mueven sin cambio de comportamiento (tarea 2.1).
  - Las demás opciones con descripción ya están en `src/cliente/opciones-de-graficas.ts:27-91`; la descripción accesible va en `aria.label.description` (`:18-25`): es el `alt` de cada imagen.
  - `src/cliente/echarts.ts:12-21` registra los componentes (incluidos `ScatterChart` y `DataZoomInsideComponent`) y `SVGRenderer`; la función nueva va ahí.
  - **No verificado:** sin `node_modules` en la máquina del pre-vuelo no se abrió ECharts 6.1.0. El implementador comprueba en el instalado `init(null, null, { renderer: 'svg', ssr: true, width, height })` y `renderToSVGString()`, que corran en jsdom, que respeten el encuadre de dataZoom del mapa y que dibujen las marcas `decal` (`src/graficas/columnas.ts:23`). Si algo falta, escala: mockearlo no vale como prueba.
  - Hallazgos: `hallazgos(tx, umbrales?, periodo?)` (`src/dominio/hallazgos.ts:173`); el panel los calcula con `ajuste.umbrales` y el periodo del filtro (`src/cliente/Tablero.tsx:29,47-52`). El armado del contenido hace lo mismo con los mismos argumentos.
  - Mes y conteo: `formatearMes` y `formatearConteo` (`src/cliente/presentacion.ts`); montos, fechas y porcentajes: `src/dominio/formato.ts`.
  - El filtro tiene `desde`, `hasta`, `categorias`, `cuentas`, `zonas`, `montoMinimo`, `montoMaximo` (`src/dominio/filtro.ts:5-15`); listas vacías no restringen.
- **Grupo 3 — Cliente: botón, descarga y sistema.**
  - El botón va dentro del bloque `!sinResultados`, antes de `<Kpis>` (`src/cliente/Tablero.tsx:44-46`). No es `h2`: el orden de `tests/cliente/graficas-del-mes.test.tsx` no cambia.
  - `Tablero` se remonta con cada carga (`src/cliente/App.tsx:144-148`); la descarga llega por prop desde `App` (`:43`), y `main.tsx:27-30` la pasa, como `historial` y `almacen`.
  - Ningún test de `tests/cliente/` cuenta botones con `getAllByRole('button')` (comprobado con `grep`).
  - Sistema: `tests/sistema/sin-red.ts:4,10-13` exime `data:` y `blob:` y escucha en el contexto; `file://` cuenta como salida. Abre el HTML con `page.setContent` en una página nueva del mismo contexto con `context.setOffline(true)` (`design.md` D11). `playwright.config.ts` usa solo Chromium, donde `page.pdf()` funciona en headless.
  - El esperado de la semilla 1 se lee como en `tests/sistema/flujo-principal.spec.ts:10-18`. Si la semilla 1 ya está guardada por otra spec en el mismo servidor, el guardado responde con la pregunta de reemplazo (409): no afecta a la exportación.
- **Skills:** bastan los del perfil, sin instalar ninguno: precargados `tdd`, `codebase-design`, `solid` y `gh`; por área `typescript-advanced-types`, `vitest`, `javascript-testing-patterns` y `vercel-react-best-practices`. `dataviz` está disponible y conviene nombrarlo en el encargo del grupo 1 para la hoja de estilos de pantalla e impresión.

## 5. Mecánica de esta fase

- **Base de la ola:** `master`, sin avance continuo. De ahí sale `ola/fase-5` y a ahí apunta su PR.
- Quién propone y quién toma: propone el Team Manager, vía el Planeador; toma el PM; se escala al Team Manager.
- Otra sesión puede compartir el repo hoy: la del Team Manager. El checkout principal tiene archivos del usuario sin commitear (`.claude/agents/`, `.claude/da/manifiesto.json`, `.claude/desarrollo-autonomo.json`, `docs/DESARROLLO-AUTONOMO.md`): no lo toques y trabaja en worktrees.
- `gh pr edit` falla con el `gh` 2.46.0 de la máquina: edita cuerpos con `gh api`. `.claude/da/da medir` tampoco corre con esa versión (`docs/olas/fase-4.md`, *Deuda*).
- El handover, la regla de no cambiar la rama del checkout principal y el comando pesado uno a la vez viven en `desarrollo-autonomo-pm` (§6, §1.7) y en `CLAUDE.md` (*Desarrollo agéntico* 8-9). Los worktrees se montan con `.claude/da/da worktree montar`.
- Cierre: PR `ola/fase-5 → master` con la plantilla B, abierta para el usuario. Nada llega a `master` por el PM. Las issues están deshabilitadas en el repositorio: no hay `Closes #N`.

## 6. Primer paso concreto

- `.claude/da/da preflight` limpio, `.claude/da/da verify` verde sobre `master`, y la mecánica de OpenSpec.
- Con eso, la lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager **solo si hay algo que pedir al usuario**. Si no, aviso y arranque.
- Después: la rama, el registro y el primer encargo (grupo 1).
