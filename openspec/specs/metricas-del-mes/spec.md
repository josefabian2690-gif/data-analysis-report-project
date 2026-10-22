# metricas-del-mes Specification

## Purpose

Calcula, a partir de las transacciones de un mes, los KPIs de R-11 y el gasto por categoría con porcentajes sobre el monto (R-12), para que el tablero los muestre sin recalcular nada por su cuenta.

## Requirements

### Requirement: KPIs del mes (R-11)
Las métricas SHALL incluir el gasto total, el número de transacciones, el ticket promedio (total entre número), la mediana del monto y el gasto promedio por día, calculados sin redondear.

#### Scenario: Tres transacciones
- **WHEN** se calculan las métricas de tres transacciones de julio de 2026 con montos 100, 200 y 600
- **THEN** el gasto total es 900, hay 3 transacciones, el ticket promedio es 300 y la mediana es 200

#### Scenario: Mediana con número par
- **WHEN** los montos son 100, 200, 300 y 1000
- **THEN** la mediana es 250

### Requirement: Gasto promedio por día del mes
Mientras no haya filtros, el periodo del gasto promedio por día SHALL ser el mes calendario de las transacciones: el gasto total entre los días naturales de ese mes, aunque haya días sin gasto.

#### Scenario: Julio
- **WHEN** las transacciones de julio de 2026 suman 3 100
- **THEN** el gasto promedio por día es 100 (31 días)

#### Scenario: Febrero bisiesto
- **WHEN** las transacciones de febrero de 2028 suman 2 900
- **THEN** el gasto promedio por día es 100 (29 días)

### Requirement: Gasto por categoría sobre el monto (R-12)
Las métricas SHALL incluir, por categoría, el monto, el número de transacciones y el porcentaje del gasto total calculado sobre el monto (no sobre el conteo), ordenadas de mayor a menor monto y, con empate, por nombre.

#### Scenario: Porcentaje sobre el monto
- **WHEN** hay 9 transacciones de Comida que suman 100 y 1 de Viajes por 900
- **THEN** Viajes va primero con el 90 % y Comida después con el 10 %

#### Scenario: Categoría dominante del fixture
- **WHEN** se calculan las métricas de `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la primera categoría es la `categoriaDominante` de su `*.esperado.json` (Compras)

### Requirement: Sin transacciones no hay divisiones entre cero
Con cero transacciones, las métricas SHALL valer 0 y el gasto por categoría SHALL estar vacío, sin errores ni valores no numéricos.

#### Scenario: Conjunto vacío
- **WHEN** se calculan las métricas de una lista vacía
- **THEN** todos los KPIs valen 0, ninguno es `NaN` ni infinito, y no hay categorías

### Requirement: Gasto promedio por día del periodo filtrado (R-11)
Cuando se da un periodo, el gasto promedio por día SHALL ser el gasto total entre los días naturales del periodo, contando los días sin gasto; con un periodo de 0 días SHALL valer 0.

#### Scenario: Del 1 al 10 de julio
- **WHEN** se calculan las métricas de las transacciones del 1 al 10 de julio de `tests/fixtures/generador/2026-07-semilla-1.csv` con ese periodo
- **THEN** el gasto total es 458 549.33 y el gasto promedio por día es 45 854.933 (10 días)

#### Scenario: Periodo de 0 días
- **WHEN** se calculan las métricas con un periodo cuyo inicio va después de su fin
- **THEN** el gasto promedio por día es 0, sin `NaN` ni infinito

#### Scenario: Sin periodo
- **WHEN** se calculan las métricas sin periodo
- **THEN** el promedio divide entre los días naturales del mes, como hasta ahora

### Requirement: Días de quincena (R-13)
Cada día del mes SHALL tener un tipo: quincena el 15 y el último del mes; post-quincena el 16 y el 1; pre-quincena los 3 días previos a cada día de pago; normal el resto.

#### Scenario: Julio, 31 días
- **WHEN** se clasifican los días de julio de 2026
- **THEN** el 15 y el 31 son quincena, el 1 y el 16 post-quincena, el 12, 13, 14, 28, 29 y 30 pre-quincena, y el 11 normal

#### Scenario: Meses de 28, 29 y 30 días
- **WHEN** se clasifican febrero de 2026, febrero de 2028 y septiembre de 2026
- **THEN** el último día de pago es el 28, el 29 y el 30, y sus pre-quincenas son 25 a 27, 26 a 28 y 27 a 29

### Requirement: Fin de semana (R-14)
Un día SHALL ser de fin de semana si cae en viernes, sábado o domingo, sin depender de la zona horaria de la máquina.

#### Scenario: Una semana de julio
- **WHEN** se clasifican los días del 1 al 7 de julio de 2026 (el 1 es miércoles)
- **THEN** el 3, el 4 y el 5 son fin de semana y los demás no, en cualquier zona horaria

### Requirement: Gasto por día del periodo
Las métricas SHALL incluir una entrada por cada día del periodo, en orden, con su monto, su número de transacciones, su tipo de día (R-13) y si es fin de semana (R-14); un día sin gasto SHALL aparecer con monto 0.

#### Scenario: Día sin gasto
- **WHEN** el periodo va del 1 al 3 de julio y solo hay gasto el 1 y el 3
- **THEN** hay tres entradas y la del 2 vale 0

#### Scenario: Día de quincena del fixture
- **WHEN** se calculan las métricas de `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la entrada del 15 es de quincena, con 125 transacciones y 107 565.60

### Requirement: Gasto por hora
Las métricas SHALL incluir 24 entradas, de las 0 a las 23 horas, con el monto y el número de transacciones de cada hora, y SHALL contar aparte las transacciones sin hora, que no entran en ninguna hora (R-03).

#### Scenario: Una transacción sin hora
- **WHEN** hay una transacción a las 08:30:00 y otra sin hora
- **THEN** la hora 8 tiene 1 transacción, ninguna otra hora tiene gasto, y hay 1 transacción sin hora

### Requirement: Gasto por día de la semana
Las métricas SHALL incluir 7 entradas, de lunes a domingo, con el monto total, el número de esos días en el periodo, el gasto promedio por cada uno de esos días y si son de fin de semana (R-14).

#### Scenario: Julio de 2026
- **WHEN** el periodo es julio de 2026 (con cinco miércoles, jueves y viernes)
- **THEN** el viernes cuenta 5 días y su promedio es su monto entre 5, y el lunes cuenta 4 días

### Requirement: Gasto por zona y por cuenta (R-12)
Las métricas SHALL incluir el gasto por zona y por cuenta con monto, número de transacciones y proporción sobre el monto, ordenados de mayor a menor monto y, con empate, por nombre.

#### Scenario: Zona con más gasto del fixture
- **WHEN** se calculan las métricas de `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la primera zona es `Centro Histórico, CDMX`

### Requirement: Series vacías sin errores
Con cero transacciones, las series por hora, día de la semana, zona y cuenta SHALL no producir `NaN` ni infinitos; zona y cuenta SHALL estar vacías.

#### Scenario: Conjunto vacío con periodo
- **WHEN** se calculan las métricas de una lista vacía con el periodo de julio de 2026
- **THEN** todos los KPIs valen 0 y ninguna serie contiene `NaN` ni infinito
