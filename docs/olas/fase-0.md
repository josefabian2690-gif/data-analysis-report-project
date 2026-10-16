# Ola fase-0 — Andamiaje y mecánica

**Rama:** `ola/fase-0` (desde `chore/fase-0-planning` @ `7598242`) · **Changes:** `fase-0-andamiaje` · **Abierta:** 2026-10-15

## Arranque

- `preflight`: 4/4 OK (`gh auth` con scopes `repo` y `workflow`, remoto y ramas `ola/*` sin otra ola activa, `openspec`, `graft`).
- `verify` sobre la base (`chore/fase-0-planning` @ `7598242`): **rojo por diseño**, no heredado. No hay `package.json` hasta el grupo 1 (`npm ERR! enoent ... package.json`). Estado de partida, no fallo.
- `sistema` sobre la base: no existe hasta el grupo 2. Sin specs heredados inestables.
- `openspec validate fase-0-andamiaje --strict`: válido. `instructions apply`: `state: ready`, 0/12, sin `context` ni `operationGuidance`.
- `.claude/da/da doctor`: 41 OK · 0 FALLA · 1 AVISO.
- Diseño contrastado con el código y el registro de npm (2026-10-15):
  - `generar_transacciones.py:24` importa `configuracion` como hermano; `:451` escribe en `output/` relativo al cwd; `:405-412` `--mes` por defecto es el mes anterior; `:369-392` `-v` imprime texto. Existe `--salida` (`args.salida`, `:451`).
  - `.venv/bin/python` de la raíz principal: Python 3.14.4 con Faker 40.43.0. **No existe dentro de los worktrees**: el grupo 3 pasa `PYTHON=<raíz principal>/.venv/bin/python`.
  - Versiones de D1 resueltas en el registro: vite 8.3.4 (node `>=22.12`), vitest 5.0.5 (peer vite `^6.4‖^7‖^8`), `@vitejs/plugin-react` 6.1.2 (peer vite `^8`), jsdom 29.1.1 (node `^22.13`), typescript 5.9.3, typescript-eslint 8.71.2 (peer ts `<6.1`, eslint `^9`), eslint-plugin-import 2.32.0 (eslint `^9`), `@testing-library/jest-dom` 7.0.1 (node `>=22`), `@playwright/test` 1.64.1. Node 22.22.1, npm 9.2.0: compatibles.
  - Bibliotecas de Chromium que faltan por `ldconfig -p`: `libnss3`, `libnspr4` (dependencia de la anterior) y `libasound`. El resto (atk, cups, drm, gbm, xkbcommon, pango, cairo, X11…) está.
- Alcanzabilidad: grupo 1 alcanzable tras la instalación del usuario; grupo 2 tras el 1 y los navegadores; grupo 3 tras el 1 (su test corre en Vitest). Grafo: 1 → {2, 3}.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| — | fase-0-andamiaje · 1.1–1.5 | `feat/fase-0-node-scaffold` | en espera de la instalación del usuario |
| — | fase-0-andamiaje · 2.1–2.2 | `test/fase-0-system-suite` | pendiente |
| — | fase-0-andamiaje · 3.1–3.5 | `chore/fase-0-generator-fixtures` | pendiente |

## Decisiones del PM

- **D-TM1 (Team Manager).** `master` frente a `main`: opción (c). En la fase 0 no se toca la mecánica; el PM pasa siempre `--desde` explícito al montar worktrees. Renombre o `proyecto.ramaPrincipal` se plantean al usuario entre olas. Descartadas: (a) renombrar a `main`, (b) declarar `ramaPrincipal: master`.
- **D-TM2 (Team Manager).** La fase 0 incluye la suite de sistema mínima (grupo 2). Descartado: dejarla para la fase 1.
- **D-TM3 (Team Manager).** Se instala ahora todo el stack de `docs/STACK.md` (D1). Descartado: instalar por fase.
- **D-TM4 (Team Manager).** La corrección del `[PENDIENTE]` de fixtures de `docs/PLAN.md` va en la PR #4, aparte; la ola trata el fixture como decidido según el brief.
- **Excepción de montaje (D2).** El worktree del PM (`ola/fase-0`) y el del grupo 1 se crean con `git worktree add`, no con `.claude/da/da worktree montar`: su gancho `preparar` (`npm ci`) falla sin `package-lock.json`. La comprobación L0 del grupo 1 se hace a mano tras la instalación. Descartado: montar con la mecánica (falla).
- **El grupo 3 no arranca antes de mergear el 1.** El Team Manager sugirió adelantarlo si el grafo lo permitía; `tasks.md` declara que depende del 1 (su test corre en Vitest). Descartado: encargar 3.1, 3.2 y 3.4 antes y rebasar luego (paralelismo que el grafo no declara).
- **Grupos 2 y 3 en paralelo tras mergear el 1**, con revisión y merge en serie (2 primero). El grafo los declara independientes y sus áreas son disjuntas (2: `playwright.config.ts`, `tests/sistema/`, script `test:sistema`; 3: `generador/`, `tests/fixtures/`, `README.md`, `.gitattributes`); el test de integridad entra por el `include` de Vitest del grupo 1 sin tocar su configuración. Si un encargo necesita tocar un archivo del otro, se para y se serializa. Descartado: en serie (más tiempo de reloj sin reducir riesgo).

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- —

## Entorno vivo

- Worktree del PM: `.claude/worktrees/pm-fase-0` (`ola/fase-0`).
- Worktree del grupo 1: `.claude/worktrees/g1-node-scaffold` (`feat/fase-0-node-scaffold`), esperando la instalación del usuario.

## Coste

- —

## Handover

- —
