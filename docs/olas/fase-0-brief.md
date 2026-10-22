# Brief — Ola fase-0 «Andamiaje y mecánica»

Eres el **project manager** de la Ola fase-0 de tablero-gastos. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- **Base: `chore/fase-0-planning`, por petición del usuario, 2026-10-15 (avance continuo, sin merges a master)**, en `f0eb84e` o posterior (la punta de esa rama). Rama `ola/fase-0` desde ahí; su PR de ola apunta a `chore/fase-0-planning`. Registro: `docs/olas/fase-0.md`.
- La rama principal del repositorio se llama `master` (`CLAUDE.md` dice `main`). Nadie mergea a `master` salvo el usuario.
- Change: `fase-0-andamiaje`, ya propuesto y refinado; lo tomas, no lo reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable: `openspec-update-change` y registro.
- Entregable: el generador en `generador/` sin cambios de lógica, con README y `generador/fixtures.sh`; 3 fixtures de 2 000 filas con su `*.esperado.json` y un test que demuestra que su respuesta se ve en los datos; proyecto Node/TS/Vite/React con una página vacía; `.claude/da/da verify` y `.claude/da/da sistema` en verde y `.claude/da/da doctor` sin FALLA.
- Regla de la fase: **ninguna funcionalidad del tablero** (nada de `src/dominio/`, servidor, `npm start`), y **el generador no cambia de lógica**.
- PRs internas: 3. El grupo 1 va primero. Los grupos 2 y 3 dependen solo del 1 y tocan archivos disjuntos (`tasks.md`, cabecera), así que pueden ir en paralelo; ante la duda, en serie (2 y luego 3). Cada grupo queda por debajo de ~600 líneas de diff, sin contar lo generado (`package-lock.json`, CSV, JSON de fixtures).
- No se empieza la fase 1. Con avance continuo, la siguiente fase se planea aparte y se apila sobre la PR de esta ola.

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. No hace falta leer `docs/PLAN.md` ni `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va extractado en §3 y §4.
3. Los artefactos de `fase-0-andamiaje` por la mecánica de OpenSpec (`openspec status`, `openspec instructions apply`). `instructions apply` no devuelve `context` ni `operationGuidance` para este change (comprobado el 2026-10-15).
4. `docs/olas/fase-0-revision.md`: los hallazgos y decisiones del pre-vuelo.
5. Guardas de la ola: las crea la propia ola, porque no existe ningún test todavía. Son `tests/arquitectura/`, `tests/fixtures/` y `tests/sistema/`, y no se ablandan una vez en verde.

## 3. Reglas de la fase que mandan en cada PR

- **Decisiones del usuario (2026-10-15).**
  - Se commitean 3 fixtures del generador de ~2 000 filas (~250 KB), con semillas distintas. Sirven a la demo del historial de la fase 3 y a los tests.
  - El `[PENDIENTE]` de fixtures que sigue en `docs/PLAN.md` (sección *Pendientes*) está **cerrado**: su corrección va en una PR de documentación aparte para el usuario.
  - Avance continuo.
- **Instalaciones: solo el usuario** (`CLAUDE.md`, *Reglas de proceso* 5). El comando exacto está en `design.md` D1; no se cambia ninguna versión sin pasar por el Team Manager, porque cada pin evita una incompatibilidad comprobada:
  - React 18 (`docs/STACK.md`)
  - TypeScript 5 (`typescript-eslint` 8 exige `<6.1`)
  - ESLint 9 (`eslint-plugin-import` 2.32)
  - jsdom 29 (jsdom 30 exige Node 22.22.2 y la máquina tiene 22.22.1)
- **El generador se mueve con `git mv` y sin editar.** El crítico debe ver renombres al 100 % en `git diff -M --stat`.
- **El gate cubre solo el proyecto Node** (`design.md` D3). Si un cambio deja a `.claude/da/da doctor` con «generados sin editar a mano» en FALLA, es un BLOQUEA.
- **Comentarios:** la regla de `CLAUDE.md` y `.claude/da/da citas` aplican desde el primer archivo. Ningún comentario cita `openspec/changes/`: el porqué de D3 o D8, si hace falta, se escribe entero.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-15)

- **Grupo 1 — Proyecto Node con la página vacía** (`implementador-cliente`; también toca la raíz y `tests/arquitectura/`, que no tienen área propia en el perfil).
  - **Arranque (D2).** `.claude/da/da worktree montar` falla aquí: su gancho `preparar` es `npm ci --prefix {wt}` (`.claude/desarrollo-autonomo.json`, `worktree.preparar`) y no hay `package-lock.json`. El gancho corre incluso con `--lectura` (`.claude/da/lib/comandos/worktree.mjs:65-67`). Haz esto:
    1. Crea el worktree del grupo con `git worktree add <ruta> -b <rama> ola/fase-0` y anótalo en el registro como excepción.
    2. Pide al usuario, por el Team Manager, que corra ahí el comando de D1.
    3. Comprueba a mano el gancho `comprobar` del perfil: `ls -d <wt>/node_modules && realpath <wt>/node_modules/.bin` debe caer bajo el worktree (L0).
    4. Encarga.
  - **Estado de partida:** hoy no hay `package.json`, `src/` ni `tests/`. El usuario deja un `package.json` con solo dependencias; el implementador le añade nombre, `private`, `"type": "module"`, `engines` y scripts, sin tocar las dependencias.
  - **Trampas:**
    - `prettier --check .` y `eslint .` alcanzarían `.claude/da/*.mjs` y documentos que genera `.claude/da/da render`; la lista de exclusiones está en D3.
    - `import/no-restricted-paths` solo actúa sobre módulos que resuelve, así que el test de arquitectura necesita destinos reales (D4). Lo obligatorio es que el test falle al quitar la regla, no el mecanismo.
    - Vite escucha en `127.0.0.1` en `server` y `preview` (regla innegociable 2).
  - **Texto visible:** solo en `src/cliente/textos.ts`. El test de componente lo busca por rol y nombre accesible tomado del catálogo.
  - **Skills de área:** `typescript-advanced-types`, `vitest`, `vercel-react-best-practices` y `javascript-testing-patterns` (están instalados).
- **Grupo 2 — Suite de sistema** (`implementador-cliente`).
  - Antes de encargar: los navegadores de Playwright (`npx playwright install chromium`) y las bibliotecas que faltan (`libnss3` y `libasound` no aparecen en `ldconfig -p`; Ubuntu 26.04): `sudo npx playwright install-deps chromium`, o `sudo apt-get install libnss3 libasound2t64`. Si al arrancar el grupo 1 el usuario no los instaló, pídelos en la misma lista.
  - `.claude/da/da sistema` corre `npm run build` antes (perfil, `modulos.suiteDeSistema.preparar`) y luego `npm run test:sistema`.
  - La prueba vigila todas las peticiones del contexto del navegador. La mutación que demuestra que puede fallar es un `<link>` a una fuente web externa, que no se commitea.
  - En la fase 1 el `webServer` pasará a `npm start`; la vigilancia de peticiones se queda.
  - Skills: los del grupo 1, con `javascript-testing-patterns` para Playwright.
- **Grupo 3 — Generador y fixtures** (`implementador-generador`; el test es TypeScript, así que el encargo nombra `vitest` y `typescript-advanced-types`).
  - **Hechos del generador:**
    - Importa `configuracion` como hermano (`generar_transacciones.py:24`)
    - Escribe en `output/` relativo al directorio de trabajo (`generar_transacciones.py:451`)
    - `--mes` por defecto es el mes anterior a hoy (`generar_transacciones.py:405-412`), así que `fixtures.sh` pasa `--mes` explícito
    - `-v` imprime texto, no JSON (`generar_transacciones.py:369-392`), con el viaje como `destino (dd/mm al dd/mm)`
    - El CSV sale con `\r\n`
  - **Intérprete:** `.venv/bin/python` de la raíz, Python 3.14 con Faker 40.43.0. El `python3` del sistema **no** tiene Faker. Ejecutar el generador con ese intérprete no es instalar.
  - **Semillas comprobadas en el pre-vuelo con `-n 2000`.** Las semillas 1 a 8 cumplen los tres patrones observables en `2026-07`, `2026-08` y `2026-09`; con la misma semilla el perfil inyectado es el mismo en todos los meses. La semilla 33 en `2026-09` NO cumple: declara zona favorita Coyoacán y en Comida y Entretenimiento gana Roma Norte. Una combinación válida con tres categorías dominantes distintas:
    - semilla 1 en `2026-07` (Compras)
    - semilla 2 en `2026-08` (Entretenimiento)
    - semilla 3 en `2026-09` (Comida)
  - **Nombres y forma del esperado:** D8.
  - **Guarda:** el test de integridad usa su propia agregación mínima porque `src/dominio/` no existe. No es el test de semillas de la fase 4.
  - **README:** el `README.md` de la raíz es hoy el del generador; se mueve a `generador/README.md` y la raíz gana uno corto (D9).

## 5. Mecánica de esta fase

- **Base de la ola:** `chore/fase-0-planning` (avance continuo pedido por el usuario el 2026-10-15; la PR de planeación está abierta contra `master` y la mergea el usuario). De ahí sale `ola/fase-0` y a ahí apunta su PR. Cuando el usuario mergee la PR de planeación, el Team Manager hará rebasar y reapuntar la de la ola (`desarrollo-autonomo-team-manager` §7).
- **`.claude/da/da worktree montar` supone que la rama principal es `main`.** El perfil no declara `proyecto.ramaPrincipal` (`.claude/da/lib/perfil.mjs:161`), y sin `--desde` la base es `origin/main`, que no existe (`.claude/da/lib/worktree.mjs:17`). Pasa **siempre** `--desde` (por ejemplo `--desde ola/fase-0`). El CI de citas (`.github/workflows/citas.yml`) solo se dispara en PRs a `main`: no esperes un check de CI; el gate es tu `verify`.
- **`.claude/da/da verify` sobre la base está en rojo, como se espera:** no hay proyecto Node hasta el grupo 1. Anótalo en el arranque del registro como estado de partida, no como fallo heredado. Lo mismo para `sistema`, que no existe hasta el grupo 2.
- Propone el Team Manager (vía el Planeador) y toma el PM; se escala al Team Manager. Otra sesión puede compartir el checkout principal (la del Team Manager): no cambies su rama. Handover, comando pesado uno a la vez y worktrees: `desarrollo-autonomo-pm` y `CLAUDE.md` (*Desarrollo agéntico* 8-9).
- Cierre: PR `ola/fase-0` → `chore/fase-0-planning` con la plantilla B, abierta para el usuario. Nada llega a `master` por el PM.

## 6. Primer paso concreto

1. `.claude/da/da preflight` y la mecánica de OpenSpec sobre `fase-0-andamiaje`. `verify` sobre la base queda en rojo por diseño (§5).
2. La lista de arranque al Team Manager. **Sí contiene algo para el usuario:** la instalación de `design.md` D1, con navegadores de Playwright y bibliotecas del sistema.
3. Rama `ola/fase-0` desde `chore/fase-0-planning`, registro, y el worktree del grupo 1 según §4.
4. Con la instalación hecha, el primer encargo.
