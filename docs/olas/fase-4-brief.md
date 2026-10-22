# Brief — Ola fase-4 «Mapa y hallazgos»

Eres el **project manager** de la Ola fase-4 de tablero-gastos. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- **Base: `master` @ `bdfbc40` o posterior** (rama principal `master`, no `main`). Pasa siempre `--desde` explícito a `.claude/da/da worktree montar`. Las fases 0 a 3 ya están en `master` y archivadas.
  - Rama `ola/fase-4` desde `master`, después de mergear la PR de planeación de esta ola. Registro: `docs/olas/fase-4.md`.
- **Change:** `fase-4-mapa-y-hallazgos`, ya propuesto y refinado; lo tomas, no lo reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable: `openspec-update-change` y registro.
- **Decisiones del usuario del 2026-10-21 que gobiernan la ola:**
  - el mapa son **solo puntos coloreados por zona**: sin contorno de CDMX ni GeoJSON;
  - los umbrales de R-16 **se ajustan desde la pantalla**.
- **Entregable:**
  - `hallazgos(tx, umbrales?, periodo?)` en `src/dominio/`, con un test de semillas por fixture contra su `*.esperado.json` (categoría dominante, zona favorita, viaje);
  - un panel de hallazgos tras los KPIs, cada uno con texto es-MX y evidencia en R-17, y un control por umbral con «Restablecer»;
  - una sección de mapa entre «Gasto por cuenta» y la tabla: puntos por longitud y latitud, con color y forma por zona, encuadrados en la ciudad principal, y zoom para llegar al resto; un mes sin coordenadas muestra el mensaje en lugar del mapa;
  - mapa y hallazgos siguen al filtro;
  - `tests/sistema/flujo-principal.spec.ts` comprueba hallazgos y mapa.
- **PRs internas: 4**, una por grupo.
  - Grafo: 1 → 2 → 3 y 1 → 4 → 3.
  - En paralelo: el 2 (`src/dominio/metricas.ts`, `src/graficas/`, `tests/graficas/`, el test nuevo del mapa en `tests/dominio/`) con el 4 (`src/cliente/`, `tests/cliente/`). Revisión y merge en serie.
  - El 3 espera al 2 y al 4: comparte con el 4 `Tablero.tsx`, `textos.ts` y `estilos.css`.
  - Estimados de diff:
    - grupo 1: ~550 líneas
    - grupo 2: ~350
    - grupo 3: ~350
    - grupo 4: ~650, a sabiendas: panel y umbrales van juntos.
- No se empieza la fase 5 (exportar).

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4.
   - Los encargos de dominio citan `docs/DOMINIO.md`: R-12, R-13, R-14, R-16, R-17 y *Casos borde* («Un mes sin coordenadas», «Filtros que dejan 0 filas», «Un viaje que cruza el fin de mes»).
3. Los artefactos del change por la mecánica de OpenSpec.
   - `instructions apply` devuelve 4 `contextFiles` de specs, más proposal, design y tasks, **sin** `context` ni `operationGuidance` (comprobado el 2026-10-21).
   - `openspec validate fase-4-mapa-y-hallazgos --strict` pasa.
4. `docs/olas/fase-4-revision.md` (hallazgos y decisiones del pre-vuelo) y `docs/olas/fase-2.md`, *Deuda* (la de `Grafica`).
5. Guardas que no se ablandan:
   - `tests/arquitectura/` (capas, pureza, imports de la suite);
   - `tests/fixtures/integridad.test.ts`, sobre todo `:143-186`, que comprueba los patrones con un cálculo propio, independiente del dominio nuevo;
   - los tests R-xx de las fases 1 a 3 y `tests/dominio/metricas-*.test.ts`, que no cambian salvo `METRICAS_VACIAS`;
   - `tests/sistema/dashboard-filtrado.spec.ts`, `persistencia.spec.ts` y `pagina-vacia.spec.ts` sin cambios;
   - en `flujo-principal.spec.ts` solo se **añaden** aserciones.

## 3. Reglas de la fase que mandan en cada PR

- Fuera de alcance:
  - exportar;
  - contorno o GeoJSON;
  - umbrales en disco o en `localStorage` (decisión 1 de la revisión; si el usuario la cambia, el Team Manager te lo dice y se actualiza el grupo 4);
  - hallazgos o mapa de un mes del historial;
  - proyección cartográfica;
  - tocar `src/cliente/Grafica.tsx` por rendimiento.
- Ninguna dependencia nueva; ningún recurso del mapa fuera del bundle; ninguna petición fuera de 127.0.0.1.
- Contratos:
  - `hallazgos`, `Hallazgo` y `Umbrales` en `src/dominio/`.
  - Añadidos aditivos declarados en `design.md` D2 y D8: el `periodo` opcional de `hallazgos` y los campos nuevos de `Metricas`.
  - La API del historial no cambia.
- Textos visibles solo en `src/cliente/textos.ts`. El dominio devuelve hallazgos estructurados, nunca frases (`design.md` D1).
- Cifras de las pruebas con fixtures: literales, las de `design.md` *Context*.
- No se tocan `generador/`, `tests/fixtures/`, `src/servidor/`, `src/reporte/`, `package.json`, `vite.config.mts`, `eslint.config.mjs` ni `playwright.config.ts`.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-21, `master` @ `bdfbc40`)

- **Grupo 1 — Dominio: hallazgos, umbrales, ciudad principal y semillas.**
  - Reutiliza el calendario: `tipoDeDia`, `esFinDeSemana`, `recorrerPeriodo` y `periodoDelMes` (`src/dominio/calendario.ts:37-72`).
  - Los promedios por día siguen el criterio de `gastoPorDiaDeLaSemana` (`src/dominio/metricas.ts:166-178`): días naturales, con o sin gasto.
  - Precedente de parámetro opcional aditivo: `metricas(tx, periodo?)` (`src/dominio/metricas.ts:180`).
  - Los esperados (`tests/fixtures/generador/*.esperado.json`) traen `categoriaDominante`, `zonaFavorita` y `viaje.{destino,desde,hasta}` con días `AAAA-MM-DD`.
  - Las cifras de la tabla de `design.md` se calcularon sobre los CSV con las definiciones D3 a D5 y cuadran con los tres esperados. El total de Compras (`$814,566.30`) coincide con el escenario de filtro de `filtros-del-tablero`.
  - Trampa: el destino nunca gana la zona favorita en las semillas (el segundo es Monterrey con `$149,496.03`, contra `$269,450.15`). Por eso solo la proporción literal (72.8 %) detecta que se dejen de excluir las zonas de fuera.
  - Trampa: los atípicos de la semilla 1 (`TX001575` y `TX000039`) dependen del percentil por rango más cercano (D5); otra definición da otra cuenta.
- **Grupo 2 — Dominio y gráficas: puntos del mapa.**
  - `Metricas` (`src/dominio/metricas.ts:66-89`) gana los puntos por zona en el orden de `gastoPorZona`, la cuenta sin coordenadas y la ciudad principal (`design.md` D8).
  - El único literal de `Metricas` en los tests es `METRICAS_VACIAS` (`tests/graficas/metricas-de-prueba.ts:4`), que importan 7 archivos de `tests/graficas/`.
  - `graficas` solo importa **tipos** de `echarts` (`eslint.config.mjs:49-55` y `:104`).
  - El estilo actual está en `src/graficas/estilo.ts`: paleta de énfasis y marcas `decal`. La paleta categórica y las formas son nuevas.
  - Cada fixture tiene 7 zonas (6 de CDMX y el destino). Las formas de punto de ECharts alcanzan para 7.
  - **No verificado:** sin `node_modules` en la máquina del pre-vuelo no se abrió ECharts 6.1.0. El implementador comprueba en el instalado `ScatterChart`, dataZoom interno sobre ejes de valor y las formas (`symbol`) antes de diseñar el test de encuadre.
- **Grupo 4 — Cliente: panel de hallazgos y umbrales.**
  - `Tablero` se remonta con cada carga (`key={pantalla.eleccion}`, `src/cliente/App.tsx:141`). Por eso el estado de los umbrales vive en `App` (`design.md` D7), con una mutación que lo guarda.
  - El panel va tras `<Kpis>` y antes de `<GastoPorCategoria>` (`src/cliente/Tablero.tsx:39-40`). Así el orden de `h2` que fija `tests/cliente/graficas-del-mes.test.tsx:63`, que empieza en categoría, no cambia.
  - Los componentes montan `<App historial={crearHistorialFalso()} />` y cargan con `elegir(archivoCsv(...))` (`tests/cliente/ayudas.ts`, `tests/cliente/historial-falso.ts`).
  - Con 0 filas filtradas, `Tablero` ya oculta todo lo de debajo del mensaje (`src/cliente/Tablero.tsx:37-44`). El panel entra dentro de ese bloque.
- **Grupo 3 — Cliente: sección del mapa y sistema.**
  - `src/cliente/echarts.ts:6` registra hoy `BarChart`, `GridComponent`, `AriaComponent`, `LegendComponent` y `SVGRenderer`. El mapa añade lo suyo ahí.
  - El renderizador es SVG porque canvas falla en jsdom (`src/cliente/echarts.ts:8`). Si dataZoom falla en jsdom, escala: mockearlo no vale como prueba.
  - `tests/cliente/graficas-del-mes.test.tsx:56` (6 `img`) y `:63` (orden hasta la tabla) cambian en la tarea 3.1.
  - `tests/fixtures/a-mano/minimo.csv` no tiene columnas de coordenadas: sirve para el caso «sin coordenadas».
  - El flujo de sistema (`tests/sistema/flujo-principal.spec.ts:10-16`) ya lee el esperado. Se amplía su tipo con `zonaFavorita` y `viaje.destino`. Las tres filas añadidas son inválidas, así que los hallazgos salen de las 2 000 del fixture.
- **Skills:** bastan los del perfil, sin instalar ninguno:
  - precargados: `tdd`, `codebase-design`, `solid` y `gh`;
  - por área: `typescript-advanced-types`, `vitest`, `javascript-testing-patterns` y `vercel-react-best-practices`.
  - `dataviz` no está en el perfil, pero está disponible. Conviene nombrarlo en el encargo del grupo 2 para la paleta categórica y las formas.

## 5. Mecánica de esta fase

- **Base de la ola:** `master`, sin avance continuo. De ahí sale `ola/fase-4` y a ahí apunta su PR.
- Quién propone y quién toma:
  - propone el Team Manager, vía el Planeador; toma el PM; se escala al Team Manager.
- Otra sesión puede compartir el repo hoy:
  - un PM de arreglo trabaja sobre `.claude/` y `.github/` (el workflow `citas.yml`, que hoy solo corre contra `main`). Puede que tus PRs no tengan CI hasta que se mergee.
  - El checkout principal tiene archivos del kit sin commitear: no lo toques y trabaja en worktrees.
- El handover, la regla de no cambiar la rama del checkout principal y el comando pesado uno a la vez viven en `desarrollo-autonomo-pm` (§6, §1.7) y en `CLAUDE.md` (*Desarrollo agéntico* 8-9). Los worktrees se montan con `.claude/da/da worktree montar`.
- Cierre: PR `ola/fase-4 → master` con la plantilla B, abierta para el usuario. Nada llega a `master` por el PM. Las issues están deshabilitadas en el repositorio: no hay `Closes #N`.

## 6. Primer paso concreto

- `.claude/da/da preflight` limpio, `.claude/da/da verify` verde sobre `master`, y la mecánica de OpenSpec.
- Con eso, la lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager **solo si hay algo que pedir al usuario**. Si no, aviso y arranque.
- Después: la rama, el registro y el primer encargo (grupo 1).
