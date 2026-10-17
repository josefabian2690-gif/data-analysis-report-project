# Proposal

## Why

Tras la fase 2 el tablero olvida el mes en cuanto se cierra la página: no hay historial y no se puede comparar un mes con otro. La fase 3 de `docs/PLAN.md` («Historial y comparación») guarda los meses en disco a través del servidor local, los conserva tras reiniciar, pide confirmación al reemplazar uno (R-09, 409) y compara meses por categoría y en el total (R-15). Es la primera fase con I/O real en el servidor y la primera en que la página envía datos, siempre a 127.0.0.1.

## What Changes

- **Esquema en tiempo de ejecución (dominio):** una función pura que valida un valor JSON desconocido como `Transaccion[]` de un mes (`AAAA-MM`), para que la API se valide con el esquema del dominio en los dos extremos (`docs/ARQUITECTURA.md`, *API del historial*). Vive en `src/dominio/esquema.ts`, único dueño del esquema.
- **Comparación (R-15, dominio):** `comparar(meses)` con la firma de `docs/ARQUITECTURA.md`: diferencia absoluta y porcentual por categoría y en el total, con la categoría ausente contada como 0; y el formato con signo de esas diferencias (R-17).
- **Historial en el servidor:** almacén de meses en `historial/AAAA-MM.json` con escritura atómica (temporal y `rename`), carpeta cambiable con `TABLERO_HISTORIAL`, y las cuatro rutas de la API (`GET /api/meses`, `GET`, `PUT` y `DELETE /api/meses/:mes`) con 201, 409 sin `?reemplazar=1`, 200 al reemplazar, 204 y 404.
- **Gráfica de la comparación:** una función nueva en `src/graficas/` a partir de `Comparacion`.
- **Cliente:** al aceptar una carga, el mes se guarda en el historial; si ya existe, se pregunta si se reemplaza (R-09) sin ocultar el tablero; una vista de historial lista los meses guardados (mes, transacciones, gasto total) y compara dos de ellos con tabla y gráfica.
- **Suite de sistema:** una prueba nueva que guarda tres meses (semillas 1, 2 y 3), reinicia el servidor, comprueba que siguen ahí, compara dos y recorre el 409; la suite nunca escribe en el `historial/` del repositorio.
- **Lo que cambia de las fases anteriores (declarado):**
  - `tablero-del-mes`, «Elegir un CSV»: el texto del CSV sigue sin salir del navegador, pero las transacciones del mes aceptado sí viajan al servidor local (`PUT /api/meses/:mes` en 127.0.0.1). `tests/sistema/flujo-principal.spec.ts` deja de exigir «ninguna petición distinta de GET».
  - `arranque-local`, «Sirve solo el bundle»: el servidor sirve además la API del historial bajo `/api/`.
  - `sin-red`: la vigilancia de la suite evalúa también las peticiones que la página dispara después de la última aserción (aplazado de la fase 1 a esta, `docs/olas/fase-1.md`, *Lo que queda fuera*).
- **Deuda que se absorbe** (`docs/olas/fase-2.md`, *Deuda*):
  - La marca de post-quincena de la gráfica por día, que hoy se distingue casi solo por el color (R-13, requisito «una marca que no dependa solo del color» de `tablero-del-mes`).
  - La descripción accesible de la gráfica nueva no añade una tercera copia de `conDescripcion`.
- **Fuera de alcance** (`docs/PLAN.md`, fase 3): mapa, hallazgos (R-16), exportar. Tampoco entran: abrir en el tablero un mes guardado, borrar meses desde la página (la API sí tiene `DELETE`), comparar con filtros aplicados, ni recrear menos instancias de ECharts en `src/cliente/Grafica.tsx`.

## Interpretación del entregable

- «Se guardan 2 o 3 meses (semillas distintas)»: los fixtures `2026-07-semilla-1`, `2026-08-semilla-2` y `2026-09-semilla-3` de `tests/fixtures/generador/`, cargados uno tras otro.
- «Se reinicia y siguen ahí»: el proceso del servidor se detiene y se vuelve a arrancar con la misma carpeta de historial, y la lista de la página muestra los tres meses con sus transacciones y su gasto total.
- «Comparación por categoría y totales»: dos meses del historial, elegidos en la página, con monto de cada mes, diferencia absoluta y porcentual por categoría y en el total (R-15).
- «Reemplazar un mes pide confirmación (409)»: cargar otra vez un mes guardado muestra la pregunta; reemplazar guarda la versión nueva y conservar deja la guardada.

## Capabilities

Las capacidades `tablero-del-mes`, `arranque-local` y `sin-red` las crean `fase-0-andamiaje` y `fase-1-cargar-y-ver-el-mes`, aún sin archivar; este change se archiva después de ellos y de `fase-2-dashboard-filtros-y-tabla`.

### New Capabilities
- `historial-de-meses`: la API y el almacenamiento de los meses en disco (escritura atómica, 409 al reemplazar, validación con el esquema del dominio) y, en la página, el guardado al cargar, la pregunta de reemplazo (R-09) y la lista de meses guardados.
- `comparacion-de-meses`: la diferencia por categoría y en el total entre dos meses (R-15), su tabla y su gráfica en la página.

### Modified Capabilities
- `tablero-del-mes`: «Elegir un CSV» admite que las transacciones del mes aceptado viajen al servidor local; el texto del archivo sigue sin salir del navegador. El flujo principal de sistema lo refleja.
- `arranque-local`: «Sirve solo el bundle» pasa a servir el bundle y la API del historial.
- `sin-red`: la vigilancia de peticiones de la suite cubre también las que se disparan tras la última aserción.

## Impact

- **Nuevos:**
  - `src/dominio/`: validación de `Transaccion[]` en `esquema.ts`; un módulo de comparación; formatos con signo en `formato.ts`.
  - `src/servidor/`: almacén de meses y API del historial.
  - `src/graficas/`: la gráfica de la comparación.
  - `src/cliente/`: cliente HTTP del historial, guardado y pregunta de reemplazo, vista de historial y comparación.
  - Sus tests en `tests/dominio/`, `tests/servidor/`, `tests/graficas/`, `tests/cliente/`; una spec nueva en `tests/sistema/`.
- **Modificados:**
  - `src/servidor/config.ts`, `startup.ts`, `static-server.ts`, `main.ts` (carpeta del historial y rutas `/api/`); `tests/servidor/config.test.ts` (compara la `Config` entera con `toEqual`), `tests/servidor/ayudas.ts` (`pedir` sin cuerpo).
  - `src/graficas/estilo.ts` (marca de post-quincena) y su test en `tests/graficas/por-dia.test.ts`.
  - `src/cliente/App.tsx`, `main.tsx`, `textos.ts`, `estilos.css`, `opciones-de-graficas.ts`, `GastoPorCategoria.tsx`.
  - Los 12 archivos de `tests/cliente/` que montan `<App />` (37 sitios): `App` recibe el cliente del historial y los tests le pasan uno falso en memoria.
  - `playwright.config.ts` (historial temporal para `npm start`), `tests/sistema/flujo-principal.spec.ts` (la petición de guardado), `tests/sistema/sin-red.ts` (peticiones tardías).
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `comparar(meses)` y las cuatro rutas con los códigos escritos. Añadidos declarados en `design.md`: la función de validación del esquema, los formatos con signo, la forma de `Comparacion`, los códigos 400, 403, 413 y 415 de la API, y la función de `graficas` de la comparación.
- **Dependencias:** ninguna nueva (`node:fs/promises`, `node:http`, `node:os` y `node:path` bastan).
- **No se toca:** `generador/`, `tests/fixtures/`, `docs/`, `.claude/`, `openspec/specs/`, `package.json`, `vite.config.mts`, `eslint.config.mjs`.
- Una sola ola (`fase-3`) de 5 PRs internas.
