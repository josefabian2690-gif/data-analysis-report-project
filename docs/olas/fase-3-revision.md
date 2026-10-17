# Pre-vuelo — Ola fase-3 «Historial y comparación»

Verificado contra `ola/fase-2` @ `b19bb40` el 2026-10-16 (base apilada por avance continuo; la PR de ola de la fase 2 es la #23, abierta). Lo verificado en el código lleva `archivo:línea`; lo inferido se dice.

## 1. Veredicto

- `fase-3-historial-y-comparacion`: **lista para un PM**, propuesta en este pre-vuelo (no existía ningún change de la fase 3).
- Ola entera: **lista para delegar**, con las recomendaciones de §7 escritas en el change. Si el usuario elige otra opción en las decisiones 1 o 2, el change vuelve al Planeador por `openspec-update-change` antes del primer encargo.
- Lo más importante: la fase 3 rompe dos promesas escritas de las fases anteriores —«el CSV no sale del navegador» (`tablero-del-mes`) y «el servidor sirve solo el bundle» (`arranque-local`)— y la suite de sistema hoy escribiría en el `historial/` del repositorio. El change modifica los dos requisitos, declara los tests que cambian y aísla el historial de toda prueba.

## 2. La ola

- **Ola fase-3 — `fase-3-historial-y-comparacion`** (5 PRs internas)
  - **Entregable**
    - Al cargar un CSV aceptado, el mes se guarda en `historial/AAAA-MM.json` (o en `TABLERO_HISTORIAL`) con escritura atómica.
    - Cargar otra vez un mes guardado pregunta si se reemplaza (409), sin ocultar el tablero.
    - Una vista «Historial» lista los meses guardados y compara dos con tabla y gráfica (R-15).
    - Una spec de sistema nueva guarda los fixtures `2026-07`, `2026-08` y `2026-09`, reinicia el servidor, los ve en la lista, recorre el 409 y compara julio contra agosto.
  - **Componentes que se modifican**
    - `src/dominio/esquema.ts` (gana la validación en tiempo de ejecución), `src/dominio/formato.ts` (formatos con signo), un módulo nuevo de comparación.
    - `src/servidor/` (almacén y rutas `/api/meses`; `config.ts`, `startup.ts`, `static-server.ts` y `main.ts` reciben la carpeta).
    - `src/graficas/` (`porComparacion`; marca de post-quincena en `estilo.ts`).
    - `src/cliente/` (cliente del historial, guardado y R-09, vistas, comparación; `App.tsx` recibe el cliente como prop).
    - `tests/cliente/`: los 12 archivos que montan `<App />` (37 sitios) pasan un historial falso; `tests/preparar-cliente.ts` bloquea el `fetch` global.
    - `playwright.config.ts`, `tests/sistema/flujo-principal.spec.ts`, `tests/sistema/sin-red.ts`, `tests/arquitectura/sistema.test.ts`.
    - No se toca: `generador/`, `tests/fixtures/`, `package.json`, `vite.config.mts`, `eslint.config.mjs`, `docs/`.

## 3. Hallazgos

### CORREGIR ANTES DE ENCARGAR (todos corregidos en el change propuesto)

1. **La fase 3 contradice «el archivo no sale del navegador».**
   - Qué pasa: el requisito «Elegir un CSV» de `tablero-del-mes` dice «sin enviarlo a ningún servidor» (`openspec/changes/fase-1-cargar-y-ver-el-mes/specs/tablero-del-mes/spec.md`), y `tests/sistema/flujo-principal.spec.ts:89-92` falla ante cualquier petición distinta de `GET` o con cuerpo. Guardar el mes es un `PUT` con las transacciones (verificado).
   - Por qué importa: sin declararlo, el grupo que añade el guardado deja `sistema` en rojo o ablanda la guarda en silencio.
   - Corrección: delta MODIFIED de «Elegir un CSV» y de «Flujo principal en la suite de sistema»: el texto del CSV sigue sin salir; la única petición con cuerpo es `PUT /api/meses/AAAA-MM` a 127.0.0.1. Tarea 4.4.
2. **«Sirve solo el bundle» y el 405 a todo método.**
   - `src/servidor/static-server.ts:48-50` responde 405 a todo lo que no sea `GET`/`HEAD`; el requisito de `arranque-local` dice «404 a cualquier ruta que no sea un archivo del bundle» (verificado).
   - Corrección: delta MODIFIED que añade `/api/meses` y conserva el 405 fuera de `/api/`; `tests/servidor/static-server.test.ts` sigue sin cambios (tarea 2.4).
3. **La suite de sistema escribiría en `historial/` del repositorio.**
   - `playwright.config.ts:11-16` levanta `npm start` sin `TABLERO_HISTORIAL` (verificado). Con el guardado, cada corrida dejaría meses en el `historial/` del worktree.
   - Corrección: `TABLERO_HISTORIAL` temporal en la configuración y un test de `tests/arquitectura/` que falla si esa carpeta cae dentro del repositorio (D10, tarea 4.4). En el servidor, la carpeta siempre llega inyectada desde `main.ts` y se crea solo al guardar (D5, tareas 2.1 y 2.4).
4. **Los archivos de la suite comparten servidor y mes.**
   - `flujo-principal.spec.ts` y `dashboard-filtrado.spec.ts` cargan los dos `2026-07-semilla-1` contra el mismo `webServer`; Playwright reparte los archivos entre workers en paralelo por defecto (la configuración no fija `workers`; inferido del valor por defecto). Con guardado, uno de los dos recibe 409.
   - Corrección: la pregunta de reemplazo no oculta el tablero (D7) y `flujo-principal` acepta los dos resultados del guardado (delta de `tablero-del-mes`). La spec de persistencia levanta su propio servidor para poder reiniciarlo (D10).
5. **Los tests de componente harían red.**
   - `App` no recibe props (`src/cliente/App.tsx:26`) y 12 archivos de `tests/cliente/` lo montan así (verificado con `grep`). Si `App` llamara a `fetch('/api/meses')` por su cuenta, jsdom intentaría una petición real.
   - Corrección: el cliente del historial es prop obligatoria de `App`, los tests le pasan uno falso, y `tests/preparar-cliente.ts` sustituye el `fetch` global por uno que falla (D6, tarea 4.1). Impact declara los 12 archivos.
6. **El fallo del guardado se anunciaría como «archivo ilegible».**
   - `App.tsx:37-40` convierte cualquier rechazo de la cadena de lectura en la pantalla de archivo ilegible (deuda de la fase 1). Si el guardado se encadena ahí, un error de red diría al analista que su archivo no se lee.
   - Corrección: D7 y tarea 4.2 (camino propio para el fallo del guardado).
7. **El esquema no existe en tiempo de ejecución.**
   - `src/dominio/esquema.ts:5-24` es una interfaz; `docs/ARQUITECTURA.md` pide validar la API «con el esquema del dominio en los dos extremos».
   - Corrección: `leerMesGuardado` y `esMes` en `esquema.ts` (regla innegociable 4), usados por el servidor y por el cliente (D1, tareas 1.1, 2.3 y 4.1).
8. **Riesgo de seguridad no escrito: *DNS rebinding*.**
   - Escuchar en 127.0.0.1 no impide que una página ajena, abierta en el mismo navegador, resuelva su dominio a 127.0.0.1 y lea `GET /api/meses` (no necesita preflight). Es la primera vez que el servidor expone datos de gasto.
   - Corrección: 403 a `/api/` con `Host` ajeno (D4, tarea 2.3). Inferido del modelo de amenaza; el mecanismo lo verifica el implementador.

### DEUDA (anotada, no bloquea)

- **Archivado en orden.** Los deltas MODIFIED de `tablero-del-mes` y `arranque-local` necesitan sus specs principales; `openspec validate --strict` pasa y avisa como información de que hoy el archivado los rechazaría. El Archivador debe archivar `fase-0`, `fase-1` y `fase-2` antes que `fase-3` (escrito en `tasks.md`, *Workflow follow-up*).
- **Códigos 400, 403, 413 y 415 solo en `design.md`.** `docs/ARQUITECTURA.md`, tabla *API del historial*, lista 201/409/200/204/404. Son añadidos declarados en el change, como hizo la fase 2 con sus firmas; si el usuario quiere el contrato completo en `docs/ARQUITECTURA.md`, es una PR aparte que mergea él (fuera del dominio de esta PR).
- **WebSockets sin vigilar** en `tests/sistema/sin-red.ts`: ninguna fuente de la fase los abre; sigue como deuda.

## 4. Tope de PRs y partición

- 5 grupos, 5 PRs internas. Grafo: 1 → 2 → 4 → 5 y 1 → 3 → 5; el 3 en paralelo con el 2 y con el 4.
- Tamaño estimado (código más tests, inferido de los módulos vecinos):
  - 1 dominio ~550; 2 servidor ~800; 3 gráficas ~200; 4 cliente historial ~650 (incluye ~80 de los 37 montajes de `<App />`); 5 comparación y sistema ~550.
  - El 2 pasa de las ~600 orientativas; partirlo daría seis PRs. Se acepta (precedente: #13 de la fase 1, ~1 050) y el brief lo avisa.
- No hace falta partir en dos olas (decisión 5).

## 5. Lo que la ola absorbe

- De `docs/olas/fase-1.md`, *Lo que queda fuera* (D-TM1): **peticiones tardías** en la vigilancia, porque desde esta fase la página lanza el `PUT` y el `GET` de la lista sola, y pueden salir tras la última aserción (D11, tarea 5.4). **WebSockets no**: no hay fuente.
- De `docs/olas/fase-2.md`, *Deuda*:
  - **Marca de post-quincena (R-13): entra** en el grupo 3 (tarea 3.2). Es un requisito aceptado de `tablero-del-mes` que se archivaría como cumplido sin estarlo, y el grupo 3 ya abre `src/graficas/`. Ojo: no se arregla por luminancia (los tres colores marcados están a 1.06–1.47:1 del gris, calculado), sino con un patrón visible (D12).
  - **`conDescripcion` duplicado: entra**, solo lo necesario: la gráfica de la comparación necesitaría una tercera copia; el grupo 5 deja una sola y la usa también `GastoPorCategoria.tsx` (D9, tarea 5.2). El `padStart` repetido no.
  - **`Grafica.tsx` recrea ECharts: no entra.** La comparación vive en su propia vista y el tablero filtrado no gana gráficas; el coste no crece en esta fase.
  - **CSS y rejilla: no entra.**
- De `docs/olas/fase-1.md`, *Deuda*: nada (`'dist'` de `main.ts`, comillas de `carga.ts`). El aviso de `App.tsx` no se arregla, pero el guardado no puede pasar por él (hallazgo 6).

## 6. Lo que está bien

- `docs/PLAN.md` (fila de la fase 3) y `docs/ARQUITECTURA.md` (*API del historial*, *Almacenamiento*, *Pruebas*) dicen lo mismo y bastan; no hace falta tocarlos.
- Los tres fixtures con semilla existen (`2026-07-semilla-1`, `2026-08-semilla-2` y `2026-09-semilla-3` en `tests/fixtures/generador/`), 2 000 filas cada uno, todas de su mes; el entregable «2 o 3 meses» es alcanzable sin regenerar nada.
- `.gitignore` ya ignora `historial/`.
- La capa `servidor` puede importar `dominio` y `node:*` (`eslint.config.mjs:8-14`); el lint de pureza ya prohíbe `fetch` en las capas puras (`eslint.config.mjs:34-37`).
- Ninguna dependencia nueva; skills de área cubiertos por el perfil (`nodejs-backend-patterns` para el servidor, `vercel-react-best-practices` y `javascript-testing-patterns` para el cliente).
- Sin `[PENDIENTE]` en la fase (los de `docs/PLAN.md` son de las fases 0 y 4).

## 7. Decisiones

1. **Cuándo se guarda el mes** (usuario: interpretación del PLAN con efecto visible).
   - (a) Automático al aceptar la carga; con 409, pregunta sin ocultar el tablero.
   - (b) Botón «Guardar en el historial»; la pregunta aparece al pulsarlo.
   - Recomendación: **(a)**. `docs/PLAN.md`, flujo 1, pone «guardado como un mes del historial» dentro de la carga, y R-09 pregunta «al cargar». (b) es más conservador si se analizan datos de otra persona, pero añade un paso cada mes. Escrita en D7.
2. **Qué hace la página con el historial** (usuario: alcance).
   - (a) Listar y comparar; borrar solo por API.
   - (b) Además, borrar un mes con confirmación.
   - (c) Además, borrar y abrir un mes guardado en el tablero.
   - Recomendación: **(a)**. Es lo que pide el entregable; (b) y (c) cambian el resumen de validación (un mes guardado no trae sus filas inválidas) y no caben bien en cinco PRs. Mientras, un mes sobrante se borra quitando su archivo de `historial/`.
3. **Cómo se compara** (Team Manager: técnica).
   - (a) `comparar` admite N meses (diferencia de cada uno contra el anterior); la página elige dos, por defecto los dos más recientes.
   - (b) La página muestra todos los meses guardados a la vez.
   - Recomendación: **(a)**. Respeta la firma de `docs/ARQUITECTURA.md`, la tabla queda legible y el dominio ya sirve para más meses. Escrita en D2 y D9.
4. **Qué deuda entra** (Team Manager: técnica).
   - (a) Peticiones tardías de la vigilancia, marca de post-quincena y una sola `conDescripcion`; fuera WebSockets, `Grafica.tsx`, CSS y la deuda de la fase 1.
   - (b) Solo lo que el entregable necesita (peticiones tardías y `conDescripcion`); la marca de post-quincena sigue de deuda.
   - Recomendación: **(a)**, por las razones de §5. La marca son unas decenas de líneas en un grupo pequeño (el 3).
5. **Una ola o dos** (Team Manager: técnica; de alcance solo si se parte).
   - (a) Una ola de 5 PRs, con el grupo del servidor en ~800 líneas.
   - (b) Dos olas: historial (dominio, servidor, cliente, sistema) y comparación (dominio, gráficas, cliente, sistema).
   - Recomendación: **(a)**. El entregable de la fase pide las dos cosas, y partir duplicaría la spec de sistema y el paso por `flujo-principal`.

Brief: `docs/olas/fase-3-brief.md`.
