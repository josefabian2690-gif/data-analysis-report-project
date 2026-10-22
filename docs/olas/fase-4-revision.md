# Revisión de pre-vuelo — Ola fase-4 «Mapa y hallazgos»

Verificado contra `master` @ `bdfbc40` el 2026-10-21. Change propuesto en este pre-vuelo: `fase-4-mapa-y-hallazgos`.

## 1. Veredicto

- `fase-4-mapa-y-hallazgos`: lista para un PM.
- Ola entera: **lista para delegar**, con la recomendación de la decisión 1 (umbrales solo en memoria) ya escrita en los artefactos; si el usuario elige otra opción, cambia solo el grupo 4 (`openspec-update-change`).
- Lo más importante: las definiciones de R-16, calculadas sobre los tres CSV, recuperan el patrón de cada `*.esperado.json`. El test de semillas se puede cumplir sin tocar el generador ni los fixtures.

## 2. La ola

- **Ola fase-4 — `fase-4-mapa-y-hallazgos`** (4 PRs internas)
  - **Entregable**
    - `hallazgos(tx, umbrales?, periodo?)` en `src/dominio/`, con un test de semillas por fixture contra su `*.esperado.json`
    - un panel de hallazgos tras los KPIs, con umbrales que se ajustan desde la pantalla
    - un mapa local de puntos por longitud y latitud, con color y forma por zona, encuadrado en la ciudad principal
    - `tests/sistema/flujo-principal.spec.ts` comprueba hallazgos y mapa
  - **Componentes que se modifican**
    - `src/dominio/` (hallazgos y zonas, nuevos; `metricas.ts` gana los puntos del mapa)
    - `src/graficas/` (función del mapa; paleta y formas en `estilo.ts`)
    - `src/cliente/` (`Tablero.tsx`, `App.tsx` por el estado de los umbrales, `echarts.ts`, `textos.ts`, `estilos.css`, `opciones-de-graficas.ts`, componentes nuevos)
    - `tests/graficas/metricas-de-prueba.ts`, `tests/cliente/graficas-del-mes.test.tsx:56` y `:63`, `tests/sistema/flujo-principal.spec.ts`
    - No se toca: `generador/`, `tests/fixtures/`, `src/servidor/`, `src/reporte/`, `package.json`, `eslint.config.mjs`, `playwright.config.ts`

## 3. Hallazgos

### BLOQUEA EL ARRANQUE

- Ninguno pendiente.
  - Los dos `[PENDIENTE]` de la fase 4 en `docs/PLAN.md:65-66` los cerró el usuario el 2026-10-21. Se registran en la PR aparte de `docs/` (ver §7). Los artefactos del change ya los aplican.

### CORREGIR ANTES DE ENCARGAR (aplicado en los artefactos)

- **Dos tests existentes no sobreviven al mapa.**
  - `tests/cliente/graficas-del-mes.test.tsx:56` cuenta 6 `img`; `:63` fija el orden de los `h2` desde categoría hasta la tabla (verificado).
  - Corrección: los hallazgos van antes de categoría, así que `:63` no cambia por ellos (`design.md` D10). El mapa va entre cuenta y tabla, y la tarea 3.1 actualiza los dos tests de forma explícita.
- **`Tablero` pierde su estado con cada CSV.**
  - `src/cliente/App.tsx:141` lo monta con `key={pantalla.eleccion}` (verificado).
  - Unos umbrales guardados dentro de `Tablero` se perderían al cargar otro mes. Corrección: el estado vive en `App` (`design.md` D7), con una tarea y una mutación que lo guardan (4.2).
- **`graficas` solo importa tipos de `echarts`.**
  - `eslint.config.mjs:49-55` y `:104`: scatter y dataZoom se registran en `src/cliente/echarts.ts`.
  - Escrito en `design.md` D9 y en la tarea 3.1.
- **R-16 deja huecos de interpretación.**
  - Ciudad de una zona, días sin gasto, percentil, zona favorita sin umbral, alcance del filtro.
  - Resueltos como decisiones técnicas en `design.md` D3 a D6. Cada uno se comprobó contra las cifras de los fixtures.

### DEUDA (no bloquea)

- **`Grafica` recrea la instancia de ECharts en cada cambio de opción** (`src/cliente/Grafica.tsx:9-19`, `docs/olas/fase-2.md`).
  - Con el mapa son siete gráficas recreadas por cada cambio de filtro.
  - Con ~20 000 puntos reales en SVG puede notarse. Los fixtures tienen 2 000.
  - Queda declarada como riesgo aceptado en `design.md`, sin tarea. Las issues están deshabilitadas en el repositorio y no se abrió ninguna.
- **El mecanismo del zoom no se pudo comprobar.**
  - No hay `node_modules` instalado en ningún checkout de esta máquina para abrir ECharts 6.1.0.
  - Que scatter y dataZoom vienen en ECharts es inferido, no verificado.
  - `design.md` D9 fija el objetivo y deja el mecanismo al grupo 2, que lo verifica en el instalado.

## 4. Tope de PRs y partición

- 4 grupos, 4 PRs, dentro del tope de 5.
- Grafo: 1 → 2 → 3 y 1 → 4 → 3; el 2 y el 4 van en paralelo (áreas disjuntas).
- Tamaño estimado:
  - grupo 1: ~550 líneas
  - grupo 2: ~350
  - grupo 3: ~350
  - grupo 4: ~650, un poco por encima de las ~600 orientativas. Partirlo separaría el panel de los umbrales que lo alimentan.

## 5. Lo que la ola absorbe

- Nada de la deuda de `docs/olas/fase-0.md` a `fase-3.md`.
  - Lo que queda abierto es mecánica o no toca a mapa ni hallazgos.
  - La deuda de `Grafica` se queda fuera a sabiendas (ver §3).

## 6. Lo que está bien

- Las cifras de los fixtures coinciden con sus esperados en las tres semillas.
  - Dominante: 48.2 %, 54.8 % y 54.3 %.
  - Viaje: 3 días cada uno.
  - Fin de semana de la semilla 3: 1.25, sobre el umbral de 1.2.
- `tests/fixtures/integridad.test.ts:143-186` ya comprueba los patrones con un cálculo propio: es una guarda independiente del dominio nuevo.
- El calendario de R-13 y R-14 ya existe y se reutiliza (`src/dominio/calendario.ts:37-72`).
- Cada fixture tiene 7 zonas: caben en 7 formas distintas de punto.
- `openspec validate fase-4-mapa-y-hallazgos --strict` pasa.

## 7. Decisiones

1. **(Alcance, usuario.) ¿Los umbrales ajustados se conservan?**
   - Opciones:
     - (a) solo en memoria: sobreviven a otro CSV y se pierden al recargar;
     - (b) en el navegador (`localStorage`);
     - (c) en disco por el servidor (API nueva).
   - Recomendación: (a), y es lo que dicen los artefactos. Es la lectura mínima de «se ajustan desde la pantalla». (c) cambia un contrato de `docs/ARQUITECTURA.md`.
2. **(Técnica, Team Manager.) ¿Los hallazgos siguen al filtro?**
   - Opciones: (a) sí, sobre el conjunto filtrado y su periodo; (b) siempre sobre el mes entero.
   - Recomendación: (a). `docs/PLAN.md` dice «todo el dashboard se recalcula» (flujo 3).
3. **(Técnica, Team Manager.) ¿De dónde salen los puntos del mapa?**
   - Opciones: (a) dos campos nuevos en `Metricas`; (b) `graficas` recibe `Transaccion[]`.
   - Recomendación: (a). Mantiene cierta la tabla de capas («a partir de `Metricas`»).
4. **(Técnica, Team Manager.) ¿Cómo se encuadra el mapa con un viaje a cientos de km?**
   - Opciones:
     - (a) abrir en la ciudad principal, con zoom y desplazamiento;
     - (b) encuadrar todos los puntos: las zonas de CDMX quedan amontonadas en un punto;
     - (c) dos paneles.
   - Recomendación: (a).
5. **(Alcance, usuario; PR aparte.) Registrar las dos decisiones del 2026-10-21 en `docs/PLAN.md`.**
   - Se actualiza también la frase de al lado en `docs/STACK.md:46` («o con un GeoJSON local… ver Pendientes de PLAN»).
   - Va en una PR de `docs/` que mergea el usuario, porque se sale del dominio de planeación.
   - Recomendación: mergearla junto con la de planeación.
