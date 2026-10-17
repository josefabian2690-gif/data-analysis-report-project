# Brief — Ola fase-3 «Historial y comparación»

Eres el **project manager** de la Ola fase-3 de tablero-gastos. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- **Base: `chore/fase-3-planning` sobre `ola/fase-2`, por petición del usuario, 2026-10-15 (avance continuo, sin merges a master).**
  - Verificado contra `ola/fase-2` @ `b19bb40` (PR de ola #23, abierta; `verify` verde con 578 tests y `sistema` 3/3 sobre ese SHA, según el Team Manager).
  - `ola/fase-3` sale de la punta de `chore/fase-3-planning` y su PR de ola apunta a `chore/fase-3-planning`.
  - Registro: `docs/olas/fase-3.md`.
- **Pila de PRs abiertas** (nadie mergea a `master` ni las de la cadena; el usuario las mergea todas después, en orden):
  - #3 → `master`, #4 → `master`, #8 → `chore/fase-0-planning`, #9 → `ola/fase-0`, #15 → `chore/fase-1-planning`, #16 → `ola/fase-1`, #23 → `chore/fase-2-planning`
  - #24, la PR de planeación de esta ola, `chore/fase-3-planning` → `ola/fase-2`
  - La rama principal es `master`, no `main`: en `.claude/da/da worktree montar` pasa siempre `--desde` explícito.
- **Change:** `fase-3-historial-y-comparacion`, ya propuesto y refinado; lo tomas, no lo reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable: `openspec-update-change` y registro.
- **Entregable:**
  - al aceptar una carga, el mes se guarda en el historial del servidor (`historial/AAAA-MM.json` o `TABLERO_HISTORIAL`) con escritura atómica; volver a cargar un mes guardado pregunta si se reemplaza (409, R-09) sin ocultar el tablero;
  - API del historial con las cuatro rutas de `docs/ARQUITECTURA.md`, validada con el esquema del dominio en los dos extremos;
  - vista «Historial» con la lista de meses guardados y la comparación de dos meses por categoría y total, en tabla y gráfica (R-15);
  - una spec de sistema que guarda los fixtures de julio, agosto y septiembre de 2026, reinicia el servidor, los ve, recorre el 409 y compara.
- **Reglas de la fase:** nada de mapa, hallazgos (R-16), exportar, abrir un mes guardado en el tablero, borrar desde la página ni comparar con filtros; **ninguna dependencia nueva**; sin historial disponible, lo de las fases 1 y 2 se comporta igual.
- **PRs internas: 5**, una por grupo.
  - Grafo: 1 → 2 → 4 → 5 y 1 → 3 → 5.
  - Paralelo declarado: el 3 (`src/graficas/`, `tests/graficas/`) junto al 2 (`src/servidor/`, `tests/servidor/`) y junto al 4 (`src/cliente/`, `tests/cliente/`, `tests/preparar-cliente.ts`, `tests/sistema/`, `tests/arquitectura/sistema.test.ts`, `playwright.config.ts`). Revisión y merge en serie.
  - El 4 espera al 2: su cambio de la suite de sistema necesita la API servida por `npm start`.
  - Estimados: 1 ~550, 2 ~800, 3 ~200, 4 ~650, 5 ~550 líneas. El 2 pasa de las ~600 orientativas a sabiendas (partirlo daría seis PRs). La ola está en el tope de 5: si un grupo hay que partirlo, escala al Team Manager antes.
- No se empieza la fase 4.

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4. Los encargos de dominio citan `docs/DOMINIO.md` (R-09, R-15, R-17 y *Casos borde*); los del servidor, `docs/ARQUITECTURA.md`, *API del historial* y *Almacenamiento*.
3. Los artefactos del change por la mecánica de OpenSpec. `instructions apply` devuelve `state: ready`, 0/17, **sin** `context` ni `operationGuidance` (comprobado el 2026-10-16). `openspec validate --strict` pasa con dos avisos informativos sobre el archivado (§3).
4. `docs/olas/fase-3-revision.md` (hallazgos y decisiones del pre-vuelo); `docs/olas/fase-2.md` y `docs/olas/fase-1.md`, *Decisiones del PM* y *Deuda*.
5. Guardas que no se ablandan:
   - `tests/arquitectura/` (capas, pureza, imports de la suite);
   - `tests/servidor/static-server.test.ts` sin cambios (el 405 fuera de `/api/` sigue);
   - `tests/sistema/dashboard-filtrado.spec.ts` y `pagina-vacia.spec.ts` sin cambios; `flujo-principal.spec.ts` solo cambia su aserción de peticiones (tarea 4.4);
   - los tests R-xx de las fases 1 y 2.

## 3. Reglas de la fase que mandan en cada PR

- **Decisiones del pre-vuelo** (`docs/olas/fase-3-revision.md` §7), escritas en el change con la recomendación:
  1. Guardado automático al aceptar la carga; con 409, pregunta sin ocultar el tablero (D7).
  2. La página lista y compara; borrar solo por API; abrir un mes guardado no entra.
  3. `comparar` admite N meses, cada uno contra el anterior; la página compara dos, por defecto los dos más recientes (D2, D9).
  4. Deuda que entra: peticiones tardías de la vigilancia (5.4), marca de post-quincena (3.2), una sola `conDescripcion` (5.2). No entran WebSockets, `Grafica.tsx`, CSS ni la deuda de la fase 1.
  5. Una ola de 5 PRs.

  Si el Team Manager te comunica otra cosa, manda lo suyo y se pasa por `openspec-update-change` (las decisiones 1 y 2 son del usuario).
- **Contratos (`docs/ARQUITECTURA.md`, *Contratos*):** `comparar(meses)` con esa firma; las cuatro rutas con 200, 201, 204, 404 y 409; `historial/AAAA-MM.json`, escritura atómica y `TABLERO_HISTORIAL`. Los únicos añadidos son los de `design.md` D13: `leerMesGuardado` y `esMes` en `esquema.ts`, la forma de `Comparacion`, dos formatos con signo, los códigos 400/403/413/415, `porComparacion(c, rotulos)` y la prop del cliente del historial en `App`. Cualquier otro cambio de firma se escala.
- **Ningún test escribe en `historial/` del repositorio** ni ningún test de componente hace red. Tras cada `verify` y cada `sistema`, `git status --ignored` del worktree no muestra `historial/`.
- **Las cifras de las pruebas con fixtures son literales** (§4, grupo 1). Una prueba que calcula lo esperado llamando al dominio es tautológica y no vale (`CLAUDE.md`, *Test driven development* 6).
- **Textos visibles** solo en `src/cliente/textos.ts`, también los nombres de los meses de la gráfica: `graficas` los recibe por argumento.
- **Comentarios:** ninguno cita `openspec/changes/`. Si el porqué del `Host` (D4) o de no ocultar el tablero durante la pregunta (D7) hace falta en el código, se escribe entero.
- **Archivado:** este change se archiva después de `fase-0-andamiaje`, `fase-1-cargar-y-ver-el-mes` y `fase-2-dashboard-filtros-y-tabla` (sus deltas MODIFIED necesitan las specs principales). Dilo en el handover de cierre para el Archivador.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-16)

- **Grupo 1 — Dominio: esquema en tiempo de ejecución, comparación y formatos** (`implementador`)
  - `Transaccion` es solo una interfaz (`src/dominio/esquema.ts:5-24`); `VALORES_POR_DEFECTO` en `:27-31`. `leerFecha` y `diasDelMes` en `src/dominio/fecha.ts:18` y `:13` validan fecha y hora; reutilízalos.
  - `formatearMonto` y `formatearProporcion` (`src/dominio/formato.ts:9-22`) no llevan signo. Con `signDisplay: 'exceptZero'` de `Intl` en es-MX salen `+$588,512.93`, `-$266,326.22`, `+227.5%`, `-17.2%`, con guion ASCII (comprobado con Node 22).
  - `metricas` (`src/dominio/metricas.ts`) ya da `gastoTotal`, `numeroDeTransacciones` y `gastoPorCategoria`; `comparar` puede apoyarse en lo mismo o sumar por categoría, pero sin redondear.
  - **Cifras de los fixtures** (módulo `csv` de Python con `Decimal`, fuera del tablero; todas las filas de cada archivo son de su mes):
    - Totales: julio 1 689 470.67; agosto 1 544 622.78; septiembre 1 278 296.56; 2 000 filas cada uno.
    - Julio → agosto: total -144 847.89 (-8.5736 %); Compras 814 566.30 → 201 746.52 (-612 819.78, -75.2326 %); Entretenimiento 258 692.09 → 847 205.02 (+588 512.93, +227.4955 %).
    - Agosto → septiembre: total -266 326.22 (-17.2422 %); Comida 172 038.57 → 693 983.87 (+521 945.30, +303.3885 %).
    - Las diez categorías aparecen en los tres meses: «categoría ausente» y «anterior 0» solo con transacciones hechas a mano.
- **Grupo 2 — Servidor: almacén y API** (`implementador-servidor`; skill de área `nodejs-backend-patterns`)
  - `readConfig(env)` devuelve `{ port, openBrowser }` (`src/servidor/config.ts:24-29`); `tests/servidor/config.test.ts:7` la compara con `toEqual` y hay que actualizarlo.
  - `start(deps)` (`src/servidor/startup.ts:46-55`) recibe `env`, `bundleDirectory` y `log`; `main.ts:9` es el único que conoce la raíz (`process.cwd()`) y pasa `process.env` (`:25`). La carpeta del historial se resuelve ahí o en `readConfig` con la raíz como argumento, y llega inyectada a todo lo demás (D5).
  - `startStaticServer` (`src/servidor/static-server.ts:68-79`) responde 405 a todo lo que no sea `GET`/`HEAD` (`:48-50`); las rutas `/api/` se atienden antes y el resto no cambia. `resolveInside` (`:27-40`) ya enseña cómo se rechaza una ruta mal codificada.
  - `pedir` (`tests/servidor/ayudas.ts:15-35`) usa `node:http` a propósito (fetch normaliza `..`); amplíalo con cuerpo y encabezados, no lo cambies por `fetch`. `cerrar` (`:37-42`) cierra con `closeAllConnections`.
  - Los tests de arranque ya usan `mkdtempSync` (`tests/servidor/startup.test.ts:52-57`); el historial, igual.
  - El total de la lista sale de `metricas(tx).gastoTotal` para coincidir con el KPI (`$1,689,470.67` para julio).
- **Grupo 3 — Gráficas: comparación y marca de post-quincena** (`implementador-graficas`)
  - `columnas` y `serieDeClase` (`src/graficas/columnas.ts`) apilan series (`stack: 'gasto'`); la comparación necesita columnas **agrupadas** (una serie por mes, sin `stack`), así que no basta con reutilizar `serieDeClase` tal cual.
  - Leyenda arriba con `top: 8` y franja reservada (`columnas.ts:47-50`): sin eso ECharts 6.1.0 la pone abajo (`docs/olas/fase-2.md`, *Se coló*).
  - Marcas en `src/graficas/estilo.ts:13-38`; la de post-quincena es `MARCA_DE_PUNTOS` (`:23-29`, `symbolSize: 0.8`) y se asigna en `src/graficas/por-dia.ts:16`. El test de «tres marcas distintas» está en `tests/graficas/por-dia.test.ts:79-85`.
  - **No** se arregla con luminancia: quincena, post y pre están a 1.06, 1.15 y 1.47:1 del gris `#64748b` (WCAG 2, calculado); el defecto es solo el patrón de puntos (D12). La evidencia es la captura en gris de la barra y de la leyenda.
  - Lint: en `src/graficas/` solo `import type` de `echarts` (`eslint.config.mjs:94-115`).
- **Grupo 4 — Cliente: guardar, reemplazo y lista** (`implementador-cliente`; `javascript-testing-patterns`)
  - `App` (`src/cliente/App.tsx:26-70`) no tiene props. `alElegir` (`:30-42`) convierte cualquier rechazo de la lectura en `ILEGIBLE` (`:37-40`): el guardado va fuera de esa cadena. «Solo cuenta la última elección» con `ultimaEleccion` (`:28`, `:36`, `:41`): aplica el mismo criterio a la respuesta del guardado.
  - La confirmación de R-05 vive en el estado `por-confirmar` (`App.tsx:57-64`): el guardado empieza al pasar a `tablero`, no antes.
  - `Tablero` se monta con `key={pantalla.eleccion}` (`App.tsx:66`) y guarda su filtro en estado (`src/cliente/Tablero.tsx:17`): para conservar el filtro al cambiar de vista, el tablero se queda montado y oculto.
  - Los 12 archivos de `tests/cliente/` que montan `<App />` (37 sitios: `App`, `kpis`, `grafica`, `confirmacion`, `tabla`, `estado-vacio`, `recalculo`, `categorias`, `resumen`, `filtros`, `graficas-del-mes`, `tabla-paginacion`) pasan al historial falso; la ayuda vive en `tests/cliente/ayudas.ts` o una nueva junto a ella. `tests/preparar-cliente.ts` (5 líneas) hoy solo registra `jest-dom` y `cleanup`.
  - `formatearMes` está en `src/cliente/presentacion.ts`.
  - Suite: `playwright.config.ts:11-16` sin `TABLERO_HISTORIAL`; `flujo-principal.spec.ts:89-92` es la aserción a cambiar; su comprobación de trozos en la URL (`:93-98`) se queda. El caso nuevo de `tests/arquitectura/sistema.test.ts` puede importar la configuración de Playwright (`defineConfig` es una función pura).
  - Capturas: contra `npm start` del worktree con `TABLERO_HISTORIAL` temporal y `TABLERO_PUERTO` propio, levantado por ti con candado solo mientras el implementador captura; `npm run dev` no sirve `/api/` y mostraría «historial no disponible».
- **Grupo 5 — Cliente: comparación y sistema del historial** (`implementador-cliente`; `javascript-testing-patterns`)
  - `conDescripcion` en `src/cliente/opciones-de-graficas.ts:14-17` y su copia en `src/cliente/GastoPorCategoria.tsx:10-25`: queda una, exportada desde `opciones-de-graficas.ts`.
  - `src/cliente/echarts.ts:6` registra `BarChart`, `GridComponent`, `AriaComponent`, `LegendComponent` y `SVGRenderer`; si la gráfica nueva usa otro componente, se registra ahí (la fase 2 tuvo un BLOQUEA por un componente sin registrar).
  - `npm start` construye y ejecuta `node dist-server/main.mjs` (`package.json`, script `start`): la spec de persistencia arranca ese archivo con otro puerto y su propia carpeta, lo detiene y lo vuelve a arrancar (D10). Debe detenerlo siempre; tras `sistema`, comprueba que no queda ningún proceso escuchando en ese puerto.
  - `sin-red.ts` escucha `request` en el contexto (`tests/sistema/sin-red.ts:17-27`); las peticiones tardías se esperan ahí, con tope (D11).
  - Cifras literales de la spec: lista `$1,689,470.67`, `$1,544,622.78`, `$1,278,296.56`, `2,000` cada uno; julio contra agosto: total `-$144,847.89` y `-8.6%`, Entretenimiento `+$588,512.93` y `+227.5%`, Compras `-$612,819.78` y `-75.2%`; por defecto (agosto contra septiembre): total `-$266,326.22` y `-17.2%`.

## 5. Mecánica de esta fase

- **Base de la ola:** `chore/fase-3-planning` sobre `ola/fase-2` (avance continuo pedido por el usuario el 2026-10-15; la PR de ola de la fase 2 es la #23). De ahí sale `ola/fase-3` y a ahí apunta su PR.
- Quién propone (el Team Manager, vía el Planeador) y quién toma (el PM); a quién se escala (al Team Manager). El checkout principal está en `master` con cambios sin commitear en `.claude/` que no son de la ola: no lo toques ni cambies su rama. Worktrees en `/home/fabs/da-wt/tablero-gastos/<grupo>` con `.claude/da/da worktree montar … --desde <rama>`.
- Entorno conocido: issues deshabilitadas (la deuda va al registro y a la PR de ola); sin `"type": "module"` en `package.json`; `gh pr edit` falla, el cuerpo se edita con `gh api -X PATCH repos/josefabian2690-gif/data-analysis-report-project/pulls/<n> -F body=@cuerpo.md`; `.claude/da/da medir` falla (*Coste* a mano); ni `npx` ni instalaciones, tampoco para consultas.
- El handover, el comando pesado uno a la vez y graft con `--no-refresh` viven en `desarrollo-autonomo-pm` y en `CLAUDE.md` (*Desarrollo agéntico* 8-9).
- Cierre: PR `ola/fase-3 → chore/fase-3-planning` con la plantilla B, abierta para el usuario. Nada llega a `master` por el PM.

## 6. Primer paso concreto

- `.claude/da/da preflight` limpio, `.claude/da/da verify` verde sobre la punta de `chore/fase-3-planning`, `.claude/da/da sistema` 3/3, mecánica de OpenSpec; con eso, la lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager **solo si hay algo que pedir al usuario** —si las decisiones 1 y 2 del pre-vuelo ya están confirmadas, no hay nada—, y después la rama, el registro y el primer encargo (grupo 1).
