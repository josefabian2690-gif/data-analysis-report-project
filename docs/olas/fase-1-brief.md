# Brief — Ola fase-1 «Cargar y ver el mes»

Eres el **project manager** de la Ola fase-1 de tablero-gastos. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- **Base: `chore/fase-1-planning` sobre `ola/fase-0`, por petición del usuario, 2026-10-15 (avance continuo, sin merges a master).**
  - Verificado contra `ola/fase-0` @ `21673cc`.
  - `ola/fase-1` sale de la punta de `chore/fase-1-planning` y su PR de ola apunta a `chore/fase-1-planning`.
  - Registro: `docs/olas/fase-1.md`.
- **Pila de PRs abiertas:**
  - #3: planeación de la fase 0, contra `master`
  - #8: ola de la fase 0, contra la rama de #3
  - la PR de planeación de esta ola, contra `ola/fase-0`
  - #4: el `[PENDIENTE]` de fixtures de `docs/PLAN.md`, que se trata como cerrado (3 fixtures de ~2 000 filas, semillas 1 a 3)
  - La rama principal es `master`, no `main`. Nadie mergea a `master` salvo el usuario.
- **Change:** `fase-1-cargar-y-ver-el-mes`, ya propuesto y refinado; lo tomas, no lo reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable: `openspec-update-change` y registro.
- **Entregable:** `npm start` construye lo que falte, sirve el bundle escuchando solo en 127.0.0.1 y abre el navegador. Al elegir un CSV se ven:
  - el rechazo, o el resumen de validación con las filas inválidas (fila y motivo);
  - la confirmación si las inválidas superan el 5 %;
  - los cinco KPIs en MXN;
  - el gasto por categoría, con la dominante primero y destacada.
  
  La suite de sistema recorre ese flujo contra `npm start`.
- **Reglas de la fase:** nada de filtros, historial, API ni otras gráficas que la de categoría; **ninguna dependencia nueva**; `generador/` y `tests/fixtures/generador/` no cambian.
- **PRs internas: 5**, una por grupo, cada una de unas 600 líneas de diff o menos.
  - Grafo: 1 → 2 → 4 → 5.
  - El 3 es independiente de 1, 2 y 4 (no importa el dominio; toca `src/servidor/`, `tests/servidor/`, la raíz y la configuración de la suite) y va antes del 5.
  - Paralelo declarado: el 3 junto a la cadena 1 → 2 → 4. Revisión y merge en serie.
  - La ola está en el tope de 5: si un grupo hay que partirlo, escala al Team Manager antes.
- No se empieza la fase 2.

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4. Los encargos de dominio citan `docs/DOMINIO.md` (R-01 a R-08, R-11, R-12, R-17 y *Casos borde*), que sí leen los implementadores.
3. Los artefactos del change por la mecánica de OpenSpec. `instructions apply` devuelve `state: ready`, 0/19, **sin** `context` ni `operationGuidance` (comprobado el 2026-10-16).
4. `docs/olas/fase-1-revision.md` (hallazgos y decisiones del pre-vuelo) y `docs/olas/fase-0.md`, *Deuda* y *Decisiones del PM*.
5. Guardas que no se ablandan:
   - `tests/arquitectura/` (capas, pureza, imports de la suite)
   - `tests/fixtures/integridad.test.ts`
   - `tests/sistema/` (vigilancia de `sin-red.ts`, `pagina-vacia.spec.ts`)
   - los tests R-xx que cada grupo deja en verde

## 3. Reglas de la fase que mandan en cada PR

- **Decisiones del pre-vuelo** (`docs/olas/fase-1-revision.md` §7), escritas en el change con la recomendación:
  1. Las filas inválidas del flujo de sistema se añaden en memoria al fixture de semilla (D11). No se commitea ninguna copia del fixture ni se toca el generador.
  2. WebSockets y peticiones tardías quedan fuera de esta ola (D11).
  3. El rechazo es `CargaRechazada`, lanzada (D4).
  4. El promedio diario divide entre los días naturales del mes (D7).
  5. `npm start` construye «si falta o está viejo» (D2).

  Si el Team Manager te comunica otra cosa, manda lo suyo y se pasa por `openspec-update-change`.
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `parsearCsv(texto): ResultadoCarga` y `metricas(tx): Metricas` con esa firma exacta. Los únicos añadidos son los de D4 (`CargaRechazada`, `pideConfirmacion`, motivo como código cerrado). Cualquier otro cambio de firma se escala.
- **Regla innegociable 2:** el host del servidor es la constante `127.0.0.1`, sin variable que lo cambie. Un servidor que escuche en otra interfaz, aunque sea para que el navegador de Windows llegue, es BLOQUEA.
- **Textos visibles** solo en `src/cliente/textos.ts`. Las pruebas buscan por rol y nombre accesible del catálogo. Los motivos de fila y de rechazo son códigos del dominio con su texto en el catálogo (D4).
- **Las cifras de la prueba de sistema son literales** (`$1,689,470.67`, 2 000, la categoría del `*.esperado.json`). Una prueba de sistema que calcula lo esperado llamando al dominio es tautológica y no vale (`CLAUDE.md`, *Test driven development* 6).
- **Comentarios:** ninguno cita `openspec/changes/`. Si el porqué de D1 (Vite para el servidor) o de D6 hace falta en el código, se escribe entero.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-16)

- **Grupo 1 — Dominio: esquema y carga del CSV** (`implementador`)
  - **Partida:** no existe `src/dominio/` ni `tests/dominio/`. El lint de pureza ya aplica a `src/dominio/**` (`eslint.config.mjs:67-80`): prohíbe `node:*`, `fetch`, `process`, `Date.now()`, `new Date()` sin argumentos e `import.meta`, y permite `new Date('…')`. `dominio` puede importar `papaparse` (`tests/arquitectura/capas.test.ts:125-132`). `@types/papaparse` 5.5.2 está instalado.
  - **Fixtures del generador:**
    - Cabecera exacta: `id_transaccion,fecha,monto,concepto,categoria,cuenta,zona,latitud,longitud`.
    - Fines de línea `\r\n`, sin BOM, fechas con hora, zonas entrecomilladas con coma (`"Centro Histórico, CDMX"`).
    - Los tres tienen 2 000 filas y **0 inválidas** (comprobado).
    - El de `2026-07` suma `1689470.67`.
  - **Fixtures a mano:** van en `tests/fixtures/a-mano/`, nunca en `tests/fixtures/generador/`, porque `tests/fixtures/integridad.test.ts:95` exige exactamente 3 CSV ahí. `.gitattributes` hoy solo tiene `tests/fixtures/generador/*.csv -text`. La ruta es del área `generador` en el perfil; el encargo la nombra como parte del grupo.
  - **Trampas:**
    - las fechas se validan sin `Date` con zona horaria;
    - el número de fila cuenta el encabezado como 1;
    - el id repetido se decide entre filas que pasaron fecha y monto;
    - el orden completo está en D6.
  - **Guarda:** cada test nombra su `R-0x` (regla innegociable 5).
  - **Skills de área:** `typescript-advanced-types`, `vitest`, `javascript-testing-patterns` (instalados).
- **Grupo 2 — Métricas, formato y `porCategoria`** (`implementador`; toca también `src/graficas/`)
  - **Partida:** no existe `src/graficas/`. `graficas` solo puede importar de `dominio` (`eslint.config.mjs:8-14`). Del paquete `echarts` solo `import type` (`EChartsOption`), para que la capa siga pura.
  - **Formato comprobado en Node 22.22.1 (ICU 78.2):**
    - `Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN'})` → `$12,345.68`, `$900.00`, `$10.13`
    - porcentaje con un decimal → `48.2%` (sin espacio)
  - **Cifras del fixture `2026-07-semilla-1`:** Compras 48.2 %, Comida 15.4 %, Entretenimiento 15.3 %. En los otros: `2026-08` Entretenimiento 54.8 %; `2026-09` Comida 54.3 %.
  - **Skills:** `typescript-advanced-types`, `vitest`.
- **Grupo 3 — Servidor y `npm start`** (`implementador-servidor`)
  - **El Node de la máquina no ejecuta TypeScript:** `/usr/bin/node` 22.22.1 da `process.features.typescript === false`, y `node x.ts` falla con `ERR_UNKNOWN_FILE_EXTENSION`, también con `--experimental-strip-types`. No hay `tsx`.
  - **Mecanismo verificado (D1):** Vite 8.3.4 con `build.ssr` sobre una entrada `.ts` emite `<nombre>.mjs` (sin `"type"` en `package.json`), que importa `node:http`, `open` y Papa Parse y corre.
    - El bundle del servidor va en una carpeta que `vite build` del cliente (que vacía `dist/`) no borra.
    - Esa carpeta va en `.gitignore`, `.prettierignore` y los `ignores` de `eslint.config.mjs:42-55`.
  - **Proyecto sin `"type": "module"`** (`docs/olas/fase-0.md`, *Decisiones del PM*): no se añade, rompe `.claude/da/da`.
  - **Scripts de `package.json`:** hoy no hay `start` (`package.json:7-15`). Sin `npx`; los binarios desde `node_modules/.bin`.
  - **`open` 11.0.4** es solo ESM y en WSL abre con `powershell.exe` (`node_modules/open/index.js:107-148`). Quien abre se inyecta: el test con `TABLERO_SIN_NAVEGADOR=1` comprueba que no se llama, sin lanzar navegadores.
  - **El implementador no puede correr `npm start` ni la suite** (comando pesado). Prueba el servidor en `tests/servidor/` con puerto 0 y carpeta temporal. `npm start` y `.claude/da/da sistema` los corres tú tras 3.3 y 3.4.
    - `.claude/da/da sistema` corre `npm run build` antes (perfil, `modulos.suiteDeSistema.preparar`), así que `npm start` debe encontrar el bundle al día.
  - **Playwright hoy:** `webServer` = `./node_modules/.bin/vite preview` en `http://127.0.0.1:4173` (`playwright.config.ts:3-14`). Pasa a `npm start` con `TABLERO_SIN_NAVEGADOR=1` y `TABLERO_PUERTO=4173`.
  - **Regla de lint (3.5):** hoy en `eslint.config.mjs:81-98`, `importNames: ['test']`, solo `@playwright/test`. Sus tests en `tests/arquitectura/sistema.test.ts` montan un árbol temporal y lintan con la configuración real; los casos nuevos van ahí.
  - **Skills:** `typescript-advanced-types`, `vitest`, `nodejs-backend-patterns` (para errores y estáticos; sin framework).
- **Grupo 4 — Cliente** (`implementador-cliente`)
  - **Partida:**
    - `src/cliente/App.tsx` es un `<main>` con el `<h1>` del título;
    - `src/cliente/main.tsx` pone `document.title` desde `textos.titulo`;
    - `src/cliente/textos.ts` solo tiene `titulo`;
    - `tests/sistema/pagina-vacia.spec.ts` busca ese encabezado por nombre exacto: mantenlo.
  - **Entorno de tests:** jsdom 29 con `tests/preparar-cliente.ts` (`vite.config.mts:12-18`).
  - **ECharts en jsdom (verificado):** `canvas` falla (`Cannot set properties of null (setting 'dpr')`); `svg` funciona y pone `aria-label`, con avisos «Not implemented: HTMLCanvasElement's getContext()» que no son fallos. Renderizador SVG (D10). Las pruebas afirman la lista accesible por categoría, no el dibujo.
  - **Lectura del archivo:** `File.text()` quita el BOM al decodificar; el dominio también lo tolera.
  - Es el área `visual` del perfil: captura del tablero con el fixture `2026-07-semilla-1`.
  - **Skills:** `typescript-advanced-types`, `vitest`, `vercel-react-best-practices`, `javascript-testing-patterns`.
- **Grupo 5 — Flujo de sistema** (`implementador-cliente`)
  - **Arranca con el 3 y el 4 mergeados**, la regla de 3.5 incluida.
  - Importa `test` de `./sin-red`.
  - Las tres filas inválidas se añaden en memoria y se suben con `setInputFiles({ name, mimeType, buffer })`:
    - monto `0`;
    - un id ya usado, con datos válidos de julio;
    - una fecha de agosto.
    
    Quedan en las filas 2002 a 2004: 3 de 2 003 filas, por debajo del 5 %, así que no hay confirmación.
  - **Mutaciones** (las aplica el implementador en su árbol y las corres tú con `.claude/da/da sistema`, como en la fase 0, #6):
    - el cliente no lista las inválidas;
    - otra categoría primero;
    - un `<link>` a una fuente externa.
  - **Skills:** las del grupo 4.

## 5. Mecánica de esta fase

- **Base de la ola:** `chore/fase-1-planning` sobre `ola/fase-0` (avance continuo pedido por el usuario el 2026-10-15; la PR de ola de la fase 0 es la #8). De ahí sale `ola/fase-1` y a ahí apunta su PR. Cuando el usuario mergee la pila, el Team Manager hará rebasar y reapuntar.
- **`master` frente a `main`:**
  - `.claude/da/da worktree montar` supone `main` (`.claude/da/lib/worktree.mjs:17`), así que pasa **siempre** `--desde`.
  - Los worktrees van en `/home/fabs/da-wt/tablero-gastos/<grupo>`, fuera de OneDrive: la ruta del repo tiene un espacio que rompe los ganchos del perfil.
  - En ellos el lanzador se invoca con `node ./.claude/da/da`.
  - No toques `.claude/`.
- **Sin CI:** el CI de citas solo se dispara en PRs a `main`, así que el gate es tu `verify`.
- **Estado de partida esperado:** `verify` y `sistema` en verde sobre `ola/fase-0` @ `21673cc` (cierre de la fase 0: 166 tests, `sistema` 1/1).
- **Escalado:** propone el Team Manager (vía el Planeador), tomas tú, escalas al Team Manager. La sesión del Team Manager comparte el checkout principal: no cambies su rama. Handover, comando pesado uno a la vez y worktrees: `desarrollo-autonomo-pm` y `CLAUDE.md` (*Desarrollo agéntico* 8-9).
- **Cierre:** PR `ola/fase-1` → `chore/fase-1-planning` con la plantilla B, abierta para el usuario. Nada llega a `master` por el PM.
- **Demo del usuario** (no la cubre ninguna prueba): `npm start` abre el navegador de Windows desde WSL en `http://127.0.0.1:4310/`. Si no llega, se abre la URL a mano; no se cambia el host.

## 6. Primer paso concreto

1. `.claude/da/da preflight`, `.claude/da/da verify` y `.claude/da/da sistema` sobre la base, y la mecánica de OpenSpec sobre `fase-1-cargar-y-ver-el-mes`.
2. La lista de arranque al Team Manager **solo si hay algo que pedir al usuario**. No se espera ninguna instalación: si un grupo pide una dependencia, se escala, no se instala.
3. Rama `ola/fase-1` desde `chore/fase-1-planning`, registro, y los dos primeros encargos: grupo 1 y grupo 3 en paralelo, en worktrees disjuntos.
