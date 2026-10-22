# Revisión del pre-vuelo — Ola `fase-1` «Cargar y ver el mes»

Verificado el 2026-10-16 contra `ola/fase-0` @ `21673cc`. La ola se apila sobre la fase 0 por petición del usuario (avance continuo, sin merges a `master`). La rama principal se llama `master`.

## 1. Veredicto

- `fase-1-cargar-y-ver-el-mes`: propuesto en este pre-vuelo (`openspec validate --strict` válido, 19 tareas); listo para un PM.
- **Ola `fase-1`: lista para delegar**, con las decisiones 1 a 5 escritas en los artefactos con la opción recomendada. Si el Team Manager o el usuario cambian alguna, se reescribe por `openspec-update-change` antes del primer encargo.
- Lo más importante:
  - el Node de la máquina no ejecuta TypeScript, así que el servidor se construye con Vite (verificado; sin dependencias nuevas);
  - los fixtures de semilla no tienen ni una fila inválida, así que la «validación con filas inválidas» del PLAN se demuestra añadiéndolas en memoria.

## 2. La ola

- **Ola `fase-1` — `fase-1-cargar-y-ver-el-mes`** (5 PRs internas)
  - **Entregable**
    - `npm start` construye lo que falte, sirve el bundle escuchando solo en 127.0.0.1 y abre el navegador
    - Al elegir un CSV se ven el rechazo (si falta una columna obligatoria) o el resumen de validación con las filas inválidas (fila y motivo), la confirmación si superan el 5 %, los cinco KPIs en formato MXN y el gasto por categoría (gráfica y lista) con la dominante primero y destacada
    - Un test que falla si el servidor escucha fuera de 127.0.0.1; la suite de sistema corre contra `npm start` y recorre el flujo
  - **Componentes que se modifican**
    - `src/dominio/`, `tests/dominio/` (se crean: esquema, carga, métricas, formato)
    - `src/graficas/`, `tests/graficas/` (se crean: `porCategoria`)
    - `src/servidor/`, `tests/servidor/` (se crean: estáticos, arranque)
    - `src/cliente/` (`App.tsx`, `textos.ts`, componentes nuevos), `tests/cliente/`
    - `tests/sistema/` (spec nueva), `playwright.config.ts` (`webServer` → `npm start`)
    - `eslint.config.mjs` y `tests/arquitectura/sistema.test.ts` (regla de imports de la suite de sistema)
    - `package.json` (solo scripts), `.gitignore`, `.prettierignore`, `.gitattributes`, `tests/fixtures/a-mano/` (nuevo)
    - No se toca: `generador/`, `tests/fixtures/generador/`, `docs/`, `.claude/`, `openspec/specs/`, las dependencias

## 3. Hallazgos

### BLOQUEA EL ARRANQUE

Ninguno abierto. Lo que bloqueaba se corrigió en los artefactos:

- **No existía el change de la ola.** `openspec list --json` solo tenía `fase-0-andamiaje`. Corregido: propuesto `fase-1-cargar-y-ver-el-mes`.
- **El servidor TypeScript no puede correr con el Node de la máquina.**
  - Evidencia (verificado): `/usr/bin/node` 22.22.1 da `process.features.typescript === false`; `node a.ts` falla con `ERR_UNKNOWN_FILE_EXTENSION`, también con `--experimental-strip-types`. Ninguno de los paquetes instalados ejecuta TS (`package.json`: no hay `tsx` ni `ts-node`).
  - Por qué importa: `npm start` es el entregable, y `src/servidor/` es TypeScript según `docs/ARQUITECTURA.md`.
  - Corrección: `design.md` D1. Vite 8.3.4 construye la entrada del servidor (`build.ssr`) a un `.mjs` que corre en un paquete sin `"type"`. Lo comprobé con un servidor de prueba que importa `node:http`, `open` y un módulo de dominio con Papa Parse. Sin dependencias nuevas.

### CORREGIR ANTES DE ENCARGAR (ya escrito en `design.md` y `tasks.md`)

- **Los fixtures de semilla no tienen filas inválidas.**
  - Evidencia (verificado con Papa Parse sobre los tres CSV de `tests/fixtures/generador/`): 0 montos ≤ 0, 0 id repetidos, 0 filas de otro mes, 0 coordenadas fuera de rango, 0 fechas sin hora.
  - Por qué importa: la fila de la fase 1 de `docs/PLAN.md` dice «al subir el fixture de semilla se ven la validación con las filas inválidas».
  - Corrección: interpretación en `proposal.md`. La prueba de sistema añade tres filas inválidas en memoria al fixture `2026-07`, y en la demo un fixture hecho a mano muestra la lista. Decisión 1.
- **`parsearCsv` no tiene cómo decir «rechazado».** `docs/ARQUITECTURA.md` (*Contratos*) da `ResultadoCarga = { mes, transacciones, invalidas }`, sin variante de rechazo, pero R-01 y los casos borde exigen rechazar.
  - Corrección: D4. Se conserva la firma y el dominio exporta el error `CargaRechazada`; es un añadido declarado. Decisión 3.
- **`FilaInvalida.motivo: string` chocaría con «textos visibles solo en `src/cliente/textos.ts`»** (`CLAUDE.md`, *Idioma*). Corrección: D4. El motivo es un código cerrado y el texto es-MX vive en el catálogo, con un registro exhaustivo.
- **«Gasto promedio por día del periodo filtrado» (R-11) sin filtros ni periodo en la firma** `metricas(tx)`. Corrección: D7. En esta fase el periodo son los días naturales del mes; el añadido a la firma para el filtro por fecha se decide al planear la fase 2. Decisión 4.
- **Ambigüedades de R-05, R-06 y R-08 que el PM no debe resolver a mitad de ola.** Corrección: D6 y escenarios de la spec `carga-de-csv`:
  - número de fila (el encabezado es la fila 1)
  - umbral «más del 5 %» (el 5 % exacto no pide confirmación)
  - se queda la primera aparición **válida** de un id
  - empate de meses al más antiguo
  - celda obligatoria vacía, inválida
  - celda opcional vacía, valor por defecto
- **ECharts no dibuja con `canvas` en jsdom.** Evidencia (verificado con jsdom 29.1.1 y echarts 6.1.0): `canvas` lanza `Cannot set properties of null (setting 'dpr')`; `svg` inicializa y pone `aria-label`. Corrección: D10, renderizador SVG y pruebas sobre la lista accesible.
- **La suite de sistema sigue sobre `vite preview`** (`playwright.config.ts:10-14`). `docs/STACK.md` (*Comandos del gate*, último párrafo) pide `npm start`. Corrección: tarea 3.4. El origen `127.0.0.1:4173` se conserva con `TABLERO_PUERTO`.
- **Fixtures hechos a mano con BOM y `\r\n`.** `.gitattributes` solo protege `tests/fixtures/generador/*.csv`. El test de integridad exige exactamente 3 CSV en `tests/fixtures/generador/` (`tests/fixtures/integridad.test.ts:95`). Corrección: D12, una carpeta propia y `-text`.

### DEUDA (no bloquea; las issues están deshabilitadas en el repositorio, así que van aquí)

- **Deuda de la fase 0 que esta ola absorbe:**
  - el test de «escucha únicamente en 127.0.0.1», en la tarea 3.1;
  - la regla de lint para el import por defecto de `@playwright/test` y para `playwright/test`, en la tarea 3.5. Hoy está en `eslint.config.mjs:85-96`, con `importNames: ['test']` y solo para `@playwright/test`.
- **Deuda de la fase 0 que esta ola no absorbe:** la vigilancia de WebSockets y de peticiones tardías (`tests/sistema/sin-red.ts:20-22`). En la fase 1 no hay ninguna vía real: el servidor propio no tiene HMR y la página no hace `fetch`. Se propone revisarla al planear la fase 3, con la primera llamada a la API. Decisión 2.
- **`docs/ARQUITECTURA.md`, *Contratos*, no nombra `CargaRechazada` ni `pideConfirmacion`.** Es un añadido declarado en `design.md` D4. Corregirlo es una PR de documentación para el usuario; no impide nada.
- **El navegador que abre `open` desde WSL** (`powershell.exe`) depende del reenvío de localhost de WSL para llegar a 127.0.0.1. Ninguna prueba automática lo cubre (la suite no abre el navegador). Lo prueba la demo del usuario (riesgo en `design.md`).
- Mecánica (no producto), heredada de la fase 0 y sin cambios: `master` frente a `main` (pasar `--desde`), worktrees fuera de OneDrive, lanzador con `node`. No se toca `.claude/`.

## 4. Tope de PRs y partición

- `fase-1-cargar-y-ver-el-mes`: 5 grupos → 5 PRs internas, en el tope.
- Grafo: 1 → 2 → 4 → 5; el 3 en paralelo con 1, 2 y 4, y antes del 5.
- Estimación de diff (código y tests, sin fixtures):

| Grupo | Líneas estimadas |
|---|---|
| 1 | ~550 |
| 2 | ~400 |
| 3 | ~500 |
| 4 | ~600 |
| 5 | ~120 |

- Partir cualquier grupo supone partir la ola: el PM lo escala antes.

## 5. Lo que la ola absorbe

- `docs/olas/fase-0.md`, *Deuda*:
  - escucha solo en 127.0.0.1 → grupo 3 (3.1)
  - regla de lint de la suite de sistema → grupo 3 (3.5)
  - WebSockets y peticiones tardías → no (decisión 2)
- `docs/ARQUITECTURA.md`, *Pruebas*: los fixtures hechos a mano anunciados → grupo 1 (1.1). La fila de `servidor` «que escuche solo en 127.0.0.1» → grupo 3.

## 6. Lo que está bien

- Todo el stack está instalado con versiones exactas; Papa Parse, ECharts, `open`, React y Vite cubren la fase sin dependencias nuevas.
- El lint de capas ya permite a `servidor` usar `node:*` y bloquea I/O en `dominio` y `graficas` (`tests/arquitectura/capas.test.ts`).
- Vitest ya incluye `tests/dominio/`, `tests/graficas/` y `tests/servidor/` en el proyecto `nucleo` (`vite.config.mts:20-26`); no hace falta tocar su configuración.
- `Intl` de es-MX en Node da exactamente el formato de R-17 (`$12,345.68`, `$1,689,470.67`).
- El `[PENDIENTE]` de fixtures está cerrado (PR #4, abierta); los otros dos `[PENDIENTE]` del PLAN son de la fase 4.

## 7. Decisiones

Escritas en los artefactos con la recomendación; la ola arranca con ellas salvo que se reviertan.

1. **Filas inválidas en la demo del fixture de semilla** (*del usuario*: contradicción entre el PLAN y los datos).
   - Opciones:
     - (a) la prueba de sistema añade filas inválidas en memoria, y en la demo manual el fixture de semilla muestra «0 inválidas» y uno hecho a mano muestra la lista;
     - (b) commitear una copia del fixture de semilla con filas estropeadas (~250 KB más);
     - (c) cambiar el generador para que emita filas inválidas (fuera de alcance del PLAN: el generador no cambia).
   - Recomendación: (a), sin tocar `docs/PLAN.md`.
2. **Vigilancia de WebSockets y peticiones tardías** (*técnica*, Team Manager).
   - Opciones:
     - (a) a la fase 3;
     - (b) en esta ola, dentro del grupo 5.
   - Recomendación: (a), porque hoy no hay ninguna vía real.
3. **Cómo se rechaza una carga** (*técnica*, Team Manager).
   - Opciones:
     - (a) `CargaRechazada` lanzada, conservando la firma de ARQUITECTURA;
     - (b) un resultado unión, que cambia la firma y exige una PR del usuario a `docs/ARQUITECTURA.md`.
   - Recomendación: (a).
4. **Periodo del gasto promedio por día** (*técnica*, Team Manager; interpreta R-11).
   - Opciones:
     - (a) los días naturales del mes;
     - (b) del primer al último día con gasto.
   - Recomendación: (a); el añadido a la firma para el filtro llega en la fase 2.
5. **`npm start` construye «si falta o está viejo»** (*técnica*, Team Manager).
   - Opciones:
     - (a) una función pura de fechas de modificación, como dice `docs/STACK.md`;
     - (b) construir siempre, más simple y más lento en `/mnt/c`.
   - Recomendación: (a).

Brief: `docs/olas/fase-1-brief.md`.
