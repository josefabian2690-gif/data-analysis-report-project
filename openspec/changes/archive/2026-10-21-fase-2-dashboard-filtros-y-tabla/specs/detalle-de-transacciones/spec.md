# Spec Delta

## Purpose

Muestra al analista las transacciones del conjunto filtrado en una tabla que puede ordenar por columna, para llegar del patrón de una gráfica al gasto concreto que lo produce.

## ADDED Requirements

### Requirement: Tabla del conjunto filtrado
La página SHALL mostrar una tabla accesible con las transacciones filtradas (R-10): fecha y hora, concepto, categoría, cuenta, zona y monto, con fechas y montos en el formato de R-17.

#### Scenario: Una fila por transacción
- **WHEN** el analista carga un CSV de 3 transacciones válidas
- **THEN** la tabla tiene 3 filas de datos, cada una con su fecha en dd/mm/aaaa y su monto en MXN

#### Scenario: La tabla sigue al filtro
- **WHEN** el analista filtra por una categoría
- **THEN** la tabla solo lista transacciones de esa categoría

#### Scenario: Fecha sin hora
- **WHEN** una transacción no trae hora (R-03)
- **THEN** su fila muestra la fecha sin inventar una hora

### Requirement: Orden por columna
Cada columna SHALL poder ordenarse ascendente y descendente desde un control accesible en su encabezado, que anuncia el orden vigente.

#### Scenario: Ordenar por monto descendente
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv` y ordena por monto de mayor a menor
- **THEN** la primera fila es «Renta departamento» por `$12,990.00`, y el encabezado de monto anuncia el orden descendente

#### Scenario: Ordenar por fecha
- **WHEN** el analista ordena por fecha ascendente y hay una transacción sin hora en un día con otras
- **THEN** la transacción sin hora va antes que las de su mismo día que sí tienen hora

### Requirement: Orden inicial
Sin orden elegido, la tabla SHALL listar por fecha y hora ascendentes.

#### Scenario: Al cargar
- **WHEN** el analista carga un CSV cuyas filas no están en orden de fecha
- **THEN** la tabla las lista de la más antigua a la más reciente

### Requirement: Paginación
La tabla SHALL mostrar las filas por páginas de tamaño fijo, decir en qué página está y cuántas hay, y permitir ir a la anterior y a la siguiente; al cambiar el filtro SHALL volver a la primera página.

#### Scenario: El fixture en páginas
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv` sin filtros
- **THEN** la tabla muestra la primera página y dice cuántas páginas hay en total para las 2 000 transacciones

#### Scenario: Filtrar desde otra página
- **WHEN** el analista está en la página 3 y cambia un filtro
- **THEN** la tabla vuelve a la página 1 del nuevo conjunto
