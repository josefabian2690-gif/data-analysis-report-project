# Generador de transacciones financieras falsas

Script en Python que usa [Faker](https://faker.readthedocs.io/) para generar un CSV con
los gastos de **una persona durante un mes** (20,000 transacciones por defecto). Cada
ejecución produce datos nuevos, pero siempre con patrones de gasto detectables, para
alimentar un reporte en otro proyecto.

## Uso

Todos los comandos se lanzan desde la raíz del repositorio.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r generador/requirements.txt
python generador/generar_transacciones.py
```

Genera `output/transacciones_AAAA-MM.csv` sin imprimir nada, para no revelar los patrones.
Con `-v` imprime el resumen con los patrones inyectados (la "respuesta").

| Opción | Default | Descripción |
|---|---|---|
| `-n`, `--registros` | `20000` | Número de transacciones |
| `--mes` | mes anterior | Mes a simular (`AAAA-MM`) |
| `--semilla` | aleatoria | Reproduce exactamente un set anterior |
| `--categoria-dominante` | aleatoria | `Comida`, `Transporte`, `Entretenimiento` o `Compras` |
| `-o`, `--salida` | `output/transacciones_AAAA-MM.csv` | Ruta del CSV |
| `-v`, `--verbose` | apagado | Imprime el resumen con los patrones inyectados |

Ejemplo: `python generador/generar_transacciones.py --mes 2026-09 --categoria-dominante Comida --semilla 42`

Para revisar la respuesta después: genera con `--semilla N` y luego corre el mismo comando
con `-v` agregado; la misma semilla produce exactamente el mismo CSV.

## Fixtures del tablero

`generador/fixtures.sh` regenera los tres CSV con semilla de `tests/fixtures/generador/` (meses
`2026-07`, `2026-08` y `2026-09`, 2 000 filas cada uno) junto con su `*.esperado.json`, la respuesta
que el generador imprime con `-v`. Es el único paso del repositorio que ejecuta el generador y el
único que necesita Python; el resto del proyecto solo lee los archivos que deja.

```bash
generador/fixtures.sh
PYTHON="/ruta/a/python" generador/fixtures.sh
```

Sin `PYTHON`, usa `.venv/bin/python` de la raíz. El intérprete debe tener Faker (versión fijada en
`generador/requirements.txt`): si no lo tiene, el script termina con error y no toca los fixtures.
Con la misma versión de Faker, correrlo otra vez no cambia ningún archivo.

## Columnas del CSV

| Columna | Ejemplo | Notas |
|---|---|---|
| `id_transaccion` | `TX000123` | Consecutivo, ordenado por fecha |
| `fecha` | `2026-09-15 14:32:07` | `AAAA-MM-DD HH:MM:SS` |
| `monto` | `342.50` | MXN, siempre positivo (son gastos) |
| `concepto` | `Taquería Cervantes` | Comercio o cargo |
| `categoria` | `Comida` | Comida, Transporte, Supermercado, Entretenimiento, Compras, Salud, Servicios, Suscripciones, Vivienda, Viajes |
| `cuenta` | `Tarjeta de Crédito ****8072` | Máximo 3 cuentas |
| `zona` | `Roma Norte, CDMX` | 6 zonas de CDMX + 1 destino de viaje |
| `latitud`, `longitud` | `19.419400`, `-99.161700` | Dentro de México |

## Patrones que el reporte debería encontrar

Se eligen al azar en cada ejecución y solo se imprimen con `-v`:

1. **Categoría dominante**: una categoría concentra entre ~40 % y ~65 % del gasto.
2. **Zona favorita**: una zona de CDMX concentra la mayor parte del gasto en comida y entretenimiento.
3. **Quincena**: picos de gasto los días 15 y último del mes (y el día siguiente); bajón los 3 días previos.
4. **Fin de semana**: más gasto viernes a domingo, sobre todo entretenimiento nocturno.
5. **Viaje**: un fin de semana en otra ciudad (Guadalajara, Cancún, Oaxaca, etc.) con gasto elevado.

Además: horarios realistas por categoría (comida al mediodía, transporte en hora pico), comercios
favoritos que se repiten, cargos fijos (renta, luz, suscripciones) y ~0.3 % de compras atípicas.

## Personalizar

Zonas, comercios, rangos de montos, horarios y la intensidad de cada patrón están en
[`configuracion.py`](configuracion.py). La lógica está en [`generar_transacciones.py`](generar_transacciones.py).
