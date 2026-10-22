# filtros-del-tablero Specification

## Purpose

Deja al analista recortar el mes cargado por fechas, categorías, cuentas, zonas y monto, y hace que todo el dashboard (KPIs, gráficas y tabla) se recalcule sobre las transacciones que quedan (R-10).

## Requirements

### Requirement: Dimensiones con Y, valores con O (R-10)
Un filtro SHALL dejar solo las transacciones que cumplen todas sus dimensiones activas (Y); dentro de una dimensión con varios valores elegidos, basta con cumplir uno (O).

#### Scenario: Dos categorías y una cuenta
- **WHEN** se filtra por las categorías Comida y Transporte y por la cuenta `Débito ****1`
- **THEN** quedan las transacciones de Comida o de Transporte pagadas con `Débito ****1`, y ninguna otra

#### Scenario: Zona
- **WHEN** se filtra por la zona `Roma Norte, CDMX`
- **THEN** quedan solo las transacciones de esa zona

### Requirement: Dimensión sin valores elegidos
Una dimensión de lista (categorías, cuentas o zonas) sin ningún valor elegido SHALL no restringir; un filtro sin ninguna dimensión activa SHALL dejar todas las transacciones.

#### Scenario: Filtro vacío
- **WHEN** se filtra sin ninguna dimensión activa
- **THEN** quedan todas las transacciones, en el mismo orden

### Requirement: Rangos inclusivos
El rango de fechas y el rango de monto SHALL incluir sus extremos; cada extremo SHALL ser opcional.

#### Scenario: Rango de fechas
- **WHEN** se filtra del `2026-07-10` al `2026-07-12`
- **THEN** quedan las transacciones de los días 10, 11 y 12, a cualquier hora, y ninguna del 9 ni del 13

#### Scenario: Solo monto mínimo
- **WHEN** se filtra con monto mínimo 500 y sin máximo
- **THEN** quedan las transacciones de 500 o más, incluida una de exactamente 500

### Requirement: Rango imposible
Un rango con el inicio después del fin SHALL dejar 0 transacciones, sin errores.

#### Scenario: Monto mínimo mayor que el máximo
- **WHEN** se filtra con monto mínimo 1000 y máximo 10
- **THEN** no queda ninguna transacción

### Requirement: Opciones del filtro
Las opciones de categorías, cuentas y zonas SHALL salir del mes completo (no del conjunto filtrado), sin repetidos y ordenadas por nombre en español; los límites de fecha SHALL ser el primer y el último día del mes.

#### Scenario: Las opciones no desaparecen al filtrar
- **WHEN** el analista filtra por la categoría Compras
- **THEN** la lista de categorías sigue ofreciendo todas las del mes

### Requirement: Periodo del filtro
El periodo SHALL ser el rango de fechas del filtro recortado al mes; sin rango de fechas, el mes completo; con el inicio después del fin, un periodo de 0 días.

#### Scenario: Sin fechas
- **WHEN** el mes es `2026-07` y el filtro no tiene fechas
- **THEN** el periodo va del `2026-07-01` al `2026-07-31`

#### Scenario: Solo fecha de inicio
- **WHEN** el mes es `2026-07` y el filtro empieza el `2026-07-20`
- **THEN** el periodo va del `2026-07-20` al `2026-07-31`

### Requirement: Todo el dashboard se recalcula
Al cambiar un filtro, la página SHALL recalcular los KPIs, todas las gráficas y la tabla sobre las transacciones filtradas; el resumen de validación de la carga SHALL no cambiar.

#### Scenario: Filtrar por categoría en la página
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv` y elige solo la categoría Compras
- **THEN** ve 404 transacciones y un gasto total de `$814,566.30`, y el resumen de validación sigue diciendo 2 000 transacciones válidas

#### Scenario: Quitar los filtros
- **WHEN** el analista quita todos los filtros
- **THEN** vuelve a ver 2 000 transacciones y `$1,689,470.67`

### Requirement: Otro archivo empieza sin filtros
Al cargar otro CSV, el filtro SHALL volver a vacío y sus opciones SHALL ser las del mes nuevo.

#### Scenario: Cargar otro mes con un filtro puesto
- **WHEN** el analista tiene filtrada la categoría Compras y elige otro CSV
- **THEN** ve el tablero del mes nuevo completo, sin ningún filtro marcado

### Requirement: Fechas del filtro en dd/mm/aaaa
Los controles del rango de fechas SHALL mostrar los días con el formato de R-17, sin depender del idioma del navegador.

#### Scenario: Elegir el día de inicio
- **WHEN** el analista abre el control de la fecha de inicio con el mes `2026-07` cargado
- **THEN** las opciones van de `01/07/2026` a `31/07/2026`

### Requirement: Filtro que deja 0 filas
Cuando el filtro deja 0 transacciones, la página SHALL mostrar un mensaje de estado en lugar de los KPIs, las gráficas y la tabla, sin errores ni valores no numéricos, y SHALL dejar cambiar o quitar los filtros.

#### Scenario: Monto imposible en la página
- **WHEN** el analista pone monto mínimo 1000 y máximo 10
- **THEN** ve el mensaje de que ningún gasto cumple los filtros, ningún `NaN`, y puede quitar los filtros
