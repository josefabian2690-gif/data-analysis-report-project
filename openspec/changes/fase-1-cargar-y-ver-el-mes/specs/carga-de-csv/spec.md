# Spec Delta

## Purpose

Convierte el texto de un CSV con el formato del generador en las transacciones válidas de un mes, con cada fila descartada reportada por su número y su motivo, y rechaza el archivo cuando no se puede usar (reglas R-01 a R-08 de `docs/DOMINIO.md`).

## ADDED Requirements

### Requirement: Columnas obligatorias (R-01)
La carga SHALL exigir las columnas `fecha`, `monto` y `concepto`. Si falta alguna, el archivo SHALL rechazarse con un motivo que nombra cada columna que falta. Las columnas desconocidas SHALL ignorarse.

#### Scenario: Falta una columna obligatoria
- **WHEN** se carga un CSV cuyo encabezado no tiene `monto`
- **THEN** la carga se rechaza y el motivo nombra `monto`

#### Scenario: Faltan dos columnas obligatorias
- **WHEN** se carga un CSV cuyo encabezado no tiene `fecha` ni `concepto`
- **THEN** la carga se rechaza y el motivo nombra `fecha` y `concepto`

#### Scenario: Una columna desconocida
- **WHEN** se carga un CSV válido con una columna adicional `notas`
- **THEN** la carga no se rechaza y las transacciones no cambian por esa columna

### Requirement: Valores por defecto de las columnas opcionales (R-02)
Cuando falta una columna opcional, o su celda está vacía en una fila, la transacción SHALL tomar el valor por defecto de R-02: `Sin categoría`, `Sin cuenta`, `Sin zona`, coordenadas vacías, y un id `TX` más seis dígitos consecutivos en orden de fecha que no choca con ningún id del archivo.

#### Scenario: CSV sin columnas opcionales
- **WHEN** se carga un CSV con solo `fecha`, `monto` y `concepto`
- **THEN** cada transacción tiene categoría `Sin categoría`, cuenta `Sin cuenta`, zona `Sin zona` y no tiene coordenadas

#### Scenario: Ids generados en orden de fecha
- **WHEN** se carga un CSV sin `id_transaccion` cuyas filas no están ordenadas por fecha
- **THEN** la transacción más antigua tiene el id `TX000001`, la siguiente `TX000002`, y así sucesivamente

#### Scenario: Celda opcional vacía
- **WHEN** una fila tiene la columna `categoria` vacía
- **THEN** esa transacción tiene categoría `Sin categoría` y la fila es válida

### Requirement: Formatos de fecha (R-03)
`fecha` SHALL aceptar `AAAA-MM-DD HH:MM:SS` y `AAAA-MM-DD`, y la fila con otra forma o con una fecha imposible SHALL ser inválida. Una fecha sin hora SHALL quedar sin hora, para que no cuente en el análisis por hora.

#### Scenario: Fecha con hora
- **WHEN** una fila tiene `2026-07-14 18:05:00`
- **THEN** la transacción tiene el día `2026-07-14` y la hora `18:05:00`

#### Scenario: Fecha sin hora
- **WHEN** una fila tiene `2026-07-14`
- **THEN** la transacción tiene el día `2026-07-14` y no tiene hora

#### Scenario: Fecha ilegible
- **WHEN** una fila tiene `14/07/2026` o `2026-02-30`
- **THEN** la fila es inválida y su motivo es la fecha

### Requirement: Montos (R-04)
`monto` SHALL ser un número mayor que 0 escrito con punto decimal; si es ≤ 0 o no se puede leer, la fila SHALL ser inválida. El monto SHALL conservarse con todos sus decimales.

#### Scenario: Monto cero o negativo
- **WHEN** una fila tiene monto `0` u otra `-15.50`
- **THEN** las dos filas son inválidas y su motivo es el monto

#### Scenario: Monto ilegible
- **WHEN** una fila tiene monto `abc` o `1,234.50`
- **THEN** la fila es inválida y su motivo es el monto

#### Scenario: Monto con más de dos decimales
- **WHEN** una fila tiene monto `10.125`
- **THEN** la transacción es válida y su monto es 10.125, sin redondear

### Requirement: Las filas inválidas se excluyen y se reportan (R-05)
Las filas inválidas SHALL excluirse de las transacciones sin bloquear la carga, y SHALL reportarse con su número de fila (el encabezado es la fila 1) y un motivo de un catálogo cerrado. Un valor vacío en una columna obligatoria SHALL hacer la fila inválida con un motivo que nombra esa columna.

#### Scenario: Una fila inválida entre válidas
- **WHEN** se carga un CSV de 10 filas de datos cuya tercera fila de datos tiene monto `0`
- **THEN** hay 9 transacciones y una fila inválida con número 4 y motivo de monto

#### Scenario: Concepto vacío
- **WHEN** una fila tiene el `concepto` vacío
- **THEN** la fila es inválida y su motivo nombra `concepto`

### Requirement: Confirmación con más del 5 % de inválidas (R-05)
Cuando las filas inválidas son más del 5 % de las filas de datos del archivo, la carga SHALL pedir confirmación antes de usarse. Con el 5 % exacto o menos, no SHALL pedirla.

#### Scenario: Seis por ciento de inválidas
- **WHEN** se carga un CSV de 100 filas de datos con 6 inválidas
- **THEN** la carga pide confirmación

#### Scenario: Cinco por ciento exacto
- **WHEN** se carga un CSV de 100 filas de datos con 5 inválidas
- **THEN** la carga no pide confirmación

### Requirement: Id repetido (R-06)
Si un `id_transaccion` aparece en más de una fila, SHALL quedarse la primera aparición válida, y cada aparición posterior SHALL ser inválida con motivo de id repetido.

#### Scenario: Id duplicado
- **WHEN** las filas de datos 2 y 7 tienen el id `TX000010` y las dos son válidas por lo demás
- **THEN** la fila 2 es una transacción y la fila 7 es inválida por id repetido

#### Scenario: La primera aparición era inválida
- **WHEN** la primera fila con el id `TX000010` tiene monto `0` y la segunda es correcta
- **THEN** la primera es inválida por el monto y la segunda es una transacción

### Requirement: Coordenadas fuera de rango (R-07)
Si la latitud está fuera de [-90, 90], la longitud fuera de [-180, 180], alguna no se puede leer o solo viene una de las dos, la transacción SHALL quedarse sin coordenadas y la fila SHALL seguir siendo válida.

#### Scenario: Latitud fuera de rango
- **WHEN** una fila tiene latitud `91` y longitud `-99.1`
- **THEN** la transacción es válida y no tiene coordenadas

#### Scenario: Coordenadas en rango
- **WHEN** una fila tiene latitud `19.43` y longitud `-99.13`
- **THEN** la transacción tiene esas coordenadas

### Requirement: Un CSV es un mes calendario (R-08)
El mes de la carga (`AAAA-MM`) SHALL ser el de la mayoría de las filas válidas; con empate, el más antiguo. Las filas válidas de otro mes SHALL ser inválidas con motivo «fuera del mes».

#### Scenario: Filas de otro mes
- **WHEN** un CSV tiene 20 filas de julio de 2026 y 2 de agosto de 2026
- **THEN** el mes es `2026-07` y las 2 filas de agosto son inválidas con motivo «fuera del mes»

#### Scenario: Empate de meses
- **WHEN** un CSV tiene 5 filas de julio y 5 de agosto de 2026
- **THEN** el mes es `2026-07`

### Requirement: Archivos que no se pueden usar
Un CSV vacío, uno con solo el encabezado y uno sin ninguna fila válida SHALL rechazarse con un motivo propio de cada caso.

#### Scenario: CSV vacío
- **WHEN** se carga un texto vacío
- **THEN** la carga se rechaza con el motivo de archivo vacío

#### Scenario: Solo encabezado
- **WHEN** se carga un CSV con el encabezado y ninguna fila de datos
- **THEN** la carga se rechaza con el motivo de archivo sin filas

#### Scenario: Ninguna fila válida
- **WHEN** todas las filas de datos tienen monto `0`
- **THEN** la carga se rechaza con el motivo de mes sin filas válidas

### Requirement: Texto del CSV tal como lo escribe una hoja de cálculo
La carga SHALL aceptar UTF-8 con o sin BOM, fines de línea `\r\n` o `\n`, acentos, y valores entrecomillados que contienen comas.

#### Scenario: BOM y acentos
- **WHEN** se carga un CSV que empieza con BOM y tiene el concepto `Panadería Ñuñoa`
- **THEN** el encabezado se reconoce y el concepto se conserva igual

#### Scenario: Zona con coma
- **WHEN** una fila tiene la zona `"Roma Norte, CDMX"`
- **THEN** la zona de la transacción es `Roma Norte, CDMX`

#### Scenario: Fixture del generador
- **WHEN** se carga `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** hay 2 000 transacciones del mes `2026-07` y ninguna fila inválida
