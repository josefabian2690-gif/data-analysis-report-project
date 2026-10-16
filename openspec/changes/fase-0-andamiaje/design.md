# Design

## Context

Estado verificado el 2026-10-15 sobre `master` @ `4a969cb`:

- No hay proyecto Node: no existen `package.json`, `package-lock.json`, `src/` ni `tests/`. Por eso `.claude/da/da verify` no puede correr todavía.
- El generador está en la raíz: `generar_transacciones.py` (458 líneas), `configuracion.py`, `requirements.txt` (`Faker==40.43.0`) y `README.md`, que es el README del generador. Importa `configuracion` como módulo hermano (`generar_transacciones.py:24`) y su salida por defecto es `output/…` relativa al directorio de trabajo (`generar_transacciones.py:451`), así que moverlo a `generador/` no cambia ni el import ni la salida.
- `--mes` por defecto es el mes anterior a hoy (`generar_transacciones.py:405-406`): un fixture sin `--mes` explícito no es reproducible.
- `-v` imprime la respuesta como texto (`generar_transacciones.py:369-392`), no como JSON; las fechas del viaje salen como `dd/mm`.
- El CSV usa fin de línea `\r\n` (el `csv.DictWriter` de Python por defecto).
- El intérprete con Faker es `.venv/bin/python` (Python 3.14, en la raíz, ignorado por git); el `python3` del sistema no tiene Faker.
- El perfil de la mecánica prepara cada worktree con `npm ci --prefix {wt}` (`.claude/desarrollo-autonomo.json`, `worktree.preparar`), que exige un `package-lock.json`.
- Node 22.22.1 y npm 9.2.0 en la máquina.

## Goals / Non-Goals

**Goals:**
- Que `.claude/da/da verify` y `.claude/da/da sistema` corran en verde y que cada regla innegociable que ya se puede automatizar (capas, I/O en capas puras, cero red) quede automatizada.
- Fixtures del generador cuya respuesta sea observable en los datos, porque la fase 4 compara `hallazgos()` contra ellos.

**Non-Goals:**
- `npm start`, el servidor del historial y cualquier lógica del dominio (fase 1 en adelante).
- Fixtures hechos a mano (con BOM, sin columnas opcionales, inválidos): llegan con las reglas que ejercitan.
- Cambiar el generador.

## Decisions

### D1. Las dependencias las instala el usuario, con versiones exactas compatibles entre sí

Las versiones se fijan con `--save-exact`. Lo que la última versión de cada paquete NO permite usar, comprobado contra el registro el 2026-10-15:

- `react`/`react-dom`/`@types/react`/`@types/react-dom` en **18** (`docs/STACK.md` fija React 18; la última es 19).
- `typescript` en **5** (la última es 7; `typescript-eslint` 8 exige `typescript <6.1`).
- `eslint` y `@eslint/js` en **9** (la última es 10; `eslint-plugin-import` 2.32 solo admite hasta `eslint ^9`).
- `jsdom` en **29** (jsdom 30 exige Node `^22.22.2`; la máquina tiene 22.22.1).
- `@types/node` en **22**.

Comando exacto (en el worktree del grupo 1, ver D2):

```
npm install --save-exact react@18 react-dom@18 echarts@6 @tanstack/react-table papaparse@5 open@11
npm install --save-dev --save-exact typescript@5 vite@8 @vitejs/plugin-react@6 vitest@5 jsdom@29 @testing-library/react@16 @testing-library/dom@10 @testing-library/user-event@14 @testing-library/jest-dom@7 @types/react@18 @types/react-dom@18 @types/node@22 @types/papaparse@5 eslint@9 @eslint/js@9 typescript-eslint@8 eslint-plugin-import@2 eslint-import-resolver-typescript@4 prettier@3 @playwright/test@1
npx playwright install chromium
```

Además, Chromium necesita bibliotecas del sistema que hoy faltan (`libnss3` y `libasound` no aparecen en `ldconfig -p`): `sudo npx playwright install-deps chromium`, o en su defecto `sudo apt-get install libnss3 libasound2t64`.

Se instala todo el stack de una vez (también lo que usan las fases 1 a 5: ECharts, TanStack Table, Papa Parse, `open`) porque `docs/STACK.md` dice que las versiones exactas se fijan en la fase 0, y así el usuario instala una sola vez. Alternativa descartada: instalar por fase, que cuesta una interrupción al usuario por fase.

### D2. Arranque del grupo 1 sin `package-lock.json`

El gancho `worktree.preparar` (`npm ci`) falla mientras no exista `package-lock.json`, así que el worktree del grupo 1 no se puede montar con `.claude/da/da worktree montar`. Secuencia:

1. El worktree del grupo 1 se crea con `git worktree add` sobre su rama (única excepción, la registra el PM).
2. El usuario corre ahí el comando de D1: genera `package.json` (solo dependencias), `package-lock.json` y `node_modules/` dentro del worktree.
3. El implementador completa `package.json` (nombre, `private`, `engines.node >=22.12`, scripts) sin tocar las dependencias, y sigue con TDD. **Sin `"type": "module"`:** el lanzador de la mecánica `.claude/da/da` es un script CommonJS sin extensión, y con `"type": "module"` en el `package.json` de la raíz Node lo carga como ESM y falla (`require is not defined in ES module scope`), con lo que `verify`, `sistema`, `doctor` y `citas` dejan de correr (comprobado el 2026-10-15). Los archivos de configuración que sean ESM llevan extensión explícita (`eslint.config.mjs`, `vite.config.mts`); el código de `src/` y `tests/` lo resuelven Vite, Vitest y `tsc` con `moduleResolution: Bundler`, que no dependen de ese campo. Alternativa descartada: añadir `.claude/da/package.json` con `"type": "commonjs"` o renombrar el lanzador, porque la fase 0 no toca la mecánica del kit.
4. A partir del grupo 2, los worktrees se montan con `.claude/da/da worktree montar`: que `npm ci` pase es la prueba de que el lockfile quedó coherente con `package.json`.

### D3. El gate cubre solo el proyecto Node

`prettier --check .` y `eslint .` ignoran explícitamente `.claude/`, `openspec/`, `docs/`, `graft/`, `generador/`, `.venv/`, `output/`, `historial/`, `dist/`, `tests/fixtures/generador/`, los reportes de Playwright y `CLAUDE.md`. Los archivos de la mecánica los genera `.claude/da/da render` y `da doctor` falla si se reescriben a mano; `.claude/da/` contiene `.mjs`/`.cjs` que no siguen las reglas del proyecto. Los scripts de `package.json` invocan los binarios directamente (`prettier`, `eslint`, `tsc --noEmit`, `vitest run`, `playwright test`), sin `npx`.

### D4. Capas por ESLint

`import/no-restricted-paths` con una zona por fila de la tabla de capas de `docs/ARQUITECTURA.md` (resolutor de TypeScript para que resuelva rutas `.ts`/`.tsx`), y para `src/dominio/`, `src/graficas/` y `src/reporte/`: imports `node:*` prohibidos, `fetch`/`window`/`document`/`localStorage` como globales prohibidos, `process.env`, `Date.now()` y `new Date()` sin argumentos prohibidos. El test de arquitectura (`tests/arquitectura/`) usa la API de Node de ESLint sobre el `eslint.config` real. **Mecanismo a verificar por el implementador:** `no-restricted-paths` solo actúa si resuelve el módulo importado, así que el test necesita archivos reales en ambos extremos (por ejemplo, un árbol temporal con la misma forma que `src/`, o `lintText` con `filePath` dentro de `src/` y un destino que exista); el objetivo, no el mecanismo, es lo obligatorio: que quitar la regla haga fallar el test.

### D5. Vitest, TypeScript y Vite

- Vitest incluye `tests/**/*.test.{ts,tsx}` y excluye `tests/sistema/`; `tests/cliente/` corre en `jsdom`, el resto en `node`.
- `tsc --noEmit` en modo `strict` cubre `src/`, `tests/` y los archivos de configuración.
- Vite escucha en `127.0.0.1` en `server` y en `preview`, con puerto fijo y `strictPort`.

### D6. La página vacía y su texto

`index.html` + `src/cliente/main.tsx` monta un componente raíz que muestra el título del tablero; el texto vive en `src/cliente/textos.ts` (CLAUDE.md, *Convenciones*). Sin fuentes web ni assets remotos. El test de componente busca el encabezado por rol y nombre accesible tomado del catálogo de textos.

### D7. Suite de sistema mínima

Playwright con `webServer` = `vite preview` del bundle ya construido (`.claude/da/da sistema` corre antes `npm run build`, `modulos.suiteDeSistema.preparar` del perfil) en `127.0.0.1`. La prueba abre la página, espera la carga, comprueba el encabezado y registra todas las peticiones del contexto; falla nombrando cualquier URL cuyo host no sea `127.0.0.1`. En la fase 1 el `webServer` pasará a `npm start`; la vigilancia de peticiones se queda.

### D8. Fixtures del generador

- Ubicación y nombres: `tests/fixtures/generador/<AAAA-MM>-semilla-<N>.csv` y `<AAAA-MM>-semilla-<N>.esperado.json`. Los hechos a mano irán a otra subcarpeta de `tests/fixtures/`.
- Meses: `2026-07`, `2026-08` y `2026-09` (31, 31 y 30 días; consecutivos para la comparación de la fase 3). Semillas distintas y elegidas para que las tres categorías dominantes difieran (mejor demo de comparación). Comprobado en el pre-vuelo con `-n 2000`: las semillas 1 (`2026-07`, Compras), 2 (`2026-08`, Entretenimiento) y 3 (`2026-09`, Comida) cumplen los tres patrones observables; la semilla 33 en `2026-09` NO (inyecta Coyoacán como favorita y en los datos gana Roma Norte). La elección final es del implementador y la valida el test de integridad.
- `*.esperado.json` en camelCase, para leerlo desde TypeScript: `semilla`, `mes`, `registros`, `categoriaDominante`, `zonaFavorita`, `casa`, `trabajo`, `viaje: { destino, desde, hasta }` (fechas `AAAA-MM-DD`, el año sale de `mes`), `quincenas: [15, <último día>]`.
- `generador/fixtures.sh`: `bash` con `set -euo pipefail`; rutas relativas a su propio directorio (se puede llamar desde la raíz); intérprete `${PYTHON:-.venv/bin/python}` comprobado con `import faker` antes de generar; genera a un directorio temporal y solo al final reemplaza los archivos de `tests/fixtures/generador/`; convierte la salida de `-v` a JSON sin tocar el generador.
- `.gitattributes` marca `tests/fixtures/generador/*.csv` como `-text`, para que ningún cliente de git normalice los `\r\n` y «regenerar no cambia nada» siga siendo cierto.
- El test de integridad (`tests/fixtures/`) lee cada CSV y su esperado y aplica las definiciones de R-16 con una agregación propia y mínima: aún no existe `src/dominio/`, y el test de semillas de la fase 4, que sí usará `hallazgos()`, es otro.

### D9. READMEs

`README.md` se mueve con `git mv` a `generador/README.md` y se actualiza a las rutas nuevas (`python generador/generar_transacciones.py`, `pip install -r generador/requirements.txt`) y a `generador/fixtures.sh`. La raíz gana un README corto del tablero: qué es, el comando de instalación (lo corre el usuario), los scripts del gate y un enlace a `generador/README.md`.

## Risks / Trade-offs

- [Un `npm install` sin versiones fijas traería React 19, TypeScript 7, ESLint 10 y jsdom 30, todos incompatibles con el stack o la máquina] → comando exacto de D1; la tarea 1.1 comprueba las versiones resueltas.
- [Chromium no arranca por bibliotecas del sistema que faltan] → D1 las pide al usuario; la suite de sistema del grupo 2 es la prueba.
- [Prettier o ESLint reescriben o rechazan archivos de la mecánica] → D3; la tarea 1.4 lo cubre.
- [Una semilla cuya respuesta `-v` no se ve en los datos rompería la demo y el test de semillas de la fase 4] → test de integridad (D8, tarea 3.5).
- [El generador «se mueve» con un cambio sutil] → la mudanza es `git mv` puro (rename al 100 %), y la tarea 3.1 compara la salida antes y después con la misma semilla.
- [Faker o Python distintos cambian los CSV al regenerar] → `requirements.txt` fija Faker; el README del generador lo dice.
- [`package-lock.json` infla el diff del grupo 1 en miles de líneas] → no cuenta para el tamaño del grupo; crítico y PM lo revisan solo para confirmar que coincide con `package.json`.
- [`.claude/da/da worktree montar` usa `origin/main` como base por defecto y el repo tiene `master`] → el PM pasa siempre `--desde <base>` (la base de esta ola no es la rama principal).
