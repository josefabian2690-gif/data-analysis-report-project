# Dominio

Fuente de verdad del comportamiento del tablero. Cada regla numerada tiene al menos un test que la nombra (`R-xx`).

## Entidades

| Entidad | Qué es | Campos / notas |
|---|---|---|
| `Transacción` | Un gasto | `id`, `fecha`, `monto` (MXN, > 0), `concepto`, `categoría`, `cuenta`, `zona`, `latitud`?, `longitud`? |
| `Mes` | Las transacciones de un CSV, identificadas por `AAAA-MM` | Un CSV equivale a un mes |
| `Historial` | Los meses guardados en disco | Uno por archivo; nunca se mezclan |
| `Categoría` | Tipo de gasto | Las del generador: Comida, Transporte, Supermercado, Entretenimiento, Compras, Salud, Servicios, Suscripciones, Vivienda, Viajes, más `Sin categoría` |
| `Cuenta` | Medio de pago | Por ejemplo `Tarjeta de Crédito ****8072` |
| `Zona` | Lugar del gasto | Zona local de la ciudad principal (p. ej. `Roma Norte, CDMX`) o destino de viaje |
| `Filtro` | Lo que el usuario quiere ver | Rango de fechas, categorías, cuentas, zonas, rango de monto |
| `Métrica` | Un KPI o una serie agregada | Ver R-11 y R-12 |
| `Hallazgo` | Un patrón detectado automáticamente | Un texto y su evidencia numérica (ver R-16) |
| `Reporte` | El dashboard exportado | HTML autocontenido |

## Reglas

**Carga y validación**

- **R-01** Las columnas obligatorias son `fecha`, `monto` y `concepto`. Las opcionales son `id_transaccion`, `categoria`, `cuenta`, `zona`, `latitud` y `longitud`. Si falta una obligatoria, el archivo se rechaza con un mensaje que la nombra.
- **R-02** Cuando falta una columna opcional se rellena así:
  - `categoria` → `Sin categoría`
  - `cuenta` → `Sin cuenta`
  - `zona` → `Sin zona`
  - coordenadas → vacías (la fila no aparece en el mapa)
  - `id` → `TX` más un consecutivo de seis dígitos, ordenado por fecha
- **R-03** `fecha` acepta `AAAA-MM-DD HH:MM:SS` o `AAAA-MM-DD`. Una fecha sin hora no cuenta en el análisis por hora.
- **R-04** `monto` es un número mayor que 0 con punto decimal. Si es ≤ 0 o no se puede leer, la fila es inválida.
- **R-05** Las filas inválidas no bloquean la carga: se excluyen y se reportan con su número de fila y su motivo. Si son más del 5 % del archivo, la carga pide confirmación.
- **R-06** Si un `id_transaccion` está repetido, la segunda aparición es inválida.
- **R-07** Si las coordenadas están fuera de rango (latitud fuera de [-90, 90] o longitud fuera de [-180, 180]), se dejan vacías y la fila sigue siendo válida.
- **R-08** Un CSV es un mes calendario: el mes de la mayoría de las filas válidas. Las filas de otro mes son inválidas, con motivo «fuera del mes».

**Historial**

- **R-09** Al cargar un mes que ya está en el historial, se pregunta si se reemplaza. Los meses nunca se mezclan.

**Filtros y métricas**

- **R-10** Los filtros de dimensiones distintas se combinan con Y, y los valores de una misma dimensión con O. Todas las métricas, gráficas, la tabla y el mapa se recalculan sobre el conjunto filtrado.
- **R-11** Los KPIs son: gasto total, número de transacciones, ticket promedio, mediana del monto y gasto promedio por día del periodo filtrado.
- **R-12** Los porcentajes son sobre el **monto**, no sobre el conteo, salvo que la gráfica diga lo contrario.
- **R-13** Los días de quincena se definen igual que en el generador:
  - quincena: el día 15 y el último del mes
  - post-quincena: el 16 y el 1
  - pre-quincena: los 3 días previos a cada día de pago
- **R-14** El fin de semana va de viernes a domingo.

**Comparación**

- **R-15** La comparación de meses muestra la diferencia absoluta y porcentual por categoría y en el total. Si una categoría no aparece en un mes, cuenta como 0.

**Hallazgos**

- **R-16** Un hallazgo solo se muestra si supera su umbral. Los umbrales por defecto son configurables:
  - **Categoría dominante:** una categoría concentra ≥ 35 % del gasto.
  - **Zona favorita:** la zona local con mayor participación en el gasto de Comida y Entretenimiento.
  - **Quincena:** el gasto promedio de los días de quincena y post-quincena, dividido entre el del resto de los días, es ≥ 1.5.
  - **Fin de semana:** el gasto promedio de viernes a domingo, dividido entre el de lunes a jueves, es ≥ 1.2.
  - **Viaje:** una zona fuera de la ciudad principal (la de mayor gasto) cuyo gasto se concentra en ≤ 4 días consecutivos.
  - **Atípicos:** transacciones con monto mayor que 3 × el percentil 99 de su categoría.

**Presentación**

- **R-17** Los montos se muestran como `$12,345.67` (MXN) y las fechas como `15/09/2026`.

## Casos borde

- CSV vacío, o solo con el encabezado: se rechaza con un mensaje.
- Un mes sin ninguna fila válida: se rechaza; no se guarda en el historial.
- Un mes sin coordenadas: el mapa muestra «sin coordenadas» en lugar de fallar.
- Filtros que dejan 0 filas: dashboard vacío con un mensaje, sin errores ni divisiones entre cero.
- Meses de 28, 29, 30 y 31 días para R-13 (el último día cambia).
- Una `zona` con comas (`"Roma Norte, CDMX"`): se respeta el entrecomillado del CSV.
- Archivo UTF-8 con BOM y textos con acentos.
- Un viaje que cruza el fin de mes: solo cuentan los días dentro del mes.
- Montos con más de dos decimales: se redondean a centavos al mostrarlos, no al calcular.

## Glosario

- **Quincena:** días de pago, el 15 y el último del mes.
- **Post-quincena:** el día siguiente al pago, el 16 y el 1.
- **Cuesta (pre-quincena):** los 3 días previos a cada pago, cuando el gasto baja.
- **Ticket promedio:** gasto total entre el número de transacciones.
- **Zona local:** una zona de la ciudad donde vive la persona.
- **Destino:** una zona fuera de esa ciudad (el viaje).
- **Ciudad principal:** la ciudad con mayor gasto del mes.
- **Hallazgo:** un patrón que el tablero detecta solo y presenta como texto con evidencia.
- **Fixture de semilla:** un CSV del generador creado con `--semilla N`, acompañado de la respuesta que imprime `-v`.
- **Historial:** los meses guardados en disco por el servidor local.
