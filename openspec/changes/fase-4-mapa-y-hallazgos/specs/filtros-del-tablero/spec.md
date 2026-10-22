# Spec Delta

## MODIFIED Requirements

### Requirement: Todo el dashboard se recalcula
Al cambiar un filtro, la página SHALL recalcular los KPIs, todas las gráficas, el mapa, los hallazgos y la tabla sobre las transacciones filtradas; el resumen de validación de la carga SHALL no cambiar.

#### Scenario: Filtrar por categoría en la página
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv` y elige solo la categoría Compras
- **THEN** ve 404 transacciones y un gasto total de `$814,566.30`, y el resumen de validación sigue diciendo 2 000 transacciones válidas

#### Scenario: Quitar los filtros
- **WHEN** el analista quita todos los filtros
- **THEN** vuelve a ver 2 000 transacciones y `$1,689,470.67`

#### Scenario: Mapa y hallazgos siguen al filtro
- **WHEN** el analista carga la semilla 1 y elige solo la categoría Compras
- **THEN** el mapa tiene 404 puntos, la categoría dominante es Compras con 100 % y no hay hallazgo de zona favorita

### Requirement: Filtro que deja 0 filas
Cuando el filtro deja 0 transacciones, la página SHALL mostrar un mensaje de estado en lugar de los KPIs, los hallazgos, las gráficas, el mapa y la tabla, sin errores ni valores no numéricos, y SHALL dejar cambiar o quitar los filtros.

#### Scenario: Monto imposible en la página
- **WHEN** el analista pone monto mínimo 1000 y máximo 10
- **THEN** ve el mensaje de que ningún gasto cumple los filtros, ningún `NaN`, ni hallazgos ni mapa, y puede quitar los filtros
