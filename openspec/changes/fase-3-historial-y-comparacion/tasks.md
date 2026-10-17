# Tasks

Una sola ola (`fase-3`), 5 PRs internas, una por grupo. Grafo:

- 1 → 2 → 4 → 5
- 1 → 3 → 5
- Paralelo declarado: el 3 (`src/graficas/`, `tests/graficas/`) junto al 2 (`src/servidor/`, `tests/servidor/`) y junto al 4 (`src/cliente/`, `tests/cliente/`, `tests/preparar-cliente.ts`, `tests/sistema/`, `tests/arquitectura/sistema.test.ts`, `playwright.config.ts`). Áreas disjuntas. El 4 espera al 2: su cambio de la suite de sistema necesita la API servida por `npm start` (`design.md` D14).

Reglas de la fase:
- Nada de mapa, hallazgos (R-16), exportar, abrir un mes guardado en el tablero, borrar desde la página ni comparar con filtros (`docs/PLAN.md`, fase 3; `proposal.md`).
- Ninguna dependencia nueva.
- Ninguna prueba escribe en `historial/` del repositorio ni hace red fuera de 127.0.0.1; los tests de componente no hacen red (`design.md` D5, D6, D10).
- Las cifras de las pruebas con fixtures son literales, las de `design.md` *Context*.
- Sin historial disponible, lo de las fases 1 y 2 se comporta igual.
- No se tocan `generador/`, `tests/fixtures/`, `package.json`, `vite.config.mts` ni `eslint.config.mjs`.

## 1. Dominio: esquema en tiempo de ejecución, comparación y formatos con signo

Área: `src/dominio/`, `tests/dominio/`. Specs `historial-de-meses` (validación del cuerpo y del mes) y `comparacion-de-meses` (R-15); `design.md` D1 y D2. Cada test de comparación nombra `R-15`.

- [x] 1.1 Tests primero de `esMes` (`2026-07` sí; `2026-13`, `2026-7`, `../x`, vacío no) y de `leerMesGuardado` por su interfaz: lista válida de julio aceptada tal cual; rechazo con motivo de lista vacía, no lista, campo de menos o de más, tipo equivocado, `monto` 0 o negativo o no finito, `dia` de otro mes o imposible, `hora` mal formada, una sola coordenada, coordenada fuera de rango, id repetido; luego las dos funciones en `src/dominio/esquema.ts`; verificar con una mutación por familia (aceptar `monto` 0, aceptar otro mes, no detectar ids repetidos) y que `npm run lint` no marca I/O en `src/dominio/`
- [x] 1.2 Tests primero de R-15 por `comparar`: julio contra agosto con transacciones hechas a mano (montos por mes, diferencia absoluta y proporción, total); categoría ausente cuenta 0; anterior 0 da proporción `null`; categoría que desaparece da −1; claves en desorden dan el mismo resultado; orden de categorías por monto del último mes; tres meses dan dos diferencias, cada una contra el anterior; luego `comparar` y `Comparacion` en `src/dominio/`; verificar con una mutación de cada regla (ausente sin contar, diferencia contra el primero, proporción infinita)
- [x] 1.3 Tests primero de `formatearDiferenciaDeMonto` (`+$588,512.93`, `-$612,819.78`, `$0.00`) y `formatearDiferenciaDeProporcion` (`+227.5%`, `-8.6%`, `0.0%`) en `tests/dominio/formato.test.ts`, nombrando `R-17`; luego las funciones en `src/dominio/formato.ts`; verificar que quitar el signo positivo hace fallar un test

## 2. Servidor: almacén de meses y API del historial

Depende del grupo 1. Área: `src/servidor/`, `tests/servidor/`. Spec `historial-de-meses` (requisitos del servidor) y `arranque-local` («Sirve solo el bundle»); `design.md` D3 a D5. Toda prueba usa carpetas de `mkdtemp` y las borra al terminar.

- [x] 2.1 Tests primero de la configuración: sin `TABLERO_HISTORIAL` la carpeta es `historial/` de la raíz dada; con la variable, esa carpeta (relativa a la raíz si no es absoluta); vacía, falla nombrando la variable; actualizar el `toEqual` de `tests/servidor/config.test.ts:7` a la forma nueva; luego `readConfig`; verificar con una mutación que ignore la variable
- [x] 2.2 Tests primero del almacén contra una carpeta temporal: guardar crea `AAAA-MM.json` y la carpeta si falta; `existe` sin reemplazo no toca el archivo; reemplazar sustituye el contenido entero; listar en orden cronológico con filas y total (julio del fixture: 2 000 y 1 689 470.67), sin temporales sobrantes ni archivos que no validan (y con su nombre en el `log`); leer y borrar un mes que no está; una escritura que falla antes del `rename` deja intacto el mes anterior y ningún temporal; luego el almacén; verificar con una mutación que escriba directo sobre `AAAA-MM.json` (sin temporal) y otra que no filtre temporales
- [x] 2.3 Tests primero de las rutas con `node:http` contra un servidor en puerto 0 y carpeta temporal (ampliar `pedir` de `tests/servidor/ayudas.ts` con cuerpo y encabezados): `GET /api/meses` vacío y con meses; `GET`, `PUT` y `DELETE /api/meses/:mes` con 200, 201, 204, 404, 409 sin `?reemplazar=1` y 200 con él; 400 por mes inválido (`2026-13`, `..%2F..%2Fpackage`), cuerpo no JSON, lista vacía, transacción de otro mes; 415 sin `application/json`; 413 por encima de 64 MB; 403 con `Host` ajeno; 405 con `Allow` para otro método bajo `/api/`; fuera de `/api/` sigue el 405 de `tests/servidor/static-server.test.ts`; luego las rutas; verificar con mutaciones: sin comprobar `Host`, 201 en lugar de 409, mes sin validar
- [x] 2.4 Tests primero en `tests/servidor/startup.test.ts`: el arranque sirve la API con la carpeta que recibe; arrancar sin guardar no crea la carpeta; luego `startup.ts`, el servidor y `main.ts` (la raíz y `process.env` solo ahí); verificar que `tests/servidor/static-server.test.ts` sigue en verde sin cambios y que tras `npm test` no existe `historial/` en el worktree

## 3. Gráficas: la comparación y la marca de post-quincena

Depende del grupo 1. Área: `src/graficas/`, `tests/graficas/`. Specs `comparacion-de-meses` («Gráfica de la comparación») y `tablero-del-mes` (requisito de R-13 de la fase 2); `design.md` D9 y D12.

- [ ] 3.1 Tests primero de `porComparacion(c, rotulos)` con una `Comparacion` hecha a mano: una serie por mes con el nombre recibido, una columna por categoría en el orden de `Comparacion`, eje de montos en R-17, `aria` activado, el segundo mes con marca además del color, `barMaxWidth`; luego la función; verificar que dar a los dos meses el mismo estilo hace fallar un test
- [ ] 3.2 Patrón de post-quincena tan visible como el de la quincena y la pre-quincena y distinto de ambos (`design.md` D12): primero, si hay una propiedad del patrón que se pueda afirmar sin acoplarse a ECharts, su test en `tests/graficas/por-dia.test.ts`, que falla con la marca actual; luego el cambio en `src/graficas/estilo.ts`; verificar que el test de «tres marcas distintas» (`tests/graficas/por-dia.test.ts:79-85`) sigue en verde y dejar captura de la gráfica por día y de su leyenda en escala de grises con el fixture `2026-07-semilla-1`

## 4. Cliente: guardar al cargar, reemplazo y lista del historial

Depende del grupo 2. Área: `src/cliente/`, `tests/cliente/`, `tests/preparar-cliente.ts`, `tests/sistema/flujo-principal.spec.ts`, `tests/arquitectura/sistema.test.ts`, `playwright.config.ts`. Spec `historial-de-meses` (requisitos de la página) y `tablero-del-mes` («Elegir un CSV», «Flujo principal»); `design.md` D6 a D8 y D10. Textos visibles solo en `src/cliente/textos.ts`.

- [ ] 4.1 Tests primero del cliente del historial con un `fetch` falso: `listar`, `obtener` (validada con `leerMesGuardado`; una respuesta inválida es error), `guardar` con y sin `reemplazar` (método, URL, `Content-Type`, cuerpo), y 201, 200, 409, 404 y 500 convertidos en resultados o errores; luego el cliente; después, la ayuda de historial falso en memoria, la prop obligatoria de `App`, `main.tsx` con el cliente real, los 12 archivos de `tests/cliente/` que montan `<App />` con el falso, y `tests/preparar-cliente.ts` con un `fetch` global que falla; verificar que todo `tests/cliente/` sigue en verde y que quitar el falso de un test lo hace fallar por el `fetch` global
- [ ] 4.2 Tests de componente primero de R-09: al cargar un mes nuevo se guarda y se anuncia; con confirmación de R-05 se guarda solo al confirmar y nada al cancelar; con 409 se pregunta nombrando el mes, el tablero sigue visible, «Reemplazar» guarda con `reemplazar` y «Conservar el guardado» no; un error de red anuncia que no se pudo guardar y nunca el aviso de archivo ilegible; la respuesta de un guardado viejo no cambia el estado tras elegir otro archivo; luego el flujo en `App`; verificar con mutaciones: guardar sin esperar la confirmación de R-05, ocultar el tablero durante la pregunta
- [ ] 4.3 Tests de componente primero de la vista de historial: control de vistas accesible; tabla con mes en es-MX, transacciones y total en R-17; se actualiza tras guardar; si `listar` falla, lo dice y cargar un CSV sigue funcionando; volver al tablero conserva el mes y su filtro; luego la vista; verificar con una mutación que no recargue la lista tras guardar y dejar captura de la vista con dos meses
- [ ] 4.4 `playwright.config.ts` con `TABLERO_HISTORIAL` en el temporal del sistema, vacío en cada corrida, y un caso en `tests/arquitectura/sistema.test.ts` que falla si esa carpeta cae dentro del repositorio; `tests/sistema/flujo-principal.spec.ts` espera el resultado del guardado (aviso o pregunta de reemplazo) y comprueba que la única petición con cuerpo es `PUT /api/meses/2026-07` a 127.0.0.1 y que ningún cuerpo ni URL lleva el encabezado del CSV ni sus trozos; verificar (PM, `.claude/da/da sistema`) que pasan las tres specs existentes, que `historial/` no aparece en el worktree, y que la spec falla con la mutación «la página envía el texto del CSV» (no se commitea)

## 5. Cliente: comparación y flujo de sistema del historial

Depende de los grupos 3 y 4. Área: `src/cliente/`, `tests/cliente/`, `tests/sistema/`. Specs `comparacion-de-meses`, `historial-de-meses` («Persistencia en la suite de sistema») y `sin-red`; `design.md` D9 a D11.

- [ ] 5.1 Tests de componente primero de la comparación con el historial falso: con tres meses, por defecto el penúltimo contra el último; elegir otros dos; un mes no se compara consigo mismo; tabla con categorías, total al final, montos en R-17, diferencias con signo y el texto del catálogo cuando la proporción es `null`; con un solo mes, el mensaje de que hacen falta dos; la comparación no cambia con un filtro del tablero; luego la sección; verificar con una mutación que invierta base y comparado y otra que compare el mes filtrado
- [ ] 5.2 Tests primero de la gráfica de la comparación (título y descripción accesible con los montos en R-17) y de que `GastoPorCategoria` sigue dando su descripción; luego la gráfica con `porComparacion`, una sola `conDescripcion` exportada desde `src/cliente/opciones-de-graficas.ts` y usada también por `GastoPorCategoria.tsx`, y los componentes de ECharts que haga falta registrar en `src/cliente/echarts.ts`; verificar que `tests/cliente/categorias.test.tsx` y `tests/cliente/graficas-del-mes.test.tsx` siguen en verde y dejar captura de la comparación julio contra agosto
- [ ] 5.3 Spec de sistema nueva que importa `test` de `./sin-red`, levanta su propio servidor (`node dist-server/main.mjs`, otro puerto, carpeta temporal propia), carga los tres fixtures, reinicia el proceso con la misma carpeta, comprueba la lista (`$1,689,470.67`, `$1,544,622.78`, `$1,278,296.56`, 2,000 cada uno), recorre el 409 con «Conservar el guardado» y con «Reemplazar», y compara julio contra agosto (total `-$144,847.89` y `-8.6%`; Entretenimiento `+$588,512.93` y `+227.5%`), deteniendo el servidor también si falla; verificar (PM, `.claude/da/da sistema`) que pasa con las otras tres, que no queda ningún proceso escuchando en su puerto y que falla con cada mutación: el almacén no escribe en disco (solo memoria), el 409 se ignora y se sobrescribe, la comparación invierte base y comparado (mutaciones que no se commitean)
- [ ] 5.4 Peticiones tardías en `tests/sistema/sin-red.ts`: antes de evaluar, esperar con un tope a que no quede ninguna petición en vuelo en el contexto; verificar (PM, `.claude/da/da sistema`) que las cuatro specs pasan y que la mutación «la página lanza una petición a otro host con retraso tras la última aserción» hace fallar la prueba nombrando la URL (no se commitea)

## Workflow follow-up

- Archivar después de `fase-0-andamiaje`, `fase-1-cargar-y-ver-el-mes` y `fase-2-dashboard-filtros-y-tabla`: los deltas MODIFIED de `tablero-del-mes` y `arranque-local` necesitan sus specs principales.
