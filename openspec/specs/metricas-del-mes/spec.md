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
