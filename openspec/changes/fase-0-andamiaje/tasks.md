# Tasks

Una sola ola (`fase-0`), 3 PRs internas, una por grupo. Grafo: el grupo 1 va primero; los grupos 2 y 3 dependen solo del 1 y tocan archivos disjuntos (el 2: `playwright.config.ts`, `tests/sistema/` y el script `test:sistema` de `package.json`; el 3: `generador/`, `tests/fixtures/`, `README.md` y `.gitattributes`), así que pueden ir en paralelo o en serie. Regla de la fase: ninguna funcionalidad del tablero; el generador no cambia de lógica.

## 1. Proyecto Node con la página vacía y el gate en verde

Arranca con la instalación del usuario de `design.md` D1 dentro del worktree del grupo (D2). Áreas: raíz del proyecto, `src/cliente/`, `tests/cliente/`, `tests/arquitectura/`.

- [x] 1.1 Completar `package.json` (nombre, `private`, sin `"type": "module"` (D2), `engines.node`, scripts `format:check`, `lint`, `typecheck`, `test`, `build`, `dev`) sin cambiar las dependencias que instaló el usuario; verificar que las versiones resueltas en `package-lock.json` son React 18, TypeScript 5, ESLint 9 y jsdom 29, y que ningún script usa `npx`
- [x] 1.2 Configurar TypeScript estricto, Vite (127.0.0.1, puerto fijo, `strictPort`, en `server` y `preview`) y Vitest (`tests/**/*.test.{ts,tsx}` sin `tests/sistema/`, `jsdom` para `tests/cliente/`); verificar con `npm run typecheck` y `npm test` en verde
- [x] 1.3 Página vacía: test de componente primero (`tests/cliente/`) que encuentra el encabezado por rol y nombre accesible del catálogo `src/cliente/textos.ts`; luego `index.html`, `src/cliente/main.tsx`, el componente raíz y `textos.ts`, sin fuentes ni assets remotos; verificar que el test falla sin el encabezado y pasa con él
- [x] 1.4 Prettier y ESLint limitados al proyecto Node con las exclusiones de D3 (más `dist/`, `test-results/` y `playwright-report/` en `.gitignore`); verificar `npm run format:check` y `npm run lint` en verde, y que `.claude/da/da doctor` sigue sin FALLA (ningún archivo generado reescrito)
- [x] 1.5 Test de arquitectura primero (`tests/arquitectura/`): contra la configuración real de ESLint, un import `dominio → cliente` y uno `cliente → servidor` dan error, `graficas → dominio` no; `node:fs` en `dominio`, `Date.now()` en `graficas` y `process.env` en `reporte` dan error (spec `arquitectura-por-capas`); luego las reglas de D4 en la configuración de ESLint; verificar que el test falla al quitar cada regla y pasa con ella

## 2. Suite de sistema: la página vacía, sin red

Depende del grupo 1. Área: `tests/sistema/` y `playwright.config.ts`.

- [x] 2.1 Configurar Playwright (`playwright.config.ts`) con `webServer` = `vite preview` del bundle construido en 127.0.0.1 y el script `test:sistema`; verificar que `.claude/da/da sistema` construye, levanta el servidor y lo baja al terminar
- [x] 2.2 Prueba de sistema `tests/sistema/`: abre la página, encuentra el encabezado por su nombre accesible y falla nombrando cualquier petición cuyo host no sea 127.0.0.1 (spec `sin-red`); verificar que pasa sobre la página vacía y que falla si se añade temporalmente un `<link>` a una fuente web externa en `index.html` (mutación que no se commitea)

## 3. Generador en `generador/` y fixtures con semilla

Depende del grupo 1 (el test de integridad corre en Vitest). Área: `generador/`, `tests/fixtures/`, `README.md`, `.gitattributes`. Lo verifica el intérprete `.venv/bin/python`, que ya tiene Faker.

- [x] 3.1 Mover con `git mv` `generar_transacciones.py`, `configuracion.py` y `requirements.txt` a `generador/` sin editar su contenido; verificar que `git diff -M --stat` los muestra como renombres al 100 % y que la salida con `-n 2000 --mes 2026-07 --semilla 1` es idéntica byte a byte antes y después de la mudanza
- [x] 3.2 Mover `README.md` a `generador/README.md` y actualizar rutas y comandos (incluido `generador/fixtures.sh`); escribir el `README.md` corto de la raíz (D9); verificar que cada comando documentado corre tal cual desde la raíz y que `.claude/da/da citas` queda limpio
- [x] 3.3 Test de integridad primero (`tests/fixtures/`): para cada `tests/fixtures/generador/*.csv` exige su `*.esperado.json`, 2 000 filas, meses distintos entre los tres, y que categoría dominante (≥ 35 %), zona favorita (mayor gasto local en Comida y Entretenimiento) y viaje (≤ 4 días consecutivos dentro del rango esperado) se observan en el CSV (spec `fixtures-del-generador`); verificar que falla sin fixtures y con un esperado alterado (p. ej. otra zona favorita)
- [x] 3.4 Escribir `generador/fixtures.sh` (D8): intérprete configurable con comprobación de Faker, `--mes` explícito, salida a un temporal y reemplazo al final, `-v` convertido a `*.esperado.json`; verificar que con un `PYTHON` sin Faker sale con código distinto de cero y no toca `tests/fixtures/generador/`
- [x] 3.5 Generar y commitear los 3 fixtures (`2026-07`, `2026-08`, `2026-09`; 2 000 filas; semillas distintas con categorías dominantes distintas) y `.gitattributes` con `-text` para esos CSV; verificar que el test de integridad pasa y que correr `generador/fixtures.sh` otra vez deja `git status` limpio en `tests/fixtures/`
