# Ola fase-1 — Cargar y ver el mes

**Rama:** `ola/fase-1` (desde `chore/fase-1-planning` @ `fc2523b`, apilada sobre `ola/fase-0`) · **Changes:** `fase-1-cargar-y-ver-el-mes` · **Abierta:** 2026-10-16

## Arranque

- `preflight`: 4/4 OK (`gh auth`, remoto y ramas `ola/*`, `openspec`, `graft`).
- `verify` sobre la base (`chore/fase-1-planning` @ `fc2523b`): verde (`format:check`, `lint`, `typecheck`, `test` 166/166, `citas`; enlaces del worktree OK).
- `sistema` sobre la base @ `fc2523b`: verde (`pagina-vacia`). Sin specs heredados inestables.
- `openspec status`: los cuatro artefactos `done`. `instructions apply`: `state: ready`, 0/19, sin `context` ni `operationGuidance`. Leídos los `contextFiles` (proposal, design, tasks y las seis specs).
- Diseño contrastado con el código (2026-10-16): `package.json` sin script `start`; `playwright.config.ts` con `webServer` en `vite preview` sobre `127.0.0.1:4173`; `eslint.config.mjs` con la regla de imports de `tests/sistema/` limitada a `importNames: ['test']` de `@playwright/test`; `tests/fixtures/integridad.test.ts` exige 3 CSV en `tests/fixtures/generador/`; `.gitattributes` solo cubre `tests/fixtures/generador/*.csv`; `src/` solo tiene `cliente/` con el catálogo `textos.ts` de una clave. Coincide con el brief.
- Inventario para el usuario: ninguna instalación ni credencial. Decisión 1 del pre-vuelo (cómo se demuestran las filas inválidas) pendiente del usuario al arrancar; cerrada el 2026-10-16 (ver *Decisiones*).
- Alcanzabilidad: grupos 1 y 3 alcanzables ya; 2 tras 1; 4 tras 1 y 2 (su captura necesita el servidor levantado por el PM); 5 tras 3 y 4 y la decisión 1.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| #11 | fase-1-cargar-y-ver-el-mes · 1.1–1.5 | `feat/fase-1-domain-csv-load` | mergeada (`1ba3b23`) — 0 mecánicas · 0 rondas · 0 por corrección (pasada final con pasada corta del crítico) |
| — | fase-1-cargar-y-ver-el-mes · 2.1–2.4 | `feat/fase-1-month-metrics` | pendiente |
| #10 | fase-1-cargar-y-ver-el-mes · 3.1–3.5 | `feat/fase-1-local-server` | mergeada (`12245de`) — 0 mecánicas · 0 rondas · 0 por corrección (pasada final con pasada corta del crítico) |
| — | fase-1-cargar-y-ver-el-mes · 4.1–4.4 | `feat/fase-1-month-dashboard` | pendiente |
| — | fase-1-cargar-y-ver-el-mes · 5.1 | `test/fase-1-main-flow` | pendiente |

## Decisiones del PM

- **D-TM1 (Team Manager).** Decisión 2 del pre-vuelo: (a), la vigilancia de WebSockets y de peticiones tardías se deja para la fase 3. Descartado: absorberla en el grupo 5.
- **D-TM2 (Team Manager).** Decisión 3: (a), `parsearCsv` lanza `CargaRechazada`, con los añadidos de D4. Descartado: resultado unión (cambia la firma de `docs/ARQUITECTURA.md`).
- **D-TM3 (Team Manager).** Decisión 4: (a), el promedio diario divide entre los días naturales del mes. Descartado: del primer al último día con gasto.
- **D-TM4 (Team Manager).** Decisión 5: (a), `npm start` construye solo si falta o está viejo. Descartado: construir siempre.
- Las cuatro coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.
- **Decisión 1 del pre-vuelo (usuario, 2026-10-16, vía Team Manager): (a).** La prueba de sistema añade en memoria tres filas inválidas al fixture `2026-07`; en la demo manual ese fixture muestra «0 inválidas» y uno hecho a mano muestra la lista. No se tocan el PLAN ni el generador. Descartadas: (b) copia estropeada del fixture, (c) cambiar el generador. Coincide con `design.md` D11.
- **Grupos 1 y 3 en paralelo** desde el arranque, en worktrees disjuntos (1: `src/dominio/`, `tests/dominio/`, `tests/fixtures/a-mano/`, `.gitattributes`; 3: `src/servidor/`, `tests/servidor/`, `package.json`, `.gitignore`, `.prettierignore`, `eslint.config.mjs`, `playwright.config.ts`, `tests/arquitectura/sistema.test.ts`). Revisión y merge en serie. Descartado: en serie (el grafo declara el 3 independiente).

- **Mutación `localhost` del test de dirección aceptada como equivalente** (PR #10): en esta máquina `localhost` resuelve solo a `127.0.0.1`, el test fija `address` y `family` y falla con `0.0.0.0`; el crítico lo confirmó. Descartado: un test que afirme el texto de la constante (no vale, `CLAUDE.md` TDD 6).
- **Ids generados (R-02):** se ordenan por día y hora, una fila sin hora cuenta como inicio de su día, empate estable por orden de archivo, y se saltan todos los ids del archivo, también los de filas inválidas (PR #11). Descartado: sin hora al final del día.
- **NO BLOQUEA de #10 corregidos en la pasada final con pasada corta** (lectura de fechas a módulo probado, aviso del navegador, `_baseTest` e `import()` dinámico en la regla de la suite). Descartado: a deuda; tocaban la guarda de «una fuente cambió» y de la vigilancia de red.
- **El NO BLOQUEA de la pasada corta de #10 va a deuda sin otra vuelta** (mismo criterio que la fase 0). Descartado: otra pasada por un hallazgo que sale de la propia pasada corta.
- **`gh pr edit` falla con este `gh`** («Projects (classic) is being deprecated»): el cuerpo al mergear se edita con `gh api -X PATCH repos/<repo>/pulls/<n> -F body=@cuerpo.md`.

- **«Fila mal formada» (PR #11):** una fila con más o menos campos que el encabezado es inválida con el código `fila-mal-formada`, comprobado antes que las obligatorias vacías. Lo destapó el crítico: un monto `1,234.50` sin comillas entraba válido como 1. `design.md` D4/D6 y la spec `carga-de-csv` (escenario en R-05) por `openspec-update-change`. Consecuencia aceptada: una fila que omite los separadores de las opcionales finales también es mal formada (ni el generador ni una hoja de cálculo lo hacen). Descartado: dejarlo a deuda (el analista vería montos falsos sin aviso).
- **Numeración de filas con líneas vacías intermedias (PR #11):** se mantiene D6 literal, cada registro de datos suma 1 y las líneas vacías no cuentan. Descartado: contar las líneas vacías como en la hoja de cálculo (D6 dice también «sin líneas vacías»).
- **Delimitador autodetectado por Papa (PR #11):** se queda; un CSV con `;` carga bien y uno ambiguo acaba en un rechazo visible. Descartado: fijar `,`.

## Deuda

- #11, `src/dominio/carga.ts` (`leerRegistros`): las comillas mal puestas se tragan filas sin reportarlas. Una comilla de apertura sin cerrar (`2026-07-01,10,"Pan,X`) absorbe las filas siguientes hasta la próxima comilla, y un valor como `"Pan" rico` absorbe la línea siguiente en el concepto; esas filas no salen ni como transacciones ni como inválidas. Una hoja de cálculo no produce esos archivos. Arreglo posible: rechazar la carga, o marcar inválidas, ante errores `Quotes` de Papa (con su `row` en otra base, ver la línea siguiente).
- #11, `src/dominio/carga.ts:75`: el filtro `error.type === 'FieldMismatch'` no tiene test; los errores de comillas de Papa traen `row` en otra base (cuenta encabezado y líneas vacías), así que sin el filtro una fila con comillas mal puestas marcaría como mal formada otra fila.
- #10, `src/servidor/main.ts:10` y `:28`: el literal `'dist'` aparece dos veces (carpeta servida y archivo cuya fecha decide si se construye); cambiar solo una haría reconstruir en cada arranque sin que ningún test lo note. Arreglo: una constante. Las issues están deshabilitadas en el repositorio: queda aquí.
- Mecánica (no producto): el implementador del grupo 1 corrió una vez `npx prettier --version` (binario local 3.9.10, sin descarga); en los encargos siguientes se prohíbe `npx` también para consultas.

## Se coló

- —

## Lo que queda fuera

- —

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm-fase-1` (`ola/fase-1`).

## Coste

- —

## Handover

- —
