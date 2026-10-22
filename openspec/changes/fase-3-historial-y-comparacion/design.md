# Design

## Context

Motivación en `proposal.md`. Estado de partida, verificado en `ola/fase-2` @ `b19bb40` el 2026-10-16:

- **Esquema.** `Transaccion` (`src/dominio/esquema.ts:5-24`) es solo una interfaz de TypeScript: no hay validación en tiempo de ejecución. Sus campos: `id`, `dia` (`AAAA-MM-DD`), `hora` (`HH:MM:SS` o `null`), `monto`, `concepto`, `categoria`, `cuenta`, `zona`, `latitud` y `longitud` (`number | null`, juntas o ninguna). `leerFecha` y `diasDelMes` están en `src/dominio/fecha.ts:13` y `:18`.
- **Métricas.** `metricas(tx, periodo?)` da `gastoTotal`, `numeroDeTransacciones` y `gastoPorCategoria` (`src/dominio/metricas.ts:66-80`). Los formateadores de R-17 viven en `src/dominio/formato.ts:9-22` (`formatearMonto`, `formatearProporcion` con un decimal), sin signo.
- **Servidor.** `src/servidor/static-server.ts` sirve el bundle por `GET`/`HEAD` y responde 405 a todo otro método (`:48-50`); `LOCAL_ADDRESS = '127.0.0.1'` (`:7`). `start` (`src/servidor/startup.ts:46-55`) lee la configuración del `env` que recibe; `readConfig(env)` devuelve `{ port, openBrowser }` (`src/servidor/config.ts:24-29`) y `tests/servidor/config.test.ts:7` compara esa forma entera con `toEqual`. `main.ts` toma la raíz de `process.cwd()` (`:9`) y es el único que pasa `process.env`. `tests/servidor/ayudas.ts:15` (`pedir`) no envía cuerpo ni encabezados.
- **Cliente.** `App` (`src/cliente/App.tsx:26-70`) no recibe props; lee el archivo y convierte **cualquier** rechazo de esa cadena en la pantalla de archivo ilegible (`:37-40`). `Tablero` (`src/cliente/Tablero.tsx`) guarda el filtro en su estado y se monta con `key={eleccion}`. 12 archivos de `tests/cliente/` montan `<App />` sin props (37 sitios). `tests/preparar-cliente.ts` no toca `fetch`.
- **Descripciones accesibles.** `conDescripcion` está en `src/cliente/opciones-de-graficas.ts:14-17` y otra versión en `src/cliente/GastoPorCategoria.tsx:10-25`.
- **Gráficas.** `columnas` y `serieDeClase` (`src/graficas/columnas.ts`) apilan series con color y `decal`; las marcas viven en `src/graficas/estilo.ts:13-38`. La de post-quincena (`MARCA_DE_PUNTOS`, `symbolSize: 0.8`, `:23-29`) sobre el teal `#0f766e` (`src/graficas/por-dia.ts:16`) junto al gris `#64748b` del día normal: casi lisa y de luminancia parecida (`docs/olas/fase-2.md`, *Deuda*).
- **Suite de sistema.** `playwright.config.ts:11-16` levanta `npm start` en el puerto 4173 con `TABLERO_SIN_NAVEGADOR=1` y **sin** `TABLERO_HISTORIAL`; los archivos de la suite corren en paralelo contra ese único servidor. `tests/sistema/flujo-principal.spec.ts:89-92` exige que ninguna petición tenga método distinto de `GET` ni cuerpo. `tests/sistema/sin-red.ts:17-27` evalúa las peticiones justo al terminar el cuerpo de la prueba y no ve WebSockets.
- **Fixtures.** `tests/fixtures/generador/` tiene `2026-07-semilla-1`, `2026-08-semilla-2` y `2026-09-semilla-3`, de 2 000 filas cada uno, todas del mes del nombre. Totales (calculados con el módulo `csv` de Python y `Decimal`, fuera del código del tablero): 1 689 470.67, 1 544 622.78 y 1 278 296.56. Por categoría, julio / agosto / septiembre: Comida 260 686.59 / 172 038.57 / 693 983.87; Compras 814 566.30 / 201 746.52 / 197 076.86; Entretenimiento 258 692.09 / 847 205.02 / 164 574.61; Salud 36 836.23 / 36 843.12 / 27 888.57; Servicios 2 081.26 / 2 177.11 / 2 397.46; Supermercado 155 853.50 / 174 723.51 / 78 211.03; Suscripciones 1 554.55 / 1 529.38 / 1 315.74; Transporte 138 547.45 / 85 403.02 / 92 476.40; Viajes 7 662.70 / 13 779.12 / 8 668.67; Vivienda 12 990.00 / 9 177.41 / 11 703.35. Las diez categorías aparecen en los tres meses: el caso «categoría ausente» de R-15 solo lo cubren tests con transacciones hechas a mano.
- `.gitignore` ya ignora `historial/`. Node 22 trae todo lo necesario (`node:fs/promises`, `node:http`, `node:os`, `node:crypto`).

## Goals / Non-Goals

**Goals:**
- R-09 y R-15 con su test que la nombra, y los casos borde de `docs/DOMINIO.md` que tocan: un mes sin filas válidas no se guarda; categoría ausente cuenta como 0.
- La API valida con el esquema del dominio en los dos extremos (servidor al recibir un `PUT`, cliente al recibir un `GET`).
- Ninguna prueba, unitaria o de sistema, escribe en `historial/` del repositorio, y ningún test de componente hace red.

**Non-Goals:**
- Abrir un mes guardado en el tablero, borrar meses desde la página, comparar más de dos meses a la vez en la página o con filtros.
- Vigilar WebSockets en la suite (ninguna fuente de esta fase los abre; el HMR de Vite solo existe en `npm run dev`, que la suite no usa).
- Proxy de `/api/` en `npm run dev`: en desarrollo el historial no está disponible y la página lo dice (D8).
- Deuda que no toca esta fase: `src/cliente/Grafica.tsx` recrea ECharts en cada cambio (la comparación vive en su propia vista y el tablero del mes no gana gráficas), `padStart` repetido, CSS de `.tarjeta-grafica`, `'dist'` de `src/servidor/main.ts`, carga de comillas mal puestas.

## Decisions

### D1. El esquema en tiempo de ejecución, en `esquema.ts`

- `leerMesGuardado(mes: string, valor: unknown)` devuelve `{ ok: true, transacciones }` o `{ ok: false, motivo }`. Valida: lista no vacía; cada elemento con exactamente los campos de `Transaccion` y sus tipos; `id` y `concepto` no vacíos; `dia` válido (con `leerFecha`) y del mes `mes`; `hora` `null` o `HH:MM:SS` válida; `monto` finito y mayor que 0; coordenadas juntas o ninguna, dentro de rango (R-07); ids sin repetir.
- `esMes(texto)`: `AAAA-MM` con el mes de 01 a 12.
- Viven en `src/dominio/esquema.ts` porque la regla innegociable 4 de `CLAUDE.md` pone ahí el único esquema; las comprobaciones de fecha reutilizan `fecha.ts`.
- Alternativas descartadas: lanzar una excepción (el servidor necesita el motivo para un 400 sin `try`); una biblioteca de esquemas (dependencia nueva para nueve campos).

### D2. `comparar` y `Comparacion`

- `comparar(meses: { [mes: string]: Transaccion[] }): Comparacion`, firma de `docs/ARQUITECTURA.md`.
- `Comparacion = { meses: string[]; categorias: FilaDeComparacion[]; total: FilaDeComparacion }`, con `meses` en orden cronológico sin importar el orden de las claves, y `FilaDeComparacion = { nombre: string; montos: number[]; diferencias: { absoluta: number; proporcion: number | null }[] }`: un monto por mes y una diferencia por mes a partir del segundo, contra el anterior.
- La diferencia proporcional es una proporción (−0.0857, no −8.57) para que la formatee el mismo estilo de R-17 que las demás; `null` cuando el monto anterior es 0.
- Categorías: la unión de las de todos los meses, ausente = 0, ordenadas de mayor a menor monto del último mes y por nombre con empate.
- Los montos son sumas sin redondear; se redondea solo al mostrar (caso borde de `docs/DOMINIO.md`).
- Formato con signo en `formato.ts`: `formatearDiferenciaDeMonto` (`+$588,512.93`, `-$612,819.78`) y `formatearDiferenciaDeProporcion` (`+227.5%`, `-8.6%`), con `signDisplay: 'exceptZero'` de `Intl` (comprobado con Node 22 el 2026-10-16: el signo menos es el guion ASCII).
- Alternativa descartada: diferencias de cada mes contra el primero. Con dos meses es igual; con tres, «contra el anterior» es la lectura de mes a mes.

### D3. El almacén de meses en el servidor

- Un módulo del servidor que recibe la carpeta y expone listar, leer, guardar (con o sin reemplazo: `creado`, `reemplazado` o `existe`) y borrar.
- Escritura atómica: archivo temporal con nombre único en la **misma** carpeta (para que `rename` no cruce sistemas de archivos) y `rename` sobre `AAAA-MM.json`; si algo falla, se borra el temporal y el error sube.
- Contenido del archivo: el mismo `Transaccion[]` del cuerpo, en JSON. Listar solo mira nombres `AAAA-MM.json`; un temporal sobrante no cuenta.
- Listar lee cada mes, lo valida con `leerMesGuardado` y resume con `metricas(tx)` (`numeroDeTransacciones` y `gastoTotal`), para que el total sea el mismo que el KPI del tablero. Un archivo que no valida se omite y se registra por la función `log` que ya recibe el arranque.
- La carpeta se crea (`mkdir` recursivo) solo al guardar.
- Alternativas descartadas: un índice aparte con filas y total (dos archivos que pueden divergir); `node:sqlite` (`docs/STACK.md` lo descarta).

### D4. Las rutas de la API

- Las peticiones a `/api/meses` y `/api/meses/:mes` se atienden antes que el bundle; fuera de `/api/` el servidor de estáticos sigue igual (405 a otros métodos, sin fallback de SPA). Un método no previsto bajo `/api/` responde 405 con su `Allow`.
- Códigos del contrato: 200, 201, 204, 404 y 409. Añadidos declarados: 400 (mes de la ruta o cuerpo inválidos, con el motivo de D1 en un JSON `{ error }`), 403 (`Host` ajeno), 413 (cuerpo de más de 64 MB, unas doce veces un mes real de 20 000 filas), 415 (`PUT` sin `Content-Type: application/json`).
- **`Host`**: solo `127.0.0.1:<puerto>` o `localhost:<puerto>` del propio servidor. Por qué: el servidor escucha en 127.0.0.1, pero cualquier página abierta en el navegador puede resolver un dominio suyo a 127.0.0.1 (*DNS rebinding*) y leer el historial con un `GET`, que no necesita preflight. Con el `Host` comprobado, los datos de gasto no salen de la máquina (`docs/STACK.md`, restricción 5). `PUT` y `DELETE` ya exigen preflight de CORS, que el servidor no concede.
- `:mes` se valida con `esMes` antes de construir cualquier ruta de archivo.
- Alternativa descartada: Fastify (`docs/STACK.md` lo deja para «si la API crece»; son cuatro rutas).

### D5. Configuración y arranque

- `TABLERO_HISTORIAL` se lee donde ya se leen las demás variables (`readConfig`); sin ella, la carpeta es `historial/` en la raíz que `main.ts` ya calcula. Un valor vacío falla al arrancar nombrando la variable, como `TABLERO_PUERTO`.
- `start` y el servidor reciben la carpeta resuelta; ninguna función por debajo de `main.ts` la deduce de `process.cwd()`. Así los tests del servidor pasan siempre una carpeta de `mkdtemp`, y arrancar sin guardar no crea nada (D3).

### D6. El cliente del historial y los tests sin red

- `src/cliente/` gana un cliente del historial con `listar`, `obtener` y `guardar(mes, tx, { reemplazar })`, construido sobre un `fetch` que recibe. Valida la respuesta de `obtener` con `leerMesGuardado` (el otro extremo de D1) y la de `listar` con una comprobación de forma.
- `App` recibe ese cliente como prop obligatoria; `main.tsx` le pasa el real. Los tests de componente le pasan uno falso en memoria (ayuda nueva en `tests/cliente/`), también los 12 archivos que hoy montan `<App />`.
- `tests/preparar-cliente.ts` sustituye el `fetch` global por uno que falla: un test que se olvide del falso no puede hacer red sin enterarse (`CLAUDE.md`, *Reglas de proceso* 7).
- El cliente real se prueba con un `fetch` falso que registra método, URL, encabezados y cuerpo y devuelve 201, 200, 409, 404 o 500: es la frontera HTTP, no un colaborador interno.
- Alternativa descartada: un contexto de React con un historial «vacío» por defecto. Un `App` sin proveedor dejaría de guardar sin que el compilador lo note.

### D7. Guardar al cargar y la pregunta de reemplazo (R-09)

- El guardado empieza cuando la carga queda aceptada: sin confirmación de R-05, al cargar; con ella, al confirmar. Cancelar no guarda.
- Una región de estado, junto al resumen y sin ocultar el tablero, anuncia: guardando, guardado, la pregunta de reemplazo (con «Reemplazar» y «Conservar el guardado»), reemplazado, conservado o no se pudo guardar.
- El tablero nunca se oculta por el guardado. Por qué: los archivos de la suite corren en paralelo contra el mismo servidor y cargan el mismo julio; el segundo recibe 409 y sus aserciones sobre el tablero tienen que seguir valiendo.
- El fallo del guardado va por su propio camino: no pasa por la conversión a «archivo ilegible» de `App.tsx:37-40`.
- Carrera: si se elige otro archivo mientras se guarda el anterior, la respuesta vieja no cambia el estado del nuevo (el mismo criterio de «solo cuenta la última elección» de `App.tsx:36-41`).
- Alternativa descartada: botón «Guardar en el historial» (decisión 1 del pre-vuelo; `docs/PLAN.md`, flujo 1, pone el guardado dentro de la carga y R-09 pregunta «al cargar»).

### D8. Vista de historial

- La página gana dos vistas, «Tablero del mes» e «Historial», con un control accesible que dice cuál está activa. El tablero se queda montado y oculto al cambiar de vista, para conservar el mes cargado y su filtro.
- El historial se pide al abrir la página y tras cada guardado o reemplazo. Si falla (también en `npm run dev`, que no sirve `/api/`), la vista lo dice y cargar un CSV sigue funcionando.
- Textos en `src/cliente/textos.ts`; el mes en es-MX con `formatearMes` (`src/cliente/presentacion.ts`).

### D9. Comparar en la página

- Con dos o más meses guardados, dos selectores (mes base y mes a comparar), por defecto el penúltimo y el último; un mes no puede compararse consigo mismo. Con uno o ninguno, el texto de que hacen falta dos.
- El cliente pide los dos meses con `obtener` y llama a `comparar`; guarda en memoria los meses ya pedidos y olvida el que se reemplaza.
- Tabla accesible: Categoría, los dos meses, Diferencia y Diferencia %; la fila del total va al final con su encabezado de fila. Sin proporción, un texto del catálogo.
- Gráfica: `porComparacion(c, rotulos)` en `src/graficas/`, columnas agrupadas por categoría con una serie por mes; los nombres de los meses llegan por argumento (`graficas` no tiene textos) y el segundo mes lleva una marca de `estilo.ts` además del color.
- La descripción accesible usa **una** `conDescripcion`, exportada desde `src/cliente/opciones-de-graficas.ts`; `GastoPorCategoria.tsx` deja su copia y usa esa.

### D10. La suite de sistema con historial

- `playwright.config.ts` da a `npm start` un `TABLERO_HISTORIAL` en el directorio temporal del sistema, vacío al empezar cada corrida. Un test de `tests/arquitectura/` comprueba que esa carpeta queda fuera del repositorio.
- `flujo-principal.spec.ts` espera el resultado del guardado (aviso o pregunta de reemplazo, según qué archivo llegó antes) y cambia «ninguna petición distinta de GET» por: la única petición con cuerpo es `PUT /api/meses/2026-07` a 127.0.0.1, y ningún cuerpo ni URL lleva el texto del archivo (su encabezado) ni sus trozos.
- La spec de persistencia levanta **su propio** servidor, para poder reiniciarlo: `node dist-server/main.mjs` (lo que `npm start` ejecuta tras construir; el `webServer` ya lo construyó) con otro puerto, `TABLERO_SIN_NAVEGADOR=1` y una carpeta temporal propia; lo detiene, espera a que el proceso salga y lo vuelve a arrancar con la misma carpeta. Lo detiene siempre al terminar, también si la prueba falla.
- Las cifras de las aserciones son literales (Context); ninguna prueba las calcula llamando al dominio.

### D11. Peticiones tardías en la vigilancia

- `sin-red.ts` cuenta las peticiones en vuelo del contexto (`request` frente a `requestfinished` y `requestfailed`) y, al terminar el cuerpo de la prueba, espera con un tope a que no quede ninguna antes de evaluar los hosts.
- Por qué ahora: desde esta fase la página lanza peticiones solas tras cargar (el `PUT` y el `GET` de la lista), que pueden salir después de la última aserción. WebSockets queda como deuda (Non-Goals).
- Se verifica con una mutación que no se commitea: una petición a otro host lanzada con retraso tras la última aserción hace fallar la prueba.

### D12. La marca de post-quincena (R-13)

- Objetivo: la post-quincena se distingue del día normal sin percibir el tono, en la barra y en el cuadro de la leyenda, como ya pasa con la quincena (rayas diagonales) y la pre-quincena (rayas horizontales).
- No se resuelve por luminancia: los tres colores marcados están casi a la par del gris del día normal (contraste 1.06, 1.15 y 1.47 a 1 con `#64748b`, fórmula de WCAG 2, calculado el 2026-10-16), y la quincena se distingue igual gracias a su patrón. El defecto es solo el patrón de puntos de `symbolSize: 0.8`, que casi no se ve.
- Lo que se pide: un patrón de post-quincena tan visible como los otros dos y distinto de ellos (otra forma, densidad o tamaño). Lo guarda el test que ya existe de «tres marcas distintas y el día normal sin marca» (`tests/graficas/por-dia.test.ts:79-85`) y, si el implementador encuentra una propiedad del patrón que se pueda afirmar sin acoplarse a ECharts (p. ej. que su trazo no sea más fino que el de las rayas), un test que la nombre; la evidencia de que se ve es la captura de la gráfica por día y de su leyenda en escala de grises. El mecanismo lo verifica el crítico en el instalado de ECharts.

### D13. Contratos

- Sin cambio: `comparar(meses)` con la firma escrita; las cuatro rutas y sus códigos; la carpeta `historial/AAAA-MM.json`, la escritura atómica y `TABLERO_HISTORIAL`.
- Añadidos declarados: `leerMesGuardado` y `esMes` en `esquema.ts`; la forma de `Comparacion` (D2); los dos formatos con signo; los códigos 400, 403, 413 y 415 (D4); `porComparacion(c, rotulos)`; la prop del cliente del historial en `App`.

### D14. Una ola de cinco PRs

- Grafo: 1 → 2 → 4 → 5 y 1 → 3 → 5. El 3 (`src/graficas/`) va en paralelo con el 2 (`src/servidor/`) y con el 4 (`src/cliente/`); áreas disjuntas.
- El 4 va después del 2 porque su cambio en la suite de sistema (el `PUT` al cargar) necesita la API servida por `npm start`.
- Alternativa descartada: dos olas (historial en una, comparación en otra). El entregable de la fase pide las dos cosas y cabe en cinco grupos.

## Risks / Trade-offs

- [Un test o la suite de sistema escribe en `historial/` del repositorio] → D5 (carpeta siempre inyectada, creada solo al guardar), D10 (carpeta temporal del `webServer` y test de arquitectura que la vigila); tareas 2.1, 2.4 y 4.4.
- [Un test de componente hace red real por el `fetch` de jsdom] → D6 (`fetch` global que falla); tarea 4.1.
- [Dos archivos de la suite guardan el mismo mes en paralelo: el segundo recibe 409] → D7 (el tablero no se oculta) y D10 (`flujo-principal` acepta los dos resultados); tareas 4.2 y 4.4.
- [La spec de persistencia deja servidores huérfanos o puertos ocupados] → D10 (parada garantizada); tarea 5.3, y el PM comprueba que no queda proceso escuchando tras `sistema`.
- [Página ajena que lee el historial por *DNS rebinding*] → D4 (`Host`); tarea 2.3.
- [Ruta `:mes` que sale de la carpeta] → D1 (`esMes`) y D4; tarea 2.3.
- [Escritura a medias] → D3; tarea 2.2.
- [Un archivo del historial editado a mano tumba la lista] → D3 (se omite y se registra); tarea 2.2.
- [Cuerpo enorme que agota memoria] → D4 (413); tarea 2.3.
- [El fallo del guardado se anuncia como archivo ilegible] → D7; tarea 4.2.
- [Una petición tardía escapa a la vigilancia] → D11; tarea 5.4.
- [El archivado: los deltas MODIFIED de `tablero-del-mes` y `arranque-local` exigen que la spec principal exista] → este change se archiva después de `fase-0-andamiaje`, `fase-1-cargar-y-ver-el-mes` y `fase-2-dashboard-filtros-y-tabla` (`openspec validate --strict` lo avisa como información).
- [Comprobar 409 y escribir no es atómico: dos `PUT` simultáneos del mismo mes pueden dar 201 los dos] → aceptado: un solo usuario, una pestaña; el último `rename` gana y el archivo nunca queda a medias.
- [El grupo 2 ronda las 800 líneas, por encima de las ~600 orientativas] → partirlo daría seis PRs; se acepta, como el #13 de la fase 1 (~1 050).
