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
| #26 | `fase-3-historial-y-comparacion` · 3.1–3.2 | `feat/fase-3-charts-compare` | en revisión (ronda 1 corregida en `569f56a`, pasada 2 del crítico en curso) |
| — | `fase-3-historial-y-comparacion` · 4.1–4.4 | `feat/fase-3-client-save-history` | pendiente |
| — | `fase-3-historial-y-comparacion` · 5.1–5.4 | `feat/fase-3-client-compare-system` | pendiente |

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

## Deuda

Issues deshabilitadas en el repositorio: la deuda vive aquí y en la PR de ola.

- Mecánica (no producto): en los worktrees montados, `.claude/da/da` queda con modo 644 y `da en <wt> -- .claude/da/da citas` falla con `EACCES`; se corre `node .claude/da/da citas`. Candidato a arreglo del gancho `preparar`.
- Mecánica (no producto): el crítico de #27 restauró un mutante una vez con `git checkout --` (escritura de git que no le toca); el archivo quedó igual a `e7d1e61`. En los encargos siguientes se le pide restaurar desde copias.
- Mecánica (no producto): el PM corrió una vez `npx --version` por error al commitear el registro de arranque (binario local, sin descarga).

## Se coló

- —

## Lo que queda fuera

- Mapa, hallazgos (R-16), exportar, abrir un mes guardado en el tablero, borrar desde la página, comparar con filtros (`docs/PLAN.md`, fase 3; decisión 2).
- WebSockets en la vigilancia, `Grafica.tsx` que recrea ECharts, CSS y rejilla, y la deuda de la fase 1 (D-TM2).

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm` (`ola/fase-3`).

## Coste

- —

## Handover

- —
