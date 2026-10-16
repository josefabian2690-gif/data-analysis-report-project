# Ola fase-2 — Dashboard completo, filtros y tabla

**Rama:** `ola/fase-2` · **Changes:** `fase-2-dashboard-filtros-y-tabla` · **Abierta:** 2026-10-16

## Arranque

- Base: `chore/fase-2-planning` @ `94cfdc2` (sobre `ola/fase-1` @ `35d5971`), por avance continuo del usuario; la PR de ola apunta a `chore/fase-2-planning`. Rama principal: `master`.
- `preflight`: 4/4 OK (gh auth, remoto y ramas `ola/*`, openspec, graft).
- `verify` sobre la base (`94cfdc2`): format:check, lint, typecheck, test y citas OK; 402 tests en 25 archivos.
- `sistema` sobre la base (`94cfdc2`): 2/2 (`flujo-principal.spec.ts`, `pagina-vacia.spec.ts`). Sin specs heredados inestables.
- OpenSpec: `fase-2-dashboard-filtros-y-tabla`, `state: ready`, 0/17, sin `context` ni `operationGuidance`. Leídos proposal, design, tasks y los cuatro deltas.
- `design.md` contrastado con el código: `metricas.ts:17-21` y `:76`, `fecha.ts:13`, `eslint.config.mjs:23` y `:71-84`, `App.tsx:62`, `tests/graficas/por-categoria.test.ts:7`, todo como dice. Cifras del fixture `2026-07-semilla-1` recalculadas por el PM con Papa Parse fuera del tablero: 1–10 de julio 590 y 458 549.33 (45 854.933); día 15, 125 y 107 565.60; total 1 689 470.67; mayor monto 12 990.00 «Renta departamento» 2026-07-01 08:55:23.
- Nada que pedir al usuario: ninguna dependencia, credencial ni `[PENDIENTE]` en la ola.

## PRs

| # | Grupo (change · tareas) | Rama | Estado |
|---|---|---|---|
| #17 | fase-2-dashboard-filtros-y-tabla · 1.1–1.5 | `feat/fase-2-domain-filters-series` | mergeada (`a74e9df`) — 0 mecánicas · 0 rondas · 0 por corrección; LISTA en la pasada 1 con 4 NO BLOQUEA cerrados en la pasada final trivial |
| — | fase-2-dashboard-filtros-y-tabla · 2.1–2.4 | `feat/fase-2-charts` | pendiente |
| — | fase-2-dashboard-filtros-y-tabla · 3.1–3.3 | `feat/fase-2-client-filters` | pendiente |
| — | fase-2-dashboard-filtros-y-tabla · 4.1–4.3 | `feat/fase-2-transactions-table` | pendiente |
| — | fase-2-dashboard-filtros-y-tabla · 5.1–5.2 | `feat/fase-2-client-charts-system` | pendiente |

## Decisiones del PM

- **D-TM1 (Team Manager).** Decisión 1 del pre-vuelo: (a), una sola ola de 5 PRs. Descartado: dos olas y 7 PRs.
- **D-TM2 (Team Manager).** Decisión 2: (a), de la deuda heredada entra solo el lint de «solo `import type` de `echarts`» en `graficas` (2.1) y la barra única (2.2). Descartado: absorber además las comillas mal puestas y `FieldMismatch` de `carga.ts`.
- **D-TM3 (Team Manager).** Decisión 3: (a), `metricas(tx, periodo?)` y `periodoDelFiltro(mes, filtro)`. Descartado: `metricas(tx, filtro)` y el promedio en el cliente.
- **D-TM4 (Team Manager).** Decisión 4: (a), tabla paginada de 50 filas, sin virtualizar. Descartado: todas las filas en el DOM y `@tanstack/react-virtual`.
- **D-TM5 (Team Manager).** Decisión 5: (a) y (a), fechas del filtro en listas con R-17 y gráfica por día de la semana con el promedio por día. Descartado: `<input type="date">` y el total por día de la semana.
- Las cinco coinciden con lo escrito en `design.md`: no hace falta `openspec-update-change`.
- **Nombres del dominio (PR #17):** `Periodo { desde, hasta }` vive en `src/dominio/calendario.ts`; un periodo de 0 días es uno con `desde > hasta` (no se normaliza), distinto de no pasar periodo. `DiaDeLaSemana` es 0 = lunes … 6 = domingo. Series: `gastoPorDia`, `gastoPorHora` + `transaccionesSinHora`, `gastoPorDiaDeLaSemana`, `gastoPorZona`, `gastoPorCuenta`. Descartado: periodo opcional con `null` para el vacío.
- **Transacciones fuera del periodo (PR #17):** cuentan en `gastoTotal`, hora, zona y cuenta, pero no en las series por día y por día de la semana. Aceptado con el crítico: el cliente pasa el mismo filtro a `filtrar` y a `periodoDelFiltro`, así que lo filtrado siempre cae dentro del periodo. Descartado: recortar `tx` al periodo dentro de `metricas` (mezcla filtrar y medir, D2).
- **Pasada final de #17 trivial, sin otra pasada del crítico:** solo tests unitarios y un comentario; se repitió `sistema` porque tocó un archivo de producto.
- **El escenario «Las opciones no desaparecen al filtrar» se protege en el cliente (grupo 3):** en el dominio solo puede afirmarse que `opcionesDeFiltro` usa lo que recibe.

## Deuda

- —

## Se coló

- —

## Lo que queda fuera

- Deuda heredada de la fase 1 no absorbida (D-TM2): comillas mal puestas y `FieldMismatch` en `src/dominio/carga.ts`, el literal `'dist'` de `src/servidor/main.ts`, el aviso de archivo ilegible de `src/cliente/App.tsx` y los detalles visuales de #13. Siguen en `docs/olas/fase-1.md`, *Deuda*.

## Entorno vivo

- Worktree del PM: `/home/fabs/da-wt/tablero-gastos/pm-fase-2` (`ola/fase-2`).

## Coste

- —

## Handover

- —
