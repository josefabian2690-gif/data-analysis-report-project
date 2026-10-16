# Proposal

## Why

La fase 0 de `docs/PLAN.md` («Andamiaje y mecánica») es la condición para todas las demás: hoy el repositorio solo contiene el generador de Python en la raíz y ningún proyecto Node, así que `.claude/da/da verify` no puede correr y ninguna fase de producto puede empezar con TDD. Además, las fases 1 a 4 dependen de fixtures del generador con semilla cuyo patrón (`-v`) sea observable en el propio CSV.

## What Changes

- El generador de Python se mueve de la raíz a `generador/` **sin cambios de lógica** (`generar_transacciones.py`, `configuracion.py`, `requirements.txt`), con su README movido y actualizado a la nueva ruta. La raíz gana un README corto del tablero.
- Nuevo `generador/fixtures.sh`: regenera, con un intérprete de Python que ya tenga Faker, los tres fixtures del generador y su `*.esperado.json` (la respuesta de `-v` en JSON). Es el único punto del repositorio que ejecuta el generador.
- Se commitean **3 fixtures del generador de 2 000 filas** (~250 KB cada uno) con semillas distintas y meses distintos, en `tests/fixtures/` (decisión del usuario, 2026-10-15). Sirven a los tests de dominio, al test de semillas de la fase 4 y a la demo del historial de la fase 3.
- Un test de integridad de fixtures comprueba, por la interfaz pública de los archivos, que cada patrón declarado en el `*.esperado.json` es observable en su CSV según las definiciones de `docs/DOMINIO.md` (R-16).
- Proyecto Node/TypeScript/Vite/React con una página vacía en `src/cliente/`, y los scripts del gate (`format:check`, `lint`, `typecheck`, `test`) más `build`, `dev` y `test:sistema`.
- ESLint hace cumplir la tabla de capas de `docs/ARQUITECTURA.md` y la prohibición de I/O en `dominio`, `graficas` y `reporte`; un test de arquitectura demuestra que la regla rechaza un import prohibido.
- Primera prueba de la suite de sistema (`sistema`): la página vacía se sirve desde el bundle en 127.0.0.1 y la prueba falla si alguna petición sale de 127.0.0.1.
- Fuera de alcance: cualquier funcionalidad del tablero (parseo, métricas, servidor del historial, `npm start`); los fixtures hechos a mano (llegan con la fase 1, junto a las reglas que ejercitan).

## Capabilities

### New Capabilities
- `arquitectura-por-capas`: la tabla de capas de `docs/ARQUITECTURA.md` y la ausencia de I/O en las capas puras, aplicadas por el lint del gate.
- `sin-red`: la página se sirve solo desde 127.0.0.1 y ninguna petición en ejecución sale de la máquina; lo vigila la suite de sistema.
- `fixtures-del-generador`: el generador vive aparte en `generador/`, se regenera con `generador/fixtures.sh` y sus fixtures con semilla declaran una respuesta observable en los datos.

### Modified Capabilities
- (ninguna; `openspec/specs/` está vacío)

## Impact

- Se mueven (rename sin cambios): `generar_transacciones.py`, `configuracion.py`, `requirements.txt`, `README.md` → `generador/`.
- Nuevos: `package.json`, `package-lock.json`, configuración de TypeScript, Vite, Vitest, ESLint, Prettier y Playwright en la raíz; `index.html`; `src/cliente/`; `tests/arquitectura/`, `tests/cliente/`, `tests/sistema/`, `tests/fixtures/`; `generador/fixtures.sh`; `README.md` de la raíz.
- `.gitignore` puede ganar entradas de artefactos de build y de Playwright (`dist/`, `test-results/`, `playwright-report/`).
- Dependencias nuevas: las de `docs/STACK.md`, con las versiones exactas que fija esta fase. **Las instala el usuario** (CLAUDE.md, *Reglas de proceso* 5), igual que los navegadores de Playwright y las bibliotecas del sistema que Chromium necesita.
- No se toca: `docs/`, `.claude/`, `openspec/specs/`, la lógica del generador.
- Una sola ola (`fase-0`) de 3 PRs internas.
