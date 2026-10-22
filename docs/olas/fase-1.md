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
| #12 | fase-1-cargar-y-ver-el-mes · 2.1–2.4 | `feat/fase-1-month-metrics` | mergeada (`a641f99`) — 0 mecánicas · 1 ronda · 0 por corrección (pasada final con pasada corta del crítico) |
| #10 | fase-1-cargar-y-ver-el-mes · 3.1–3.5 | `feat/fase-1-local-server` | mergeada (`12245de`) — 0 mecánicas · 0 rondas · 0 por corrección (pasada final con pasada corta del crítico) |
| #13 | fase-1-cargar-y-ver-el-mes · 4.1–4.4 | `feat/fase-1-month-dashboard` | mergeada (`d22b5cc`) — 1 mecánica · 0 rondas · 0 por corrección (pasada final con pasada corta del crítico) |
| #14 | fase-1-cargar-y-ver-el-mes · 5.1 | `test/fase-1-main-flow` | mergeada (`7f28c93`) — 1 mecánica · 0 rondas · 0 por corrección (pasada final trivial, sin crítico) |

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

- **Ronda de #12 (clase: juicio del crítico):** BLOQUEA por etiquetas de la gráfica centradas dentro de la barra (default `inside` de ECharts, `node_modules/echarts/lib/label/labelStyle.js:201`), ilegibles en las barras cortas. Corregido con etiquetas a la derecha y margen; verificado por el PM en el instalado antes de devolver.
- **Gráfica de categoría (PR #12):** eje de valores oculto (cada barra trae su monto con R-17), gris base `#64748b` (3:1 sobre blanco), sin `grid.containLabel` (obsoleto en ECharts 6). Descartado: formatear el eje con R-17 (duplica la información de las etiquetas).

- **Relevo de PM (2026-10-16).** El PM entrante tomó el worktree `pm-fase-1` del saliente y siguió por el grupo 4.
- **Devolución mecánica de #13 (clase: captura revisada por el PM):** la columna «Motivo» de la tabla de inválidas salía alineada a la derecha en las filas cortas (regla de celda suelta en `src/cliente/estilos.css`) y la confirmación quedaba pegada al control. Corregido y recapturado antes del commit.
- **Mes y conteo en el cliente (PR #13):** el mes se muestra como «julio de 2026» con los nombres en `src/cliente/textos.ts`, y el número de transacciones con separador de miles es-MX, con su formateador en `src/cliente/presentacion.ts`. R-17 no cubre conteos y el dominio estaba fuera del área del grupo. Descartado: un formateador de conteo en el dominio (cuando el reporte lo necesite, se mueve).
- **#13 sin partir:** el diff ronda 1 050 líneas (la mitad, tests) frente a las ~600 orientativas. Partirlo suponía una sexta PR, por encima del tope de la ola. Descartado: escalar para partir.
- **Descripción accesible de la gráfica (PR #13):** la arma el cliente con `aria.label.description`, textos del catálogo y los formateadores de R-17; `porCategoria` no cambia. Con eso el locale ES de ECharts dejó de observarse y se borró (y con él el import por ruta relativa a `node_modules`). Descartado: armarla en `graficas` (sus palabras son texto visible y viven en `src/cliente/textos.ts`, que `graficas` no puede importar) y dejarla a deuda.
- **Archivo ilegible y carrera de lecturas (PR #13):** un archivo que no se puede leer vuelve al estado inicial con un aviso del catálogo; si dos lecturas terminan en desorden, solo cuenta la última elección. Descartado: a deuda (el analista vería el mes anterior creyendo que es el nuevo).
- **«El archivo no sale del navegador» va a la 5.1 (PR #13):** el escenario de la spec `tablero-del-mes` no tenía prueba (la vigilancia de `sin-red.ts` solo mira el host). La spec de sistema del grupo 5 comprobará además que, tras elegir el archivo, ninguna petición distinta de `GET` sale de la página. Descartado: dejarlo sin prueba.
- **Los NO BLOQUEA de la pasada corta de #13 van a deuda sin otra vuelta** (mismo criterio que en #10).

- **Devolución mecánica de #14 (clase: cita falsa):** el comentario de la spec citaba R-06 como umbral de confirmación; es R-05. Corregido antes del commit.
- **Mutaciones de la 5.1 (PR #14):** las cuatro de `tasks.md` (M1 sin tabla de inválidas, M2 orden inverso, M3 `<link>` a Google Fonts) más M4 (POST del archivo) y M5 (el archivo en la URL de un `GET`), para el escenario «El archivo no sale del navegador». Las aplicó el implementador en su árbol, una a una; el PM corrió `sistema` con cada una; todas fallan en la aserción que protegen y ninguna se commitea.
- **Pasada final de #14 trivial, sin otra pasada del crítico:** solo tocó la spec de sistema; se repitió `sistema` porque esa spec solo corre ahí. Descartado: pasada corta del crítico.

## Deuda

- #12 (anterior a la ola), `eslint.config.mjs:23`: las zonas de capas llevan `./node_modules` en `except`, así que un import de valor de `echarts` o `papaparse` en `src/graficas/` no lo marca el lint; ni el «solo `import type`» de `design.md` D9 ni la fila `graficas → dominio` se hacen cumplir para paquetes. El código de la ola cumple. Fuera del área de los grupos; para un change de mecánica de lint.
- #11, `src/dominio/carga.ts` (`leerRegistros`): las comillas mal puestas se tragan filas sin reportarlas. Una comilla de apertura sin cerrar (`2026-07-01,10,"Pan,X`) absorbe las filas siguientes hasta la próxima comilla, y un valor como `"Pan" rico` absorbe la línea siguiente en el concepto; esas filas no salen ni como transacciones ni como inválidas. Una hoja de cálculo no produce esos archivos. Arreglo posible: rechazar la carga, o marcar inválidas, ante errores `Quotes` de Papa (con su `row` en otra base, ver la línea siguiente).
- #11, `src/dominio/carga.ts:75`: el filtro `error.type === 'FieldMismatch'` no tiene test; los errores de comillas de Papa traen `row` en otra base (cuenta encabezado y líneas vacías), así que sin el filtro una fila con comillas mal puestas marcaría como mal formada otra fila.
- #10, `src/servidor/main.ts:10` y `:28`: el literal `'dist'` aparece dos veces (carpeta servida y archivo cuya fecha decide si se construye); cambiar solo una haría reconstruir en cada arranque sin que ningún test lo note. Arreglo: una constante. Las issues están deshabilitadas en el repositorio: queda aquí.
- #13, `src/cliente/App.tsx` (`alElegir`): el aviso de archivo ilegible (`textos.lecturaFallida`) se muestra para cualquier error que no sea `CargaRechazada`, también uno del dominio, y afirma una causa («revisa que siga en su lugar y que esté descargado») que puede no ser la real; el error no queda en la consola. Arreglo: registrar el error y un texto que no afirme la causa.
- #13: el estado de archivo ilegible no tiene captura (usa el mismo estilo que el rechazo, que sí la tiene).
- #13, detalles visuales: con una sola categoría la barra de la gráfica sale muy alta; «Sin categoría» se parte en dos líneas junto a la marca «Dominante»; tras cargar, el control dice «No file chosen» y la página no muestra el nombre del archivo cargado. La spec no lo pide.
- Mecánica (no producto): en la retoma, el implementador del grupo 5 corrió una vez `npx prettier --version` y el crítico de #14 una vez `npx --no-install eslint`; binarios locales, sin descarga. Pese a la prohibición en el encargo, se repite: candidato a guardia automática.
- Mecánica (no producto): el implementador del grupo 1 corrió una vez `npx prettier --version` (binario local 3.9.10, sin descarga); en los encargos siguientes se prohíbe `npx` también para consultas.

## Se coló

- —

## Lo que queda fuera

- Vigilar WebSockets y peticiones posteriores al cuerpo de la prueba en la suite de sistema (D-TM1): fase 3, con la primera llamada a la API.
- Filtros, historial y su API, las demás gráficas, tabla de transacciones, mapa, hallazgos y exportar (`docs/PLAN.md`, fases siguientes).

## Entorno vivo

- Nada: worktrees de grupo quitados; el del PM (`/home/fabs/da-wt/tablero-gastos/pm-fase-1`) se quita tras abrir la PR de ola. Sin servidores levantados.

## Coste

Salida de `.claude/da/da medir fase-1` (falla igual que en la fase 0; ver *Deuda* de `docs/olas/fase-0.md`):

```
da medir: gh pr list falló -- Unknown JSON field: "closingIssuesReferences"
```

A mano, desde este registro y los veredictos pegados en cada PR:

| PR | Mecánicas | Rondas | Pasadas de crítico |
|---|---|---|---|
| #10 | 0 | 0 | 2 (con pasada corta) |
| #11 | 0 | 0 | 2 (con pasada corta) |
| #12 | 0 | 1 | 3 (con pasada corta) |
| #13 | 1 | 0 | 2 (con pasada corta) |
| #14 | 1 | 0 | 1 |

- Se coló: 0.
- BLOQUEA de código: 1 (#12, etiquetas de la gráfica).
- `sistema` al cierre: 2/2 sobre `7f28c93`.

## Handover

- Sin handover pendiente: ola cerrada. Las 5 PRs internas mergeadas (19/19 casillas); `verify` (402 tests) y `sistema` (2/2) en verde sobre `ola/fase-1` @ `7f28c93`. PR de ola abierta para el usuario contra `chore/fase-1-planning`.
