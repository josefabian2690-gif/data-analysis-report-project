# Design

## Context

Estado de partida (ver proposal.md, *Why*): la fase 0 dejó un proyecto Node/TS/Vite/React sin `"type": "module"`, con una página vacía en `src/cliente/`, el lint de capas y de pureza en `eslint.config.mjs`, la suite de sistema sobre `vite preview` (`playwright.config.ts`) con la vigilancia de peticiones de `tests/sistema/sin-red.ts`, y los tres fixtures del generador en `tests/fixtures/generador/`. No existen `src/dominio/`, `src/graficas/` ni `src/servidor/`, ni el script `start`. Todo el stack de `docs/STACK.md` está instalado con versiones exactas (`package.json`).

Restricciones verificadas en la máquina el 2026-10-16:

- El Node del sistema (`/usr/bin/node`, 22.22.1) **no ejecuta TypeScript**: `process.features.typescript` es `false`; `node archivo.ts` falla con `ERR_UNKNOWN_FILE_EXTENSION`, también con `--experimental-strip-types`.
- Vite 8.3.4 construye una entrada TypeScript de servidor (`build.ssr`) a un `.mjs` que corre con ese Node en un paquete sin `"type"`, importando `node:http`, `open` y un módulo de dominio que usa Papa Parse.
- ECharts 6.1.0 en jsdom: el renderizador `canvas` falla (`Cannot set properties of null (setting 'dpr')`); el `svg` inicializa y pone la descripción `aria-label` en el contenedor.
- `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })` da `$12,345.68`, `$900.00` y `$1,689,470.67`; con `style: 'percent'` y un decimal da `48.2%`.
- Los tres fixtures del generador no tienen filas inválidas. El de `2026-07` suma `1689470.67` en 2 000 filas, con Compras al 48.2 %.

## Goals / Non-Goals

**Goals:**
- El dominio carga y mide un mes sin I/O, con un test que nombra cada regla R-01 a R-08, R-11, R-12 y R-17.
- `npm start` cumple la regla innegociable 2 de `CLAUDE.md` y lo demuestra un test del gate (deuda de la fase 0).
- La suite de sistema corre contra el arranque real.

**Non-Goals:**
- API del historial, guardar meses, `TABLERO_HISTORIAL` (fase 3).
- Filtros y el periodo filtrado del promedio diario (fase 2).
- Hallazgos de R-16, aunque la dominante «salte a la vista»: aquí es solo orden y énfasis visual.
- Procesar el CSV fuera del hilo principal (Web Worker): 20 000 filas en Papa Parse caben en el hilo principal.
- Vigilar WebSockets y peticiones posteriores al cuerpo de la prueba en la suite de sistema (D11).

## Decisions

### D1. Sin dependencias nuevas: el servidor se construye con Vite

El código de `src/servidor/` es TypeScript y se construye con Vite en modo SSR a un `.mjs` que Node ejecuta. Las dependencias de `node_modules` quedan externas (comportamiento por defecto de SSR), así que `open` se resuelve en tiempo de ejecución y el dominio entra en el bundle cuando el servidor lo importe (fase 3).

- El bundle del servidor va en una carpeta propia que la construcción del cliente no vacía (la del cliente es `dist/` con `emptyOutDir`). Esa carpeta entra en `.gitignore`, `.prettierignore` y los `ignores` de `eslint.config.mjs`.
- Los scripts no usan `npx` (`CLAUDE.md`, *Comandos*).

Alternativas descartadas:
- `tsx`: dependencia nueva que instala el usuario, y que Vite ya cubre.
- Servidor en `.mjs` con JSDoc: se rompe en la fase 3, cuando el servidor importa el dominio en `.ts`.
- `tsc` con emisión: `moduleResolution: Bundler` admite imports sin extensión, que Node ESM no resuelve.
- Activar el «type stripping» de Node: este binario no lo trae.

### D2. `npm start`: construir lo que haga falta, servir y abrir

`npm start` construye primero el bundle del servidor (pequeño, siempre) y lo ejecuta. Ese arranque:

1. Decide si el bundle del navegador falta o está viejo con una **función pura**: recibe la fecha de modificación del `index.html` construido (o su ausencia) y las de las fuentes (`src/`, `index.html`, `vite.config.mts`, `package-lock.json`), y devuelve si hay que construir.
2. Si hay que construir, corre `vite build` como proceso hijo desde `node_modules/.bin` y espera a que termine; si falla, el arranque termina con su código.
3. Escucha (D3) y, si `TABLERO_SIN_NAVEGADOR` no vale `1`, abre el navegador con `open` en la URL del tablero.

La lectura del entorno, los `stat` y el proceso hijo son una cáscara delgada; quien abre el navegador se inyecta, para que el test compruebe que con `TABLERO_SIN_NAVEGADOR=1` no se llama.

Alternativa descartada: construir siempre los dos bundles. Es más simple, pero `docs/STACK.md` (*Decisión*) dice «si falta o está viejo», y en el checkout principal (bajo `/mnt/c`) cada construcción del cliente cuesta segundos de más en cada arranque.

### D3. Servidor `node:http` en 127.0.0.1

- La dirección es la constante `127.0.0.1`, sin variable que la cambie. El puerto es fijo por defecto (`4310`) y se cambia con `TABLERO_PUERTO`. Si está ocupado (`EADDRINUSE`), el arranque termina con código distinto de cero y un mensaje que nombra el puerto y la variable.
- La función pública que crea el servidor recibe la carpeta del bundle. El test escucha en el puerto 0 y comprueba que `address().address` es `127.0.0.1`. Esa es la guarda que la fase 0 dejó como deuda: falla si alguien cambia el host a `0.0.0.0` o a `localhost`.
- Archivos estáticos:
  - Responde `GET` y `HEAD`; cualquier otro método recibe 405.
  - `/` sirve `index.html`.
  - La ruta se decodifica, se resuelve dentro de la carpeta del bundle y se descarta (404) si cae fuera, incluidos `..` y `%2e%2e`.
  - Tipos de contenido para html, js, css, svg, json, ico y woff2.
  - Sin fallback de SPA: la página es una sola.
- Los mensajes del servidor van a la consola en español. No son textos de la página, así que no viven en `src/cliente/textos.ts`.

### D4. El contrato del dominio queda como lo escribe ARQUITECTURA, con dos añadidos declarados

`parsearCsv(texto): ResultadoCarga` y `metricas(tx): Metricas` conservan la firma de `docs/ARQUITECTURA.md`, *Contratos*. Añadidos:

- **`CargaRechazada`**, un error que exporta el dominio y que `parsearCsv` lanza cuando el archivo no se puede usar. Lleva un motivo de un catálogo cerrado (vacío, sin filas, faltan columnas con su lista, sin filas válidas).
- **`pideConfirmacion(r: ResultadoCarga): boolean`**: R-05, más del 5 % de las filas de datos (válidas + inválidas) es inválido.
- **`FilaInvalida.motivo`** es un código de un catálogo cerrado (fecha, monto, concepto vacío, id repetido, fuera del mes), no un texto. El texto es-MX de cada código vive en `src/cliente/textos.ts`, en un registro exhaustivo por código, para que un motivo nuevo sin texto no compile.

Alternativa descartada: un resultado unión `{ ok: true … } | { ok: false … }`. Cambia la firma escrita en `docs/ARQUITECTURA.md`, y ese documento solo se toca en una PR del usuario.

### D5. `Transaccion` es un objeto plano serializable

El esquema de `src/dominio/esquema.ts` usa solo cadenas, números y `null`, sin objetos `Date`, porque en la fase 3 viaja como JSON por la API del historial y se valida con el mismo esquema en los dos extremos (`docs/ARQUITECTURA.md`, *API del historial*).

- El día (`AAAA-MM-DD`) y la hora (o su ausencia, R-03) se guardan sin zona horaria.
- Las coordenadas van las dos o ninguna (R-07).
- Los nombres de los campos son del dominio, en español, y los fija el grupo 1.

### D6. Orden de la validación

1. Encabezado. Papa Parse sobre el string, con `header`, sin líneas vacías y sin BOM. Los nombres de columna se recortan. Sin las obligatorias, `CargaRechazada` con todas las que faltan (R-01).
2. Por fila, por separado:
   - Obligatorias vacías.
   - Fecha (R-03): forma exacta y día que existe en el calendario. Se calcula sin `Date` con zona horaria.
   - Monto (R-04): `^\d+(\.\d+)?$` y mayor que 0.
3. Id repetido (R-06) entre las filas que pasaron el paso 2: se queda la primera.
4. Mes (R-08) por mayoría entre las que quedan; con empate, el más antiguo. Las demás pasan a «fuera del mes».
5. Opcionales (R-02, R-07): valores por defecto y coordenadas. Ids generados `TX` + 6 dígitos sobre las transacciones finales sin id, en orden de fecha y hora (estable por orden de archivo), saltando los ids que ya usa el archivo.
6. Sin transacciones: `CargaRechazada` (sin filas válidas).

Número de fila: el encabezado es la fila 1 y cada registro de datos suma 1, como en una hoja de cálculo.

### D7. `Metricas` nace con KPIs y gasto por categoría

- La forma es: KPIs de R-11 y una lista por categoría con monto, número de transacciones y proporción del gasto (0 a 1) sobre el monto (R-12), ordenada por monto descendente y por nombre con empate.
- El promedio diario divide entre los días naturales del mes de las transacciones (todas son del mismo mes por R-08).
- La fase 2 añade las demás series. Cuando lleguen los filtros por fecha, el periodo tendrá que venir del filtro: eso es un añadido a la firma que se decide al planear la fase 2.

Alternativa descartada: dividir entre los días del primer al último gasto. Subestima el periodo en un mes con días sin gasto y no coincide con «del periodo» de R-11.

### D8. R-17 vive en el dominio

`docs/STACK.md` y `CLAUDE.md` (*Idioma*) ponen el formato en el dominio:

- Montos y porcentajes con `Intl.NumberFormat('es-MX')` (salidas comprobadas en *Context*).
- Fechas por manipulación de la cadena `AAAA-MM-DD`, sin `Date`.

`Intl` no es I/O y no lo prohíbe el lint de pureza.

### D9. `graficas.porCategoria`

- Recibe `Metricas` y devuelve la opción de ECharts de barras horizontales, en el orden de `Metricas`, con la primera categoría en un color de énfasis y etiquetas formateadas con R-17.
- `aria` va activado.
- Del paquete `echarts` solo se importan tipos (`import type`): la capa sigue pura.

### D10. Cliente

- **Estados:** inicial → rechazado | por confirmar (R-05) | tablero; cancelar vuelve a inicial.
- **Lectura del archivo:** `File.text()` y `parsearCsv` en el hilo principal.
- **Gráfica:** se monta con el renderizador **SVG**. Con `canvas`, ECharts falla en jsdom (*Context*). Se libera al desmontar.
- **Lista por categoría:** semántica (tabla o lista), que es lo que el analista y las pruebas leen. La primera fila lleva una marca visible del catálogo («Dominante» o similar).
- **Textos visibles:** todos en `src/cliente/textos.ts`, incluidos los de cada motivo de D4. Las pruebas buscan por rol y nombre accesible tomados del catálogo (`CLAUDE.md`, *Test driven development* 6).
- **Assets:** sin fuentes ni recursos remotos.

### D11. Suite de sistema contra `npm start`

- El `webServer` de `playwright.config.ts` pasa a `npm start` con `TABLERO_SIN_NAVEGADOR=1` y `TABLERO_PUERTO=4173`, para conservar el origen actual.
- `.claude/da/da sistema` construye antes (`npm run build`, perfil `modulos.suiteDeSistema.preparar`), así que `npm start` encuentra el bundle al día y no reconstruye.
- `tests/sistema/pagina-vacia.spec.ts` sigue valiendo para el estado inicial.
- **Flujo principal**, en una spec nueva:
  - Lee `tests/fixtures/generador/2026-07-semilla-1.csv` y su `*.esperado.json`.
  - Añade en memoria tres filas inválidas: monto `0`; un id ya usado con datos válidos de julio; una fecha de agosto. Son las filas 2002 a 2004, 3 de 2 003, por debajo del 5 %.
  - La entrega con `setInputFiles` desde un buffer, sin escribir archivos.
  - Comprueba las tres filas con su motivo, 2 000 transacciones, `$1,689,470.67` y la `categoriaDominante` del esperado como primera categoría.
  - Las cifras esperadas se fijan en la prueba como literales calculados fuera del código del tablero, nunca llamando al dominio.
- **Regla de lint** (deuda de la fase 0, `eslint.config.mjs`, bloque de `tests/sistema/`):
  - En `@playwright/test`, `importNames` pasa a `['test', 'default']`, y `playwright/test` entra con la misma restricción. Con eso también queda cubierto el import de espacio de nombres (`import * as`).
  - Los `import type` siguen permitidos.
  - Casos nuevos en `tests/arquitectura/sistema.test.ts`.
- **Lo que no se absorbe:** la vigilancia de WebSockets y de peticiones tardías (`docs/olas/fase-0.md`, *Deuda*). En esta fase no hay ninguna vía real: `npm start` sirve estáticos sin HMR y la página no hace `fetch`. Se revisa en la fase 3, con la primera llamada a la API.

### D12. Fixtures hechos a mano

- Viven en `tests/fixtures/a-mano/`, fuera de `tests/fixtures/generador/`, al que el test de integridad exige exactamente tres CSV.
- Son pequeños: con BOM y `\r\n`, sin columnas opcionales, con filas inválidas, con filas de otro mes y con comas entre comillas.
- `.gitattributes` les pone `-text`, para que git no normalice el BOM ni los fines de línea.
- Los usan las pruebas del dominio y las de componente. Un caso de una línea puede ir como cadena dentro del test.

## Risks / Trade-offs

- [El navegador abierto desde WSL no llega al servidor de 127.0.0.1] → `open` usa `powershell.exe` en WSL. Que el navegador de Windows alcance un puerto ligado a 127.0.0.1 en WSL depende del reenvío de localhost de WSL. La suite de sistema no abre el navegador, así que la prueba es la demo del usuario. Si falla, se abre la URL a mano; el servidor **no** pasa a escuchar en otra interfaz (regla innegociable 2).
- [La decisión de bundle viejo falla por fechas de modificación raras (OneDrive, relojes)] → la función pura se prueba con casos de igualdad y de ausencia. Con la misma fecha, se trata como al día. Construir de más solo cuesta tiempo.
- [El texto de `Intl` difiere entre Node y Chromium (espacio duro, símbolo)] → las pruebas del dominio fijan el texto exacto en Node. La de sistema comprueba `$1,689,470.67` en Chromium, y si difieren lo destapa.
- [ECharts en jsdom ensucia la salida con «Not implemented: HTMLCanvasElement's getContext()»] → aviso de jsdom, no fallo. Las pruebas de componente afirman la lista accesible, no el dibujo.
- [El grupo 4 queda cerca de las ~600 líneas de diff] → la opción de ECharts ya va en el grupo 2 y el grupo 4 solo la monta. La ola está en el tope de 5 PRs, así que partir un grupo supone partir la ola: el PM lo escala al Team Manager antes de partir.
- [`sin-red` aún no está en `openspec/specs/` (la crea `fase-0-andamiaje`, sin archivar)] → el delta de esta fase solo **añade** un requisito. El Archivador archiva `fase-0-andamiaje` antes que este change, en el orden de merge del usuario.
