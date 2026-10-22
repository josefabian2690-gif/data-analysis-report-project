# Ola fase-3 — Historial y comparación

**Rama:** `ola/fase-3` · **Changes:** `fase-3-historial-y-comparacion` · **Abierta:** 2026-10-17

## Arranque

- Base: `chore/fase-3-planning` @ `75580f6` (sobre `ola/fase-2` @ `b19bb40`), por avance continuo del usuario; la PR de ola apunta a `chore/fase-3-planning`. Rama principal: `master`. Nadie mergea a `master` ni las PRs de la cadena (#3, #4, #8, #9, #15, #16, #23, #24).
- `preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft). `ola/fase-2` está en espera de merge (PR #23), no activa.
- `verify` sobre la base (`75580f6`): format:check, lint, typecheck, test y citas OK; 578 tests en 41 archivos.
- `sistema` sobre la base (`75580f6`): 3/3 (`flujo-principal`, `dashboard-filtrado`, `pagina-vacia`). Sin specs heredados inestables. Tras la corrida, `git status --ignored` del worktree no muestra `historial/`.
- OpenSpec: `fase-3-historial-y-comparacion`, `state: ready`, 0/17, sin `context` ni `operationGuidance`. Leídos proposal, design, tasks y los cinco deltas.
- `design.md` contrastado con el código: `esquema.ts:5-31`, `fecha.ts:13` y `:18`, `formato.ts:9-22`, `config.ts:24`, `static-server.ts:48-50`, `App.tsx:26-70`, `playwright.config.ts`, `tests/preparar-cliente.ts`, `flujo-principal.spec.ts:89-98`, `sin-red.ts:17-27`, 12 archivos y 37 montajes de `<App` en `tests/cliente/`; todo como dice. Cifras de los fixtures recalculadas por el PM con `csv` y `Decimal` de Python, fuera del tablero: totales 1 689 470.67, 1 544 622.78 y 1 278 296.56 (2 000 filas cada uno); Compras 814 566.30 / 201 746.52 / 197 076.86; Entretenimiento 258 692.09 / 847 205.02 / 164 574.61; Comida 260 686.59 / 172 038.57 / 693 983.87.
- Alcanzabilidad: el grupo 4 necesita la API servida por `npm start` (grupo 2); la spec del grupo 5 arranca `node dist-server/main.mjs`, que construye el script `start` del `webServer`. Nada inalcanzable.
- Nada que pedir al usuario: ninguna dependencia, credencial ni `[PENDIENTE]`; las decisiones 1 y 2 del pre-vuelo ya las confirmó el usuario.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| #25 | `fase-3-historial-y-comparacion` · 1.1–1.3 | `feat/fase-3-domain-schema-compare` | mergeada — 0 mecánicas · 1 ronda · 0 por corrección (+ pasada final de comentarios con pasada corta) |
| #27 | `fase-3-historial-y-comparacion` · 2.1–2.4 | `feat/fase-3-server-history-api` | mergeada — 0 mecánicas · 0 rondas · 0 por corrección (+ pasada final trivial, solo tests) |
| #26 | `fase-3-historial-y-comparacion` · 3.1–3.2 | `feat/fase-3-charts-compare` | mergeada — 0 mecánicas · 1 ronda · 0 por corrección (+ pasada final con pasada corta y una línea trivial) |
| #28 | `fase-3-historial-y-comparacion` · 4.1–4.4 | `feat/fase-3-client-save-history` | mergeada — 1 mecánica (PM: capturas ajenas) · 1 ronda · 0 por corrección (+ pasada final con pasada corta) |
| #29 | `fase-3-historial-y-comparacion` · 5.1–5.4 | `feat/fase-3-client-compare-system` | mergeada — 0 mecánicas · 1 ronda · 0 por corrección (pasada final: sin hallazgos) |

## Decisiones del PM

- **Decisión 1 del pre-vuelo (usuario, 2026-10-17): (a).** Guardado automático al aceptar la carga; si el mes ya existe (409), se pregunta sin ocultar el tablero. Descartado: botón «Guardar en el historial». Coincide con `design.md` D7.
- **Decisión 2 del pre-vuelo (usuario, 2026-10-17): (a).** La página lista y compara; borrar solo por la API. Descartado: borrar, o borrar y abrir un mes guardado, desde la página.
- **D-TM1 (Team Manager), decisión 3: (a).** `comparar` admite N meses, cada uno contra el anterior; la página compara dos, por defecto los dos más recientes. Descartado: mostrar todos los meses a la vez.
- **D-TM2 (Team Manager), decisión 4: (a).** Entran las peticiones tardías de la vigilancia, la marca de post-quincena de R-13 y una sola `conDescripcion`. Descartado: dejar la marca como deuda.
- **D-TM3 (Team Manager), decisión 5: (a).** Una sola ola de 5 PRs, con el grupo del servidor en ~800 líneas. Descartado: dos olas.
- Las cinco coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.
- **Ronda de #25 (clase: juicio del crítico):** ningún test cambiaba el `mes` de `leerMesGuardado`; el mutante «validar contra el mes de la primera transacción» sobrevivía. En la misma ronda entraron tres NO BLOQUEA de código (`slice(0, 7)`, `CAMPOS` atado a `keyof Transaccion`, tests de `latitud: 0` y de una lista real de `parsearCsv`).
- **Fila del total de `Comparacion` con `nombre: 'Total'` (PR #25):** se queda como clave de datos; los grupos 4 y 5 toman el rótulo de `src/cliente/textos.ts` y no pintan `total.nombre`. Descartado: dejar `nombre` vacío en el dominio.
- **Pasada final de #25 con pasada corta del crítico:** solo comentarios, pero en archivos de producto (§2.10, salida (a)); se repitió `sistema`.
- **Grupos 2 y 3 en paralelo** tras #25, en worktrees disjuntos (`f3-g2`: `src/servidor/`, `tests/servidor/`; `f3-g3`: `src/graficas/`, `tests/graficas/`). Revisión y merge en serie: #27 primero (LISTA a la primera); #26 se rebasa sobre ella antes de mergear. El grupo 4 no se lanza hasta mergear #26, para que el relevo de las 3 PRs caiga en frontera limpia. Descartado: lanzar el 4 con #26 en ronda (dejaría un implementador en vuelo en el relevo).
- **Capturas del grupo 3 contra `npm run dev` del worktree** (`127.0.0.1:5173`, con candado), levantado solo mientras el implementador capturaba; el par antes/después de la misma corrida con recarga en caliente.
- **API del grupo 2 (PR #27):** `readConfig(env, root)` da `historyDirectory`; `startStaticServer({ directory, port, api? })` con la API opcional para no tocar `tests/servidor/static-server.test.ts`; almacén con `writeFile` inyectable solo para provocar el fallo de escritura; límite de 64 MB inyectable (`maxBodyBytes`). `total` de la lista sin redondear (`metricas(tx).gastoTotal`, el mismo número que el KPI); los tests lo comparan con `toBeCloseTo(…, 2)`. Descartado: redondear el total en el servidor (el redondeo es solo al mostrar, *Casos borde*).
- **`Host` estricto (PR #27):** solo `127.0.0.1:<puerto>` y `localhost:<puerto>` en minúsculas; `[::1]` y `LOCALHOST` dan 403. Aceptado con el crítico: el servidor no escucha en `::1` y los navegadores mandan el host en minúsculas.
- **Mutante «sin `sort`» de la lista (PR #27):** equivalente en Linux (libuv ordena `scandir`); aceptado con el crítico.
- **Pasada final de #27 trivial, sin otra pasada del crítico:** solo tests unitarios; `sistema` no se repitió (código de producto idéntico a `e7d1e61`).
- **Ronda de #26 (clase: juicio del crítico):** el test nuevo de la marca solo comparaba `symbolSize` y pasaba con la marca vieja y con puntos invisibles. El defecto real era la fila `[0]` de `dashArrayX`, que colapsa la losa a 1 px (`node_modules/echarts/lib/util/number.js:677-685`). Se sustituyó por `tests/graficas/cobertura-de-marca.ts`, que renderiza el `decal` con ECharts SSR a SVG y mide la losa y sus figuras; el crítico lo juzgó válido (falla con la losa colapsada y con puntos espaciados, pasa con un patrón más visible, y falla con ruido si cambia el formato del SVG). Descartado: borrar el test y dejar solo la captura (salida que D12 permitía).
- **Marca de post-quincena (PR #26):** círculos de tamaño completo, 4 px cada 8 px, filas escalonadas (`dashArrayX: [[4,4],[0,4,4,0]]`, `dashArrayY: [4,2]`). Descartado: otra rotación de rayas (se confundiría con quincena y pre-quincena).
- **`porComparacion(c, rotulos)` (PR #26):** `rotulos: Record<'AAAA-MM', string>`; lanza si falta el rótulo de un mes o si la comparación no es de dos meses; primer mes gris liso, segundo azul con rayas diagonales; la fila del total no entra. Descartado: respaldo con el `AAAA-MM` (texto visible fuera del catálogo) y estilos cíclicos para más meses.
- **Pasada final de #26:** `7b0b827` con pasada corta del crítico (tocó un comentario de producto); `cfb42cc`, una línea de comentario de un ayudante de tests, trivial y revisada por el PM; `sistema` sobre `7b0b827`, código de producto idéntico en `cfb42cc`.
- **Permalinks de capturas de #26** apuntan a `1db248b`, el commit de capturas tras el rebase sobre #27.
- **Relevo de PM (2026-10-17)** tras #26: el PM entrante retomó por §1b sin discrepancias entre registro y PRs. Un corte por límite de uso de la API (HTTP 429) detuvo al crítico de #28 a mitad de la pasada 2; se reanudó la misma instancia (no lo paró el usuario).
- **Ronda de #28 (clase: juicio del crítico):** dos BLOQUEA de código: cargar un CSV con la vista «Historial» abierta dejaba oculto el resumen y el tablero (contradice «Resumen de validación» y R-05 de `tablero-del-mes`); y el `fetch` global que rechaza no hacía fallar un test que olvidara el historial falso (el cliente convierte el rechazo en aviso). Corregidos en la misma ronda junto con dos NO BLOQUEA de código (pregunta de R-09 con la caja de R-05 y vistas como control segmentado; nombre de un test).
- **Devolución mecánica del PM en #28:** al mover `imgs/screenshots/pendiente/` a `28/` el PM arrastró seis capturas de la fase 1 que estaban en esa carpeta del worktree; el crítico lo marcó BLOQUEA y el PM las quitó en un commit solo de `imgs/`. A partir de aquí, el PM lista la carpeta antes de moverla.
- **Vistas de la página (PR #28):** «Tablero del mes» e «Historial», un control segmentado con `aria-pressed`; las dos vistas quedan montadas y la oculta lleva `hidden` (sale del árbol accesible y conserva el filtro). Una carga aceptada, o el confirmar de R-05, vuelve al tablero. Rechazo, archivo ilegible, confirmación de R-05 y el aviso de guardado van fuera de las vistas. Descartado: desmontar la vista oculta (perdía el filtro).
- **Guardado (PR #28):** se lanza desde los manejadores (al terminar la lectura o en el confirmar de R-05), nunca desde un efecto, para que `StrictMode` no haga dos `PUT`. La lista se recarga tras guardar o reemplazar aunque la respuesta sea de una elección vieja (el servidor sí cambió); el aviso solo cambia si es la última elección.
- **Tests de componente sin red (PR #28):** `tests/cliente/red-prohibida.ts` + `tests/preparar-cliente.ts`: el `fetch` global rechaza y anota; un `afterEach` falla si hubo alguna llamada. `main.test.tsx` y `main-historial.test.tsx` ponen su propio `fetch` porque montan `main.tsx` con el cliente real.
- **Carpeta del historial de la suite (PR #28):** `playwright.config.ts` crea con `mkdtemp` una carpeta por corrida en la primera evaluación, la anota en `TABLERO_HISTORIAL_SISTEMA` (los workers la heredan) y la borra al salir. NO BLOQUEA aceptado sin acción con el crítico: en `--ui`/watch el proceso principal reutilizaría la carpeta sin vaciarla; la mecánica corre la suite con `da sistema`, un proceso nuevo por corrida.
- **Comprobación de «el archivo no sale del navegador» (PR #28):** se buscan las líneas crudas del CSV (encabezado incluido) en cada cuerpo y URL, no ids ni conceptos, que el `PUT` lleva legítimamente como campos. El PM corrió la mutación «el concepto de la primera transacción del `PUT` es el texto del archivo»: `flujo-principal` en rojo con «peticiones que llevan el encabezado o una línea del archivo».
- **Pasada final de #28:** `6cd16a4` con pasada corta del crítico (tocó `AvisoDeGuardado.tsx`, `estilos.css` y un comentario de producto); `sistema` 3/3 sobre `6cd16a4`; la punta `11b1a4b` solo rehace una captura.
- **Relevo de PM (2026-10-21)** con #29 abierta y sin veredicto: el PM entrante retomó por §1b; las PRs mandaron sobre el *Handover* (decía 9/17 y el grupo 4 pendiente; #28 ya estaba mergeada). No quedaba implementador ni crítico vivo; se relanzaron instancias nuevas (nadie los paró).
- **Ronda de #29 (clase: juicio del crítico):** la gráfica de la comparación solo rotulaba una categoría de cada dos (ECharts oculta rótulos y no hay tooltip): Compras, Comida, Salud, Vivienda y Suscripciones no se leían. Corregido con `rotulosCompletos: true` en `src/graficas/por-comparacion.ts` y su test. En la misma ronda, un NO BLOQUEA de código: test de reemplazar desde la pregunta del 409 sin salir de Historial (la dependencia `meses` del efecto no la protegía nada).
- **Corrección de #29 en `src/graficas/` dentro de la PR del grupo 5:** el requisito «Gráfica de la comparación» es de este change y su captura es de 5.2; declarado en el triage y visto por el crítico. Descartado: una PR `fix/…` aparte antes del cierre (un ciclo más para una línea).
- **Rótulos «Mes base» / «Mes a comparar» (NO BLOQUEA de #29, aceptado sin acción con el crítico):** con la base posterior al comparado, la tabla va igual en orden cronológico (R-15) y el título lo dice; D9 nombra así los selectores. Descartado: rótulos neutros («Un mes» / «Otro mes»), que es cambio de diseño.
- **Caché de un 404 en `src/cliente/meses-pedidos.ts` y calma de 1 s en `tests/sistema/sin-red.ts` (NO BLOQUEA de #29):** aceptados sin acción con el crítico (una pestaña, un usuario; D11 solo exige esperar con tope).
- **Captura de #29 con la pregunta del 409 a la vista** (`comparacion-julio-agosto-despues.png`, el guion cargó agosto dos veces): aceptada como contexto honesto, NO BLOQUEA del crítico sin acción.
- **Evidencia de #29:** `verify` y `sistema` 4/4 sobre `cdfd50a`; la punta `4792223` solo rehace dos capturas; mutaciones M-a a M-d de 5.3 y 5.4 corridas por el PM anterior sobre `c0a1df2`.

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- Mecánica (no producto): en los worktrees montados, `.claude/da/da` queda con modo 644 y `da en <wt> -- .claude/da/da citas` falla con `EACCES`; se corre `node .claude/da/da citas`. Candidato a arreglo del gancho `preparar`.
- Mecánica (no producto): el crítico de #27 restauró un mutante una vez con `git checkout --` (escritura de git que no le toca); el archivo quedó igual a `e7d1e61`. En los encargos siguientes se le pide restaurar desde copias.
- Mecánica (no producto): el PM corrió una vez `npx --version` por error al commitear el registro de arranque (binario local, sin descarga).
- Mecánica (no producto): `.claude/da/da medir fase-3` falla con `gh` 2.46.0 (`Unknown JSON field: "closingIssuesReferences"`) y deja las tablas en cero; el *Coste* de esta ola no tiene cifras de la herramienta.

## Se coló

- —

## Lo que queda fuera

- Mapa, hallazgos (R-16), exportar, abrir un mes guardado en el tablero, borrar desde la página, comparar con filtros (`docs/PLAN.md`, fase 3; decisión 2).
- WebSockets en la vigilancia, `Grafica.tsx` que recrea ECharts, CSS y rejilla, y la deuda de la fase 1 (D-TM2).

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-3`), se conserva hasta el merge de la PR de ola por si hay que corregir. Sin worktrees de grupo, sin servidores, sin implementadores ni críticos en vuelo.

## Coste

Salida de `.claude/da/da medir fase-3`, tal cual (falló la consulta a `gh`; ver *Deuda*):

```
da medir: gh pr list falló -- Unknown JSON field: "closingIssuesReferences"
```

### Mecánica

| Métrica | Valor |
| --- | --- |
| PRs a GitHub | 0 |
| Merges a main — cierre o arreglo | 0 |
| Merges a main — planeación y archivado | 0 |
| Horas de espera (promedio) — cierre o arreglo | 0.0 |
| Horas de espera (promedio) — planeación y archivado | 0.0 |
| Corridas de evidencia | 0 |
| Pasadas de crítico | 0 |
| BLOQUEA en veredictos | 0 |
| NO BLOQUEA en veredictos | 0 |

### Trabajo

| PR | Caché leída/línea (producto) | Horas/línea (producto) | Caché leída/línea (test) | Horas/línea (test) |
| --- | --- | --- | --- | --- |

### Guardas

| Guarda | Valor |
| --- | --- |
| Se coló | ninguno (ver *Se coló*) |
| BLOQUEA de código | rondas por juicio del crítico en #25, #26, #28 y #29; #27 LISTA a la primera |
| sistema al cierre | 4/4 sobre `64843f7` |

## Handover

- **Estado estable:** ola cerrada. Cinco PRs internas mergeadas (#25, #27, #26, #28, #29) a `ola/fase-3`; OpenSpec 17/17; `verify` (849 tests) y `sistema` 4/4 sobre `64843f7`.
- **Hecho:** grupos 1 a 5; PR de ola abierta contra `chore/fase-3-planning`.
- **Lo que queda en orden:** merge del usuario de la cadena; después, el Archivador (`team-manager` §7).
- **Avisos para los encargos:** los del relevo anterior siguen valiendo para un `fix/…` sobre esta ola.
- **Pendiente con el Team Manager o el usuario:** confirmar o revertir las decisiones en la PR de ola.
- **Por qué paro:** misión cumplida (cierre, §5).
