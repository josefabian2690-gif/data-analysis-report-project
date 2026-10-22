# Proposal

## Why

La fase 1 de `docs/PLAN.md` («Cargar y ver el mes») es el primer valor del tablero: hoy el proyecto solo sirve una página vacía con `vite preview` y no existe ni `src/dominio/` ni `src/servidor/`, así que un CSV del generador no se puede leer. Esta fase entrega el camino mínimo de punta a punta: `npm start`, cargar el CSV, ver qué filas se descartaron y por qué, los KPIs del mes y el gasto por categoría con la dominante a la vista. Gobiernan las reglas R-01 a R-08, R-11, R-12 y R-17 de `docs/DOMINIO.md`.

## What Changes

- **Dominio (nuevo, puro):** esquema de `Transaccion` en `src/dominio/esquema.ts`; `parsearCsv(texto)` con columnas obligatorias y opcionales (R-01, R-02), fechas con y sin hora (R-03), montos (R-04), filas inválidas reportadas con fila y motivo (R-05), id repetido (R-06), coordenadas fuera de rango (R-07) y el mes por mayoría (R-08), más los casos borde de carga de `docs/DOMINIO.md` (CSV vacío o solo encabezado, mes sin filas válidas, BOM y acentos, comas entre comillas). La carga pide confirmación si las inválidas superan el 5 % (R-05).
- **Métricas del mes:** los cinco KPIs de R-11 y el gasto por categoría con porcentajes sobre el monto (R-12). Las demás series (día, hora, día de la semana, zona, cuenta) llegan en la fase 2.
- **Presentación es-MX (R-17):** montos `$12,345.67` y fechas `15/09/2026`, en el dominio.
- **Gráficas:** `porCategoria(m)` construye la opción de ECharts del gasto por categoría.
- **Cliente:** elegir un CSV, ver el rechazo o el resumen de validación con las filas inválidas, confirmar si superan el 5 %, y el tablero del mes con KPIs y gasto por categoría (gráfica más una lista accesible ordenada, donde la dominante va primero y destacada).
- **Servidor y arranque:** `npm start` construye lo que falte o esté viejo, sirve el bundle con `node:http` **escuchando únicamente en 127.0.0.1** y abre el navegador. Sin API del historial (fase 3).
- **Suite de sistema:** pasa de `vite preview` a `npm start`; nueva prueba del flujo principal (cargar el fixture de semilla con filas inválidas añadidas en memoria y ver la validación, los KPIs y la categoría dominante), sin peticiones fuera de 127.0.0.1.
- **Deuda de la fase 0 que esta fase absorbe** (`docs/olas/fase-0.md`, *Deuda*): un test que demuestra que el servidor escucha solo en 127.0.0.1; la regla de lint que obliga a importar `test` de `tests/sistema/sin-red.ts` cubre también el import por defecto de `@playwright/test` y el paquete `playwright/test`.
- **Fixtures hechos a mano y pequeños** en `tests/fixtures/` (con BOM, sin columnas opcionales, con filas inválidas, con filas de otro mes, con comas entre comillas), como anuncia `docs/ARQUITECTURA.md`, *Pruebas*.
- Fuera de alcance (`docs/PLAN.md`, fase 1): filtros, historial y su API, el resto de las gráficas, tabla de transacciones, mapa, hallazgos (incluido el hallazgo «categoría dominante» de R-16), exportar.

## Interpretación del entregable

El PLAN dice «al subir el fixture de semilla se ven la validación con las filas inválidas». Los tres fixtures del generador no tienen ninguna fila inválida (comprobado: 0 montos ≤ 0, 0 id repetidos, 0 filas de otro mes, 0 coordenadas fuera de rango en cada uno). Se entrega así:

- La prueba de sistema carga el fixture de semilla `2026-07` con unas pocas filas inválidas añadidas en memoria (menos del 5 %), sin escribir otro archivo: se ve la validación con esas filas, los KPIs del mes y la categoría dominante del `*.esperado.json`.
- En la demo manual, el fixture de semilla tal cual muestra «0 filas inválidas», y un fixture hecho a mano muestra la lista de inválidas.
- El generador no cambia (fuera de alcance del PLAN).

## Capabilities

### New Capabilities
- `carga-de-csv`: leer un CSV con el formato del generador y convertirlo en las transacciones de un mes, con el reporte de filas inválidas y los rechazos (R-01 a R-08 y sus casos borde).
- `metricas-del-mes`: los KPIs y el gasto por categoría de un conjunto de transacciones (R-11, R-12).
- `presentacion-es-mx`: el formato visible de montos y fechas (R-17).
- `tablero-del-mes`: la página donde el analista carga un CSV y ve la validación, los KPIs y el gasto por categoría.
- `arranque-local`: `npm start` en un solo comando: construye, sirve el bundle solo en 127.0.0.1 y abre el navegador.

### Modified Capabilities
- `sin-red` (la crea `fase-0-andamiaje`, aún sin archivar; esta fase solo **añade** un requisito): toda prueba de sistema queda bajo la vigilancia de peticiones, por cualquier forma de importar el `test` de Playwright.

## Impact

- **Nuevos:** `src/dominio/`, `src/graficas/`, `src/servidor/`; `tests/dominio/`, `tests/graficas/`, `tests/servidor/`; fixtures pequeños en `tests/fixtures/` (fuera de `tests/fixtures/generador/`); una spec de sistema nueva en `tests/sistema/`.
- **Modificados:** `src/cliente/` (`App.tsx`, `textos.ts` y componentes nuevos), `tests/cliente/`; `package.json` (scripts `start` y la construcción del servidor; ninguna dependencia nueva); `playwright.config.ts` (`webServer` → `npm start`); `eslint.config.mjs` (regla de imports de la suite de sistema e ignorar el bundle del servidor); `tests/arquitectura/sistema.test.ts`; `.gitignore` y `.prettierignore` (bundle del servidor). Puede tocarse `vite.config.mts` si la construcción del servidor lo exige.
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** se implementan `parsearCsv` y `metricas` con las firmas escritas. Aditivo y declarado en `design.md` (D4): el dominio exporta además el error `CargaRechazada` y la función `pideConfirmacion`; `FilaInvalida.motivo` es un código cerrado y el texto vive en `src/cliente/textos.ts`. `Metricas` nace con KPIs y gasto por categoría y crecerá en la fase 2.
- **Dependencias:** ninguna nueva. Todo lo que hace falta (Vite, `open`, Papa Parse, ECharts, React) quedó instalado en la fase 0.
- **No se toca:** `generador/` y `tests/fixtures/generador/`, `docs/`, `.claude/`, `openspec/specs/`, la API del historial.
- Una sola ola (`fase-1`) de 5 PRs internas.
