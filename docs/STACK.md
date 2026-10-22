# Stack

## Restricciones

1. **Sin red en ejecución.** Ninguna petición sale de la máquina: ni CDN, ni fuentes web, ni teselas de mapas, ni telemetría.
2. **Se abre en el navegador.** La interfaz es una página web, aunque corra en local.
3. **Arranca con un solo comando.**
4. **La página web se construye con Node.** El generador de datos sigue en Python, como herramienta aparte.
5. **Privacidad.** Los datos de gasto nunca se suben a ningún servicio.
6. **Historial de meses en disco**, no en el navegador.
7. **Un solo usuario**, en laptop, uso mensual. Volumen: ~20 000 filas por mes.
8. **Costo $0.** Solo software libre y sin servicios de pago.
9. **Preferencia:** interfaz en español de México (MXN, dd/mm/aaaa).

Entorno detectado: Node 22.22.1 (LTS) y npm 9.2.0.

## Opciones evaluadas

Opciones de interfaz. Todas se empaquetan localmente con Vite, sin CDN.

| Opción | Pros | Contras / riesgos | Madurez | Veredicto |
|---|---|---|---|---|
| **A. React 18 + Vite + TypeScript + ECharts + TanStack Table** | Ecosistema más maduro. ECharts maneja volúmenes grandes, tiene leyendas interactivas y dibuja un scatter de lon/lat sin teselas. Testing Library es muy maduro. | Bundle más grande (irrelevante en local). Hay que ordenar bien el estado de los filtros. | Alta | **Recomendada** |
| B. Svelte 5 + Vite + ECharts | Menos código y muy rápido. | Ecosistema más chico (tablas, testing). Las runes de Svelte 5 son recientes. | Media | Viable; descartada en favor de la madurez |
| C. TypeScript sin framework + ECharts | Sin dependencias de framework. | Filtros, tabla y pestañas hechos a mano: mucho código de pegamento. | n/a | Descartada por costo |
| D. Next.js / Remix | Full stack integrado. | Sobredimensionado para un usuario local. Next trae telemetría activada por defecto, lo que choca con la restricción 1. | Alta | Descartada por las restricciones 1 y 7 |

Opciones de servidor y almacenamiento:

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| **`node:http` + JSON por mes** | Sin framework, solo 4 rutas, archivos fáciles de inspeccionar y respaldar. | Escritura atómica a mano (temporal + rename). | **Recomendada** |
| Fastify + JSON | Rutas y validación más cómodas. | Dependencia de más para 4 rutas. | Viable si la API crece |
| `node:sqlite` | SQL, un solo archivo. | Experimental en Node 22. | Descartada por ahora |
| IndexedDB en el navegador | No hace falta API. | Atado al navegador y al puerto; choca con la restricción 6. | Descartada |

## Decisión

- **Lenguaje y versión:** TypeScript 5 en modo `strict`, sobre Node ≥ 22 LTS (`engines` en `package.json`).
- **Gestor de dependencias:** npm con `package-lock.json`. Las versiones exactas se fijan en la fase 0.
- **UI:** React 18 + Vite. Gráficas con ECharts; tabla con TanStack Table. Solo fuentes del sistema.
- **Datos:**
  - Lectura del CSV con Papa Parse, en el dominio y a partir de un string.
  - Historial en `historial/AAAA-MM.json`, servido por `node:http` en 127.0.0.1.
  - El navegador se abre con el paquete `open`.
- **Mapa:** ECharts con un scatter de longitud/latitud sobre ejes cartesianos, sin contorno ni GeoJSON (decidido el 2026-10-21, ver Pendientes de PLAN). Nunca teselas en línea.
- **Tests:** Vitest (con Testing Library y jsdom para `cliente`). La suite de sistema usa Playwright.
- **Tipos:** `tsc --noEmit`.
- **Lint:** ESLint + typescript-eslint + `import/no-restricted-paths`, que hace cumplir la tabla de capas.
- **Formato:** Prettier.
- **Empaquetado y arranque:** `npm start` construye el bundle con Vite si falta o está viejo, levanta el servidor en 127.0.0.1 y abre el navegador. En desarrollo se usa `npm run dev`.
- **Generador:** Python 3 + Faker, en `generador/`. Solo lo usa `generador/fixtures.sh` para regenerar los fixtures.

Comandos del gate:

| Paso | Comando |
|---|---|
| Formato | `npx prettier --check .` |
| Lint | `npx eslint .` |
| Tipos | `npx tsc --noEmit` |
| Tests | `npx vitest run` |
| Suite de sistema | `npx playwright test` |

La **suite de sistema** levanta `npm start` contra un historial temporal y carga el fixture de semilla. Comprueba los KPIs y los hallazgos, guarda el mes, reinicia y verifica que persiste. Además **falla si alguna petición sale de 127.0.0.1**, con lo que vigila la restricción 1.

## Reglas innegociables de arquitectura

1. `dominio`, `graficas` y `reporte` no hacen I/O: nada de fs, fetch, reloj, DOM ni variables de entorno.
2. **Cero URLs externas en ejecución:** ni CDN, ni Google Fonts, ni teselas, ni telemetría o analítica. Todo asset va en el bundle, y el servidor escucha solo en 127.0.0.1.
3. Los imports respetan la tabla de capas de `ARQUITECTURA.md`, y ESLint lo hace cumplir. `cliente` y `servidor` no se importan entre sí; solo comparten `dominio`.
4. El esquema de `Transaccion` vive únicamente en `src/dominio/esquema.ts`.
5. Cada regla R-xx de `DOMINIO.md` tiene al menos un test que la nombra.
6. Los datos reales y el historial nunca se commitean (`historial/` y `output/` van en `.gitignore`). Los fixtures sintéticos sí se commitean.
7. El generador de Python es independiente: la app Node nunca lo ejecuta, y solo `generador/fixtures.sh` lo usa.

## Descartado y por qué

- **Python para la página web** (Dash, Streamlit): el usuario quiere la página en Node.
- **Svelte 5:** ecosistema menos maduro para tablas y testing.
- **TypeScript sin framework:** demasiado código de pegamento para filtros, tabla y pestañas.
- **Next.js / Remix:** sobredimensionados para un usuario local, y Next trae telemetría por defecto.
- **Historial en IndexedDB:** queda atado al navegador y al puerto; el usuario eligió disco.
- **`node:sqlite`:** sigue experimental en Node 22.
- **Mapas con teselas** (Leaflet/OSM, Mapbox, MapLibre con estilos remotos): violan la restricción 1.
- **PDF con Chrome headless o Puppeteer:** pesado y descarga un navegador. El PDF se obtiene imprimiendo el HTML exportado desde el navegador.
