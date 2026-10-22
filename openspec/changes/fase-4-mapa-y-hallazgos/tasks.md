# Tasks

Una sola ola (`fase-4`), 5 PRs internas, una por grupo. Grafo:

- 1 → 2 → 5
- 1 → 3 → 4 → 5
- Paralelo declarado: el 2 (`src/dominio/metricas.ts`, `src/graficas/`, `tests/graficas/`, el test nuevo del mapa en `tests/dominio/`) junto al 3 y junto al 4 (`src/cliente/`, `tests/cliente/`, `tests/sistema/umbrales.spec.ts`). Áreas disjuntas.
- El 4 espera al 3: los controles de umbrales viven en el panel.
- El 5 espera al 2 (necesita los campos del mapa en `Metricas` y la función de `graficas`) y al 4 (los tres grupos de cliente tocan `Tablero.tsx`, `textos.ts` y `estilos.css`).
- La ola queda en el tope de 5: si hay que partir un grupo, se escala antes.

Reglas de la fase:
- Nada de exportar, contorno o GeoJSON en el mapa, umbrales guardados en el servidor, ni hallazgos o mapa de un mes del historial (`proposal.md`).
- El acceso a `localStorage` solo en la cáscara de `src/cliente/` y en `main.tsx`; su validación es pura y vive en el dominio (`design.md` D12).
- Ninguna dependencia nueva; ningún recurso del mapa fuera del bundle.
- Las cifras de las pruebas con fixtures son literales, las de `design.md` *Context*.
- Cada test de un hallazgo nombra `R-16` (y `R-13` o `R-14` si la regla entra).
- No se tocan `generador/`, `tests/fixtures/`, `src/servidor/`, `src/reporte/`, `package.json`, `vite.config.mts`, `eslint.config.mjs` ni `playwright.config.ts`.

## 1. Dominio: hallazgos de R-16, umbrales, ciudad principal y test de semillas

Área: `src/dominio/`, `tests/dominio/`. Spec `hallazgos-automaticos` (requisitos del dominio, «Test de semillas», y la parte pura de «Umbral inválido» y «Umbrales guardados inválidos»); `design.md` D1 a D6 y D12.

- [x] 1.1 Tests primero de la ciudad de una zona y de la ciudad principal: `"Roma Norte, CDMX"` → `CDMX`; zona sin coma es su propia ciudad; `Sin zona` no es ciudad; mayor monto gana y el empate se resuelve por nombre; con la semilla 1 es `CDMX`; luego el módulo de zonas en `src/dominio/`; verificar con una mutación que tome el texto antes de la coma
- [x] 1.2 Tests primero de `hallazgos` por su interfaz, con transacciones hechas a mano, nombrando `R-16`: categoría dominante en 35 % sí y 34.9 % no; zona favorita local con el destino fuera de la competencia y sin Comida ni Entretenimiento no hay; quincena y fin de semana con días sin gasto contados en el promedio, sin división entre cero con un periodo sin días de quincena (2 al 10 de julio) o sin gasto en un grupo; viaje de 4 días sí, 5 no y 5 sí con umbral 5, gasto disperso no, dos destinos dan dos viajes ordenados por monto; atípico por encima del límite sí, igual al límite no, categoría con menos de 100 transacciones no; lista vacía sin hallazgos ni `NaN`; `umbrales` parciales mezclados con los de por defecto; luego `Hallazgo`, `Umbrales`, `UMBRALES_POR_DEFECTO` y `hallazgos(tx, umbrales?, periodo?)`; verificar con una mutación por regla (`>` en lugar de `≥` en la dominante, promedios solo sobre días con gasto, viaje medido en días con gasto en lugar del tramo, atípico con `≥`)
- [x] 1.3 Test de semillas: por cada fixture de `tests/fixtures/generador/`, `hallazgos()` con los umbrales por defecto coincide con su `*.esperado.json` en `categoriaDominante`, `zonaFavorita` y `viaje` (`destino`, `desde`, `hasta`); además, con la semilla 1, las cifras literales de `design.md` (48.2 %, 72.8 %, 2.83, 1.67, `$276,744.96`, 2 atípicos con `TX001575` primero); verificar que el test falla si la zona favorita deja de excluir las zonas fuera de la ciudad principal (el 72.8 % cambia; el nombre no, porque en ninguna semilla gana el destino) y si la dominante se mide sobre el conteo en lugar del monto y que `npm run lint` no marca I/O en `src/dominio/`

- [x] 1.4 Tests primero de la validación pura de umbrales (`design.md` D12): `leerUmbral` acepta `35` en la dominante como 0.35 y `1.5` en quincena, y da inválido con vacío, texto, 0, negativo y `100.1` en la dominante; `leerUmbralesGuardados` con `null`, un número, un objeto vacío, un campo de otro tipo, `finDeSemana: -1` junto a `quincena: 2` (da 1.2 y 2), y un objeto completo válido devuelto tal cual; luego las dos funciones en el módulo de hallazgos; verificar con mutaciones: aceptar 0, no convertir el porcentaje, descartar todo el objeto por un solo campo inválido

## 2. Dominio y gráficas: puntos del mapa y su gráfica

Depende del grupo 1. Área: `src/dominio/metricas.ts`, `tests/dominio/` (archivo nuevo del mapa), `src/graficas/`, `tests/graficas/`. Spec `mapa-de-gasto` («Puntos por zona», «Color y forma por zona», «Encuadre en la ciudad principal»); `design.md` D8 y D9.

- [ ] 2.1 Tests primero de los campos nuevos de `metricas`: puntos agrupados por zona en el orden de `gastoPorZona`, con longitud, latitud y monto; transacción sin coordenadas fuera y contada; la ciudad principal; con la semilla 1, 2 000 puntos en 7 grupos (755 en Centro Histórico, 247 en Monterrey); conjunto vacío sin puntos; luego los campos en `src/dominio/metricas.ts` y en `METRICAS_VACIAS` (`tests/graficas/metricas-de-prueba.ts`); verificar que los tests existentes de `tests/dominio/metricas-*.test.ts` y de `tests/graficas/` siguen en verde sin otros cambios y una mutación que cuente en el mapa las transacciones sin coordenadas
- [ ] 2.2 Tests primero de la función del mapa en `src/graficas/` a partir de `Metricas`: una serie scatter por zona con su nombre, x longitud e y latitud; combinaciones de color y forma distintas para 7 zonas y cíclicas con más; leyenda con todas las zonas; `aria` activado; rango inicial de los ejes que contiene todos los puntos de la ciudad principal y ningún punto del destino con la semilla 1; zoom y desplazamiento declarados en ambos ejes; luego la función, la paleta y las formas en `src/graficas/estilo.ts`; verificar con mutaciones: misma forma para todas las zonas, encuadre sobre todos los puntos

## 3. Cliente: panel de hallazgos

Depende del grupo 1. Área: `src/cliente/`, `tests/cliente/`. Spec `hallazgos-automaticos` («Panel de hallazgos en la página») y `filtros-del-tablero` («Todo el dashboard se recalcula», la parte de hallazgos); `design.md` D6 y D10. Textos visibles solo en `src/cliente/textos.ts`.

- [ ] 3.1 Tests de componente primero del panel con la semilla 1: sección con nombre accesible tras los KPIs y antes de «Gasto por categoría»; un elemento por hallazgo con su texto y evidencia en R-17 (Compras con 48.2 %, `Centro Histórico, CDMX`, viaje del 24/07/2026 al 26/07/2026, 2 atípicos con el mayor en `$10,795.88`); al filtrar solo Compras, dominante al 100 % y sin zona favorita; mensaje cuando ningún hallazgo supera su umbral (con unos `Umbrales` pasados al componente); luego el panel y sus textos; verificar con una mutación que calcule los hallazgos sobre el mes sin filtrar y dejar captura del panel

## 4. Cliente: umbrales desde la pantalla, conservados en el navegador

Depende del grupo 3. Área: `src/cliente/`, `tests/cliente/`, `tests/sistema/umbrales.spec.ts`. Spec `hallazgos-automaticos` («Umbrales ajustables desde la pantalla», «Umbral inválido», «Los umbrales se conservan en el navegador», «Umbrales guardados inválidos», «Navegador sin almacenamiento»); `design.md` D7 y D12. Textos visibles solo en `src/cliente/textos.ts`.

- [ ] 4.1 Tests de componente primero de los controles, sin almacén: un control con nombre accesible por umbral con su valor por defecto (35, 1.5, 1.2, 4, 3); la dominante en 50 quita ese hallazgo y deja los demás; «Restablecer» devuelve todos los valores y el hallazgo; vacío, texto, 0, negativo o más de 100 en la dominante marcan el control inválido con mensaje y no cambian los hallazgos (validación con `leerUmbral`); con la dominante en 50, cargar `2026-08-semilla-2.csv` conserva el 50 y muestra Entretenimiento con 54.8 %; luego los controles y el estado en `App` (`design.md` D7); verificar con mutaciones: estado dentro de `Tablero` (se pierde con otro CSV), aplicar el valor inválido
- [ ] 4.2 Tests primero de la cáscara del almacén con un almacén falso en memoria: lee la clave y resuelve con `leerUmbralesGuardados` (ilegible da los de por defecto); escribe los válidos al cambiar y al restablecer, nunca un inválido; un almacén que lanza al leer o al escribir no rompe nada; después, tests de componente de `App` con el almacén falso: un `App` nuevo con lo guardado arranca con esos valores; sin almacén todo sigue en memoria y los tests existentes de `tests/cliente/` no cambian; luego la cáscara, la prop opcional de `App` y `main.tsx` con `window.localStorage` dentro de un `try`; verificar con mutaciones: guardar el valor inválido, no tragar la excepción del almacén, leer sin `leerUmbralesGuardados`
- [ ] 4.3 Spec de sistema nueva `tests/sistema/umbrales.spec.ts`, que importa `test` de `./sin-red`: carga la semilla 1, pone la dominante en 50, recarga la página, vuelve a cargar la semilla 1 y comprueba el control en 50 y sin hallazgo de categoría dominante; ninguna petición lleva los umbrales en la URL ni en el cuerpo; verificar (PM, `.claude/da/da sistema`) que pasa con las otras specs y que falla con la mutación «`main.tsx` no pasa el almacén» (no se commitea), y dejar captura de los controles tras recargar

## 5. Cliente: sección del mapa y flujo de sistema

Depende de los grupos 2 y 4. Área: `src/cliente/`, `tests/cliente/`, `tests/sistema/flujo-principal.spec.ts`. Specs `mapa-de-gasto` («Mapa en la página», «Mes sin coordenadas», «Sin red ni contorno»), `filtros-del-tablero` (los dos requisitos modificados) y `tablero-del-mes` («Flujo principal en la suite de sistema»); `design.md` D9 a D11. Textos visibles solo en `src/cliente/textos.ts`.

- [ ] 5.1 Tests de componente primero: con la semilla 1, la sección del mapa con título, nombre accesible y descripción que nombra `Centro Histórico, CDMX` con 755 puntos, entre «Gasto por cuenta» y la tabla; con `tests/fixtures/a-mano/minimo.csv`, el mensaje de sin coordenadas y el resto del tablero visible; al filtrar solo Compras, 404 puntos; con un filtro que deja 0 filas, ni mapa ni hallazgos; actualizar la cuenta de `tests/cliente/graficas-del-mes.test.tsx:56` y el orden de `:63` para incluir el mapa; luego la sección, los componentes de ECharts que haga falta en `src/cliente/echarts.ts` y la descripción accesible en `src/cliente/opciones-de-graficas.ts`; verificar con una mutación que dibuje el mapa sobre el mes sin filtrar y dejar captura del mapa con la semilla 1, encuadrado en CDMX, y otra alejado hasta Monterrey
- [ ] 5.2 `tests/sistema/flujo-principal.spec.ts`: además de lo que ya comprueba, el panel de hallazgos muestra `categoriaDominante`, `zonaFavorita` y `viaje.destino` leídos del esperado, y la sección del mapa está visible sin el mensaje de sin coordenadas; verificar (PM, `.claude/da/da sistema`) que pasan las cinco specs y que la spec falla con la mutación «el umbral por defecto de la dominante es 50 %» (Compras, con 48.2 %, desaparece del panel) (no se commitea)

## Workflow follow-up

- Archivar tras el merge de la ola a `master`: los deltas MODIFIED de `filtros-del-tablero` y `tablero-del-mes` necesitan sus specs principales, que ya existen.
