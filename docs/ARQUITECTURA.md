# Arquitectura

Un solo proyecto TypeScript. El dominio es puro y lo comparten el cliente (navegador) y el servidor (Node). Cada capa es un área de implementación con rutas disjuntas.

## Capas

| Capa | Responsabilidad | Ruta | Puede importar de |
|---|---|---|---|
| `dominio` | Código puro, sin I/O: esquema de `Transaccion`, parseo del CSV desde un string, validación, filtros, métricas, hallazgos y comparación de meses | `src/dominio/` | `papaparse` |
| `graficas` | Construye las opciones de ECharts a partir de `Metricas` o `Comparacion`. Puro | `src/graficas/` | `dominio` |
| `reporte` | Genera el HTML autocontenido del reporte como string (ECharts y datos en línea). Puro; la descarga la hace el navegador | `src/reporte/` | `dominio`, `graficas` |
| `cliente` | UI en React: carga, filtros, pestañas, tabla, mapa, hallazgos, comparación y botón de exportar. Llama a la API del historial | `src/cliente/` | `dominio`, `graficas`, `reporte`, React, ECharts, TanStack Table |
| `servidor` | Node: sirve el bundle, expone la API del historial y guarda los meses en archivos. Escucha solo en 127.0.0.1 y abre el navegador | `src/servidor/` | `dominio`, `node:*`, `open` |
| `generador` | El generador de Python existente, movido sin cambios de lógica, más `fixtures.sh` | `generador/` | Faker (nada de `src/`) |

La capa principal es `dominio`: el resto depende de ella y ella no depende de nada del proyecto.

## Contratos

Del dominio (`src/dominio/`):

```ts
parsearCsv(texto: string): ResultadoCarga
// ResultadoCarga = { mes: string /* AAAA-MM */, transacciones: Transaccion[], invalidas: FilaInvalida[] }
// FilaInvalida   = { fila: number, motivo: string }

filtrar(tx: Transaccion[], filtro: Filtro): Transaccion[]
metricas(tx: Transaccion[]): Metricas            // KPIs + series por categoría, día, hora, día de semana, zona, cuenta
hallazgos(tx: Transaccion[], umbrales?: Umbrales): Hallazgo[]
comparar(meses: { [mes: string]: Transaccion[] }): Comparacion
```

`Transaccion`, `Filtro`, `Metricas`, `Hallazgo`, `Comparacion` y `Umbrales` se definen en `src/dominio/`. El esquema de `Transaccion` está solo en `src/dominio/esquema.ts`.

De las gráficas y el reporte:

```ts
graficas.porCategoria(m: Metricas): EChartsOption   // y una función por gráfica
reporte.generarHtml(m: Metricas, h: Hallazgo[], figuras: EChartsOption[]): string
```

**API del historial.** Es JSON y se valida con el esquema del dominio en los dos extremos:

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/meses` | — | `[{ mes, filas, total }]` |
| `GET /api/meses/:mes` | — | `Transaccion[]`, o 404 |
| `PUT /api/meses/:mes` | `Transaccion[]` | 201 si es nuevo; 409 si ya existe y falta `?reemplazar=1`; 200 al reemplazar |
| `DELETE /api/meses/:mes` | — | 204, o 404 |

**Almacenamiento.**
- Cada mes es un archivo `historial/AAAA-MM.json`.
- La escritura es atómica: archivo temporal y luego `rename`.
- La carpeta se puede cambiar con la variable `TABLERO_HISTORIAL`, que los tests usan para apuntar a un directorio temporal.
- `historial/` va en `.gitignore`.

## Pruebas

| Capa | Qué se prueba | Cómo | Dónde |
|---|---|---|---|
| `dominio` | Cada regla R-xx de `DOMINIO.md`, con el nombre `R-xx` en el test. Test de semillas: `hallazgos()` sobre cada fixture coincide con su `esperado.json` en categoría dominante, zona favorita y destino de viaje | Vitest, funciones puras | `tests/dominio/` |
| `graficas` | Las opciones tienen las series y los ejes esperados para unas métricas conocidas | Vitest | `tests/graficas/` |
| `reporte` | El HTML contiene los KPIs y las gráficas, y **ninguna** referencia `http(s)://` a recursos externos | Vitest | `tests/reporte/` |
| `servidor` | API contra un historial temporal: crear, 409, reemplazar, listar, borrar, escritura atómica, que escuche solo en 127.0.0.1 | Vitest + `node:http` | `tests/servidor/` |
| `cliente` | Componentes: filtros, estado vacío, filas inválidas, confirmación al reemplazar | Vitest + Testing Library + jsdom | `tests/cliente/` |
| Sistema | Flujo de punta a punta: `npm start`, cargar el fixture, comprobar KPIs y hallazgos, guardar, reiniciar y verificar que persiste. Falla si alguna petición sale de 127.0.0.1 | Playwright | `tests/sistema/` |

Hay dos tipos de **fixtures** en `tests/fixtures/`:
- **Del generador:** CSVs generados con semillas fijas, cada uno con su `*.esperado.json` (la respuesta de `-v`). Se regeneran con `generador/fixtures.sh`, el único paso que requiere Python.
- **Hechos a mano y pequeños:** con BOM, sin columnas opcionales, con filas inválidas, con filas de otro mes y con comas entre comillas.
