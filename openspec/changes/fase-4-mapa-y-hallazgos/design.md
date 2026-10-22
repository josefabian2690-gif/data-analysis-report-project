# Design

## Context

Ver `proposal.md` (*Why*). Estado verificado en `master`  `bdfbc40`:

- `src/dominio/` no tiene hallazgos ni `Umbrales`; `docs/ARQUITECTURA.md` fija `hallazgos(tx: Transaccion[], umbrales?: Umbrales): Hallazgo[]`. `metricas(tx, periodo?)` (`src/dominio/metricas.ts:180`) ya añadió un `periodo` opcional a su firma del contrato.
- El calendario ya da lo que R-16 necesita de R-13 y R-14: `tipoDeDia`, `esFinDeSemana`, `recorrerPeriodo`, `periodoDelMes` (`src/dominio/calendario.ts:37-72`); el periodo del filtro sale de `periodoDelFiltro` (`src/dominio/filtro.ts:56`).
- `Metricas` (`src/dominio/metricas.ts:66-89`) no lleva coordenadas; `METRICAS_VACIAS` (`tests/graficas/metricas-de-prueba.ts:4`) es el único literal de `Metricas` en los tests.
- `graficas` solo importa tipos de `echarts`; el runtime se registra en `src/cliente/echarts.ts`, que hoy registra `BarChart`, `Grid`, `Aria`, `Legend` y el renderizador SVG (necesario en jsdom). `Grafica` (`src/cliente/Grafica.tsx`) recrea la instancia en cada cambio de opción.
- `Tablero` (`src/cliente/Tablero.tsx:16-47`) se monta con `key={pantalla.eleccion}` (`src/cliente/App.tsx:141`): todo su estado se pierde al cargar otro CSV.
- `tests/cliente/graficas-del-mes.test.tsx:56` cuenta 6 elementos `img` y `:63` fija el orden de los `h2` desde «Gasto por categoría» hasta la tabla.
- Cifras de los fixtures, calculadas sobre los CSV con las definiciones de abajo (las pruebas las escriben literales):

| Fixture | Dominante | Zona favorita | Quincena | Fin de semana | Viaje | Atípicos |
|---|---|---|---|---|---|---|
| `2026-07-semilla-1` | Compras `$814,566.30`, 48.2 % | Centro Histórico, CDMX `$269,450.15` de `$369,882.65` (72.8 %) | 2.83 | 1.67 | Monterrey, N.L., 24 al 26/07, `$276,744.96` | 2: `TX001575` `$10,795.88` (Entretenimiento, p99 2 830.19) y `TX000039` `$5,818.78` (Comida, p99 1 361.79) |
| `2026-08-semilla-2` | Entretenimiento `$847,205.02`, 54.8 % | Condesa, CDMX (45.5 %) | 3.27 | 2.67 | Puerto Vallarta, Jal., 21 al 23/08, `$312,186.16` | 0 |
| `2026-09-semilla-3` | Comida `$693,983.87`, 54.3 % | Coyoacán, CDMX (53.1 %) | 2.40 | 1.25 | Monterrey, N.L., 04 al 06/09, `$231,365.00` | 0 |

  Los tres esperados coinciden con esas cifras; `tests/fixtures/integridad.test.ts:143-186` ya comprueba los patrones con su propio cálculo, independiente del dominio.

## Goals / Non-Goals

**Goals:**
- Hallazgos puros, deterministas y estructurados; el texto visible vive en `src/cliente/textos.ts`.
- Mapa sin dependencia nueva ni recurso externo, con las zonas de la ciudad principal distinguibles con la semilla 1.

**Non-Goals:**
- Proyección cartográfica: longitud y latitud van sobre ejes lineales; la deformación a la latitud de CDMX es pequeña y se acepta.
- Rendimiento con 20 000 puntos más allá de que funcione (ver *Risks*).
- Exportar hallazgos o mapa (fase 5).

## Decisions

**D1. `Hallazgo` es una unión discriminada por `tipo`.** Cada variante lleva su evidencia (`categoria-dominante`: categoría, monto, proporción; `zona-favorita`: zona, monto, proporción; `quincena` y `fin-de-semana`: los dos promedios y la razón; `viaje`: destino, desde, hasta, monto; `atipicos`: las transacciones de mayor a menor monto). Orden de la lista: el de R-16, y los viajes de mayor a menor monto. *Alternativa descartada:* el dominio devuelve texto; rompe la convención de textos visibles en `src/cliente/textos.ts` y acopla el test de semillas a la redacción.

**D2. Firma `hallazgos(tx, umbrales?, periodo?)`.** `umbrales` es `Partial<Umbrales>` mezclado con `UMBRALES_POR_DEFECTO` (`{ categoriaDominante: 0.35, quincena: 1.5, finDeSemana: 1.2, diasDeViaje: 4, factorDeAtipicos: 3 }`); `periodo`, como en `metricas`, por defecto el mes de las transacciones. Añadido aditivo al contrato de `docs/ARQUITECTURA.md`, igual que el de `metricas`.

**D3. Ciudad y ciudad principal en un módulo propio de `src/dominio/`.** La ciudad es el texto tras la última coma (`"Roma Norte, CDMX"` → `CDMX`), o la zona entera sin coma; `Sin zona` (R-02) no es ciudad. Lo usan hallazgos (grupo 1) y el mapa (grupo 2), por eso va en el grupo 1.

**D4. Promedios por día sobre los días naturales del periodo**, con o sin gasto, como `gastoPorDiaDeLaSemana` (`src/dominio/metricas.ts:166-178`). Si un grupo no tiene días o su promedio es 0, no hay hallazgo: así no hay división entre cero con filtros.

**D5. Percentil 99 por rango más cercano** (`⌈0.99·n⌉`-ésimo de los montos ordenados). Con menos de 100 transacciones en una categoría es el máximo y nada puede ser atípico con factor ≥ 1; se acepta y se documenta en el test.

**D6. Hallazgos sobre el conjunto filtrado**, con el periodo del filtro (`periodoDelFiltro`). `docs/PLAN.md` (flujo 3) dice «todo el dashboard se recalcula»; el test de semillas usa el mes entero.

**D7. Umbrales en la página.** Su estado vive en `App`, fuera de `Tablero`, para sobrevivir a otro CSV (`Tablero` se remonta con cada carga). El porcentaje de la dominante se edita en % (35) y se guarda en proporción (0.35). Cada control conserva su texto mientras es inválido, y los hallazgos usan el último valor válido. *Alternativa descartada:* estado dentro de `Tablero`, que se perdería al cargar otro mes.

**D8. Puntos del mapa en `Metricas`.** Dos campos nuevos: los puntos agrupados por zona en el orden de `gastoPorZona` (cada punto con longitud, latitud y monto) y la cuenta de transacciones sin coordenadas, a la par de `transaccionesSinHora`; más la ciudad principal para el encuadre. Así la función de `graficas` sigue saliendo de `Metricas`, como dice la tabla de capas, y se recalcula con el filtro sin cableado nuevo. *Alternativa descartada:* `graficas` recibe `Transaccion[]`; contradice la descripción de la capa en `docs/ARQUITECTURA.md`.

**D9. La gráfica del mapa.** Scatter sobre ejes de valor (x longitud, y latitud), una serie por zona con color de una paleta categórica fija y una forma de punto de las de ECharts, ambas por posición y cíclicas si hay más zonas que formas; leyenda con las zonas; `aria` con la descripción; rango inicial de los ejes en la caja de la ciudad principal con un margen, y zoom y desplazamiento (dataZoom interno en ambos ejes) para llegar al resto. El mecanismo concreto se verifica en el grupo 2 contra ECharts 6.1.0 instalado; lo que se fija es el objetivo del requisito «Encuadre en la ciudad principal». Paleta y formas en `src/graficas/estilo.ts`; el registro de `ScatterChart`, `DataZoomComponent` y lo que haga falta, en `src/cliente/echarts.ts`.

**D10. Orden en la página.** Hallazgos tras los KPIs y antes de «Gasto por categoría» (el orden de `tests/cliente/graficas-del-mes.test.tsx:63` empieza en categoría y no cambia por ellos); mapa tras «Gasto por cuenta» y antes de la tabla (ese test y la cuenta de `:56` se actualizan en el grupo 5).

**D11. Suite de sistema.** Se amplía `tests/sistema/flujo-principal.spec.ts`: lee `zonaFavorita` y `viaje.destino` del esperado y busca el panel y el mapa por sus nombres accesibles de `textos.ts`. La conservación de los umbrales tras recargar va en una spec nueva del grupo 4. Cada test de Playwright abre un contexto nuevo, con el almacenamiento vacío, así que esa spec no contamina a las demás.

**D12. Umbrales en el navegador: lógica pura en el dominio, cáscara en el cliente.** Decisión del usuario del 2026-10-21: `localStorage`. La regla innegociable 1 y el lint (`eslint.config.mjs:35`, `localStorage` prohibido en las capas puras) dejan fuera del dominio todo acceso al almacenamiento.
- **Dominio, en el módulo de hallazgos (grupo 1):** dos funciones puras.
  - `leerUmbral(clave, texto)`: valida lo que el analista escribe. Da el valor (la dominante, de % a proporción) o «inválido». Inválido: vacío, no numérico, ≤ 0, o > 100 en la dominante.
  - `leerUmbralesGuardados(valor: unknown)`: recibe el JSON ya parseado y lo resuelve campo por campo. Lo ausente, de otro tipo o fuera de rango toma el valor de `UMBRALES_POR_DEFECTO`; lo demás se ignora.
- **Cliente (grupo 4):** un módulo de cáscara que recibe un almacén con la forma `getItem`/`setItem` de `Storage`. Lee una clave (`tablero-gastos:umbrales`), hace `JSON.parse` dentro de un `try` y delega en `leerUmbralesGuardados`. Escribe el `JSON.stringify` de los `Umbrales` válidos. Toda excepción del almacén se traga, y la página sigue con el estado en memoria.
- **Inyección:**
  - `App` recibe el almacén como prop opcional; sin ella, los umbrales viven solo en memoria.
  - `main.tsx` le pasa `window.localStorage`, obtenido dentro de un `try` porque su acceso puede lanzar.
  - Así los 16 archivos de `tests/cliente/` que montan `<App />` (67 sitios) no cambian ni comparten estado entre tests. Los tests de persistencia pasan un almacén falso en memoria, también uno que lanza.

*Alternativas descartadas:*
- leer `localStorage` dentro de `App` o del panel: acopla los tests de componente al almacenamiento real de jsdom, que persiste entre tests del mismo archivo;
- guardar en el servidor: el usuario la descartó, y cambiaría la API de `docs/ARQUITECTURA.md`.

## Risks / Trade-offs

- [El único guardián del encuadre es visual] → test de `graficas` que afirma que el rango inicial de los ejes contiene todos los puntos de la ciudad principal y ninguno del destino con la semilla 1, más captura del mapa en el grupo 5.
- [20 000 puntos en SVG, recreados en cada cambio de filtro (`Grafica.tsx`)] → los fixtures tienen 2 000; con un CSV real de ~20 000 puede tardar. Se acepta en esta fase; si se nota, entra con la deuda de `Grafica` de `docs/olas/fase-2.md`.
- [dataZoom o scatter en jsdom] → los tests de componente montan la gráfica real con el renderizador SVG; si un componente de ECharts falla en jsdom, se escala antes de mockearlo (mockear un colaborador interno no vale como prueba).
- [La ciudad por coma es una heurística] → los datos reales sin coma tratan cada zona como ciudad; la zona favorita y el viaje siguen definidos y lo cubre un escenario.
- [El almacenamiento del navegador falla (modo privado, cuota, acceso que lanza)] → la cáscara traga las excepciones y la página sigue en memoria (`design.md` D12); lo cubre un test con un almacén que lanza.
- [Un valor guardado de otra versión o manipulado] → `leerUmbralesGuardados` lo resuelve campo por campo hacia los valores por defecto; tests puros en el grupo 1.
- [Reglas de R-16 que el test de semillas no ve: quincena, fin de semana, atípicos] → cada una tiene sus casos hechos a mano en el grupo 1, nombrando `R-16`.
