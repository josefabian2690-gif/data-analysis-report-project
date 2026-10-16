# Plantilla — encargo al crítico

Rellena **todos** los huecos `{…}`. El reglamento del crítico —qué revisa, las comprobaciones mecánicas, la pasada siguiente y qué entrega— es el skill `desarrollo-autonomo-critico` (lo precarga su definición de agente; si no está en tu contexto, invócalo antes de seguir). Este encargo trae solo lo variable. No le listes `CLAUDE.md` (ya está en su contexto) ni `proposal.md`.

---

Eres el CRÍTICO de la PR #{n} del proyecto "tablero-gastos" (`{enlace de la PR}`).

# Qué revisar

{Cómo leer el diff: `gh pr diff {n}`, o `git -C {worktree} diff` + `git status` si hay archivos sin trackear.}

Es el **grupo {n} ("{título}")** del change `{change}`.

# Contexto de lectura

- `openspec/changes/{change}/design.md` (secciones {las que gobiernan este grupo}), `specs/{capability}/spec.md` (requisitos {cuáles}), `tasks.md` (grupo {n})
{- las lecturas del área del grupo, las mismas que recibió el implementador —el dominio: `docs/ARQUITECTURA.md` y `docs/DOMINIO.md`; las gráficas: `docs/ARQUITECTURA.md` y `docs/DOMINIO.md`; el reporte: `docs/ARQUITECTURA.md`; el cliente: `docs/ARQUITECTURA.md` y `docs/DOMINIO.md`; el servidor: `docs/ARQUITECTURA.md (sección Contratos: API del historial y Almacenamiento)`; el generador: `docs/ARQUITECTURA.md`—}
{- los skills del área que el implementador invocó —el dominio: `typescript-advanced-types`, `vitest` y `javascript-testing-patterns`; las gráficas: `typescript-advanced-types` y `vitest`; el reporte: `typescript-advanced-types` y `vitest`; el cliente: `typescript-advanced-types`, `vitest`, `vercel-react-best-practices` y `javascript-testing-patterns`; el servidor: `typescript-advanced-types`, `vitest` y `nodejs-backend-patterns`; el generador: ninguno—, para juzgar con el mismo criterio}

# Criterios de aceptación

{Lista literal de `tasks.md`, con número.}

{Si la PR trae capturas en `imgs/screenshots/{n}/`: míralas una por una (skill, *Capturas*).}

# Dónde mirar con lupa — mínimo, no límite

{Lo escribe el PM: cada punto como pregunta concreta.}

Tu veredicto cabe en **80 líneas o menos** (`desarrollo-autonomo-critico`, *Qué entregar*).

{Si es una pasada siguiente, añade:}

# Pasada siguiente — revisa la corrección, no el original

Hallazgos de tu pasada anterior, con lo que hizo el PM:

{Lista literal: severidad, hallazgo, y CORREGIDO / RECHAZADO POR EL PM con su razón.}
