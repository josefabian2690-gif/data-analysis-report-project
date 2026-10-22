# Revisión del pre-vuelo — Ola `fase-0` «Andamiaje y mecánica»

Verificado el 2026-10-15 contra `master` @ `4a969cb` (la rama principal del repositorio se llama `master`; `CLAUDE.md` la llama `main`).

## 1. Veredicto

- `fase-0-andamiaje`: propuesto en este pre-vuelo; lista para un PM.
- **Ola `fase-0`: lista para delegar**, con una condición de arranque que solo el usuario cumple: la instalación de dependencias de `design.md` D1 al empezar el grupo 1.
- Lo más importante: hoy no hay proyecto Node, así que ni `verify` ni el montaje de worktrees de la mecánica funcionan hasta que el grupo 1 deje un `package-lock.json`; el brief da la secuencia de arranque.

## 2. La ola

- **Ola `fase-0` — `fase-0-andamiaje`** (3 PRs internas)
  - **Entregable**
    - `generador/` con el generador movido sin cambios (renombres al 100 %), su README y `generador/fixtures.sh`
    - 3 fixtures de 2 000 filas en `tests/fixtures/generador/` (meses `2026-07`, `2026-08`, `2026-09`, semillas distintas) con su `*.esperado.json`, y un test que comprueba que su respuesta se ve en los datos
    - Proyecto Node/TS/Vite/React con una página vacía en `src/cliente/`
    - `.claude/da/da verify` en verde, `.claude/da/da sistema` en verde (página vacía sin peticiones fuera de 127.0.0.1) y `.claude/da/da doctor` sin FALLA
  - **Componentes que se modifican**
    - Raíz: `package.json`, `package-lock.json`, configuraciones de TS, Vite, Vitest, ESLint, Prettier y Playwright, `index.html`, `.gitignore`, `.gitattributes`, `README.md` (nuevo, corto)
    - `src/cliente/` (se crea: página vacía y `textos.ts`)
    - `tests/arquitectura/`, `tests/cliente/`, `tests/sistema/`, `tests/fixtures/` (se crean)
    - `generar_transacciones.py`, `configuracion.py`, `requirements.txt`, `README.md` → `generador/` (se mueven)
    - No se toca: la lógica del generador, `docs/`, `.claude/`, `openspec/specs/`; ni `src/dominio/`, `src/graficas/`, `src/reporte/`, `src/servidor/`, que nacen en fases posteriores

## 3. Hallazgos

### BLOQUEA EL ARRANQUE

Ninguno abierto. Lo que bloqueaba se corrigió en los artefactos:

- **No existían los changes de la ola.** `openspec list --json` → `"changes": []`. Corregido: propuesto `fase-0-andamiaje` (valida con `--strict`).
- **`[PENDIENTE]` de los fixtures** (`docs/PLAN.md`, sección *Pendientes*). Cerrado por el usuario el 2026-10-15: 3 fixtures de ~2 000 filas (~250 KB), semillas distintas. Escrito en `proposal.md` y en `design.md` D8. La línea de `docs/PLAN.md` se corrige en una PR aparte para el usuario, porque `docs/PLAN.md` queda fuera del dominio de la PR de planeación.

### CORREGIR ANTES DE ENCARGAR (ya escrito en `design.md` y `tasks.md`)

- **Un `npm install` sin versiones rompería el stack o la máquina** (verificado contra el registro de npm el 2026-10-15):
  - React 19 es la última; `docs/STACK.md` fija React 18
  - TypeScript 7 es la última; `typescript-eslint` 8 exige `typescript <6.1`
  - ESLint 10 es la última; `eslint-plugin-import` 2.32 admite hasta `eslint ^9`
  - jsdom 30 exige Node `^22.22.2`; la máquina tiene 22.22.1 (`node --version`)
  - Corrección: comando exacto en D1; tarea 1.1 comprueba las versiones resueltas.
- **El montaje de worktrees falla sin lockfile.** `.claude/desarrollo-autonomo.json` → `worktree.preparar: npm ci --prefix {wt}`; `.claude/da/lib/comandos/worktree.mjs:65-67` corre ese gancho incluso con `--lectura`. Corrección: secuencia de arranque en D2 (worktree del grupo 1 con `git worktree add`; el usuario instala ahí).
- **Una semilla puede inyectar un patrón que los datos no muestran.** Generado en el pre-vuelo con `-n 2000`: la semilla 33 en `2026-09` declara zona favorita Coyoacán y en los datos gana Roma Norte en Comida y Entretenimiento; las semillas 1 a 8 en `2026-07`, `2026-08` y `2026-09` cumplen los tres patrones. Rompería la demo y el test de semillas de la fase 4. Corrección: test de integridad (spec `fixtures-del-generador`, tareas 3.3 y 3.5).
- **Fixtures del mismo mes chocarían en el historial de la fase 3** (un mes por archivo, `docs/ARQUITECTURA.md`, *Almacenamiento*; 409 al repetir). Con la misma semilla, el perfil inyectado no cambia de mes a mes. Corrección: tres meses distintos (D8).
- **`--mes` por defecto depende de la fecha de hoy** (`generar_transacciones.py:405-412`). Corrección: `--mes` explícito en `generador/fixtures.sh`.
- **Prettier y ESLint sobre todo el repositorio** reescribirían o rechazarían archivos de la mecánica (`.claude/da/*.mjs`, documentos generados por `.claude/da/da render`, que `da doctor` vigila). Corrección: D3 y tarea 1.4.
- **Chromium sin bibliotecas del sistema.** `ldconfig -p` no lista `libnss3` ni `libasound`; Ubuntu 26.04. Corrección: D1 las pide al usuario; la prueba es el grupo 2.
- **Fin de línea `\r\n` en los CSV** (salida de `csv.DictWriter`, comprobado con `od -c`). Corrección: `.gitattributes` con `-text` (D8), para que regenerar siga sin producir diff.
- **Sin suite de sistema la ola no puede cerrar.** `CLAUDE.md` (*Test driven development*, punto 4) exige una prueba de sistema por fase y el cierre del PM corre `sistema`; la fila de la fase 0 de `docs/PLAN.md` no la menciona. Corrección: grupo 2 (decisión técnica 3).

### DEUDA (no bloquea; las issues están deshabilitadas en el repositorio, así que van aquí)

- **La mecánica supone que la rama principal se llama `main`.** El perfil no declara `proyecto.ramaPrincipal` y el valor por defecto es `main` (`.claude/da/lib/perfil.mjs:161`). Consecuencias: `.claude/da/da worktree montar` sin `--desde` parte de `origin/main`, que no existe (`.claude/da/lib/worktree.mjs:17`); `.github/workflows/citas.yml` solo se dispara en PRs a `main`, así que el CI de citas nunca ha corrido (`gh run list` vacío); `.claude/da/da medir` cuenta merges a `main`. Para esta ola basta con que el PM pase siempre `--desde`. Decisión 2.
- **`docs/STACK.md`, tabla «Comandos del gate», lista los pasos con `npx`**, que `CLAUDE.md` prohíbe (*Comandos*). Los scripts de `package.json` no lo usan (D3); el texto de `docs/STACK.md` queda para una PR de documentación.
- **`docs/ARQUITECTURA.md`, sección *Pruebas*, no tiene fila para `tests/arquitectura/` ni para el test de integridad de `tests/fixtures/`.** Frase de al lado; no impide nada.

## 4. Tope de PRs y partición

- `fase-0-andamiaje`: 3 grupos → 3 PRs internas (tope 5). Grafo: 1 → {2, 3}; 2 y 3 tocan archivos disjuntos.
- Tamaño estimado de diff, sin contar datos generados:
  - Grupo 1: ~420 líneas de configuración, página y tests, más `package-lock.json` (generado, miles de líneas, no cuenta)
  - Grupo 2: ~90 líneas
  - Grupo 3: ~320 líneas (dos READMEs, `fixtures.sh`, test, `.gitattributes`) más ~6 000 líneas de CSV y 3 JSON generados (no cuentan)
- No hace falta partir.

## 5. Lo que la ola absorbe

- Deuda heredada: ninguna (es la primera ola; `docs/olas/` solo tiene `.gitkeep`).
- Issues de pre-vuelo: ninguna (issues deshabilitadas).

## 6. Lo que está bien

- `/da-init` ya está hecho: `.claude/da/da doctor` da 41 OK, 0 FALLA, 1 AVISO (MCP de avisos, opcional).
- `.claude/da/da citas` está limpio; sus 23 avisos son rutas del perfil que esta ola y las siguientes crean.
- El generador se puede mover sin tocarlo: importa `configuracion` como módulo hermano (`generar_transacciones.py:24`) y escribe `output/` relativo al directorio de trabajo (`generar_transacciones.py:451`).
- La misma semilla reproduce byte a byte el mismo CSV (comprobado con `cmp`), y 2 000 filas pesan 255-263 KB.
- Los skills de área están instalados para TS, React, Vitest y Node.

## 7. Decisiones

Decisiones del usuario ya cerradas (2026-10-15):

- **U1 (alcance).** Fixtures: 3 de ~2 000 filas, semillas distintas. Escrito en `proposal.md` y en `design.md` D8.
- **U2 (alcance).** Avance **continuo**, y nadie mergea a `master` salvo el usuario. Esto reemplaza la indicación anterior de avance no continuo. La base de la ola es la rama de planeación `chore/fase-0-planning`.

Decisiones abiertas para el Team Manager:

1. **(Usuario: instalación)** Instalar al arrancar el grupo 1 con el comando exacto de D1, más `npx playwright install chromium` y las bibliotecas del sistema de Chromium.
   - Recomendación: aprobarlo tal cual. Sin esto la ola no arranca.
2. **(Usuario: mecánica)** `master` frente a `main`.
   - (a) Renombrar la rama principal a `main` en GitHub y en local: es lo que el kit supone.
   - (b) Declarar `proyecto.ramaPrincipal: "master"` en `.claude/desarrollo-autonomo.json` y correr `.claude/da/da render` en una PR de mecánica.
   - (c) No hacer nada en la fase 0; el PM pasa siempre `--desde`.
   - Recomendación: (c) para esta ola, y (a) o (b) entre olas (`docs/DESARROLLO-AUTONOMO.md` §3, principio 10). (b) es más barata; (a) es más limpia.
3. **(Técnica)** Incluir en la fase 0 la suite de sistema mínima (grupo 2), aunque la fila de la fase 0 de `docs/PLAN.md` no la nombre.
   - Recomendación: sí. `CLAUDE.md` la exige y vigila la regla innegociable 2 desde el primer día.
4. **(Técnica)** Instalar ahora todo el stack de `docs/STACK.md` o solo lo que use la fase 0.
   - Recomendación: todo ahora. `docs/STACK.md` fija las versiones en la fase 0, y así se interrumpe al usuario una sola vez.
5. **(Técnica)** La corrección del `[PENDIENTE]` de `docs/PLAN.md` va en una PR de documentación aparte, contra `master`.
   - Recomendación: aparte, para mantener la PR de planeación dentro de su dominio de rutas.
   - Coste: la ola parte de una base cuyo `docs/PLAN.md` todavía dice `[PENDIENTE]`. El brief deja la decisión escrita para el PM.
