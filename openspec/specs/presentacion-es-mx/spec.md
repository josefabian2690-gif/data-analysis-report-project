# presentacion-es-mx Specification

## Purpose

Fija cómo se muestran montos y fechas en todo el tablero, en español de México (R-17), con un único formateador que comparten la página y, más adelante, el reporte exportado.

## Requirements

### Requirement: Montos en MXN (R-17)
Los montos SHALL mostrarse como `$12,345.67`: signo de peso, comas de miles, punto decimal y exactamente dos decimales, redondeados a centavos solo al mostrarlos.

#### Scenario: Monto con miles
- **WHEN** se formatea 12345.67
- **THEN** el texto es `$12,345.67`

#### Scenario: Monto entero
- **WHEN** se formatea 900
- **THEN** el texto es `$900.00`

#### Scenario: Más de dos decimales
- **WHEN** se formatea 10.126
- **THEN** el texto es `$10.13`

### Requirement: Fechas dd/mm/aaaa (R-17)
Las fechas SHALL mostrarse como `15/09/2026`, sin depender de la zona horaria de la máquina.

#### Scenario: Día del mes
- **WHEN** se formatea el día `2026-09-15`
- **THEN** el texto es `15/09/2026`

#### Scenario: Primer día del mes
- **WHEN** se formatea el día `2026-07-01`
- **THEN** el texto es `01/07/2026`, igual en cualquier zona horaria

### Requirement: Porcentajes legibles
Los porcentajes SHALL mostrarse con un decimal y el signo `%` pegado al número, como los escribe es-MX.

#### Scenario: Porcentaje de una categoría
- **WHEN** se formatea la proporción 0.4823
- **THEN** el texto es `48.2%`
