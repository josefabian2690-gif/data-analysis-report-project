# comparacion-de-meses Specification

## Purpose

Compara meses del historial por categoría y en el total, con la diferencia absoluta y porcentual de R-15, en una tabla accesible y una gráfica, para ver cómo cambió el gasto de un mes a otro.

## Requirements

### Requirement: Diferencia por categoría y en el total (R-15)
La comparación de meses SHALL dar, para cada categoría presente en alguno de ellos y para el total, el monto de cada mes, la diferencia absoluta y la diferencia porcentual de cada mes respecto del anterior en orden cronológico.

#### Scenario: Julio contra agosto de los fixtures
- **WHEN** se comparan los fixtures `2026-07-semilla-1` y `2026-08-semilla-2`
- **THEN** el total pasa de 1 689 470.67 a 1 544 622.78, con diferencia -144 847.89 y -8.57 %; Compras, de 814 566.30 a 201 746.52 (-612 819.78, -75.23 %); Entretenimiento, de 258 692.09 a 847 205.02 (+588 512.93, +227.50 %)

#### Scenario: Meses en desorden
- **WHEN** se comparan `2026-08` y `2026-07` pasados en ese orden
- **THEN** el resultado es el mismo que pasándolos como `2026-07` y `2026-08`

### Requirement: Una categoría ausente cuenta como 0 (R-15)
Si una categoría no aparece en un mes, la comparación SHALL contarla con monto 0 en ese mes; cuando el monto del mes anterior es 0, la diferencia porcentual SHALL quedar sin valor, nunca infinita ni `NaN`.

#### Scenario: Categoría nueva
- **WHEN** Viajes tiene 0 en julio y 1 000.00 en agosto
- **THEN** la diferencia absoluta es +1 000.00 y la porcentual no tiene valor

#### Scenario: Categoría que desaparece
- **WHEN** Salud tiene 500.00 en julio y no aparece en agosto
- **THEN** agosto cuenta 0, la diferencia es -500.00 y -100 %

### Requirement: La comparación usa los meses enteros
La comparación SHALL usar todas las transacciones guardadas de cada mes, sin aplicar los filtros del tablero del mes cargado.

#### Scenario: Con un filtro activo en el tablero
- **WHEN** el analista filtra el tablero por una categoría y abre la comparación
- **THEN** los montos de la comparación son los de los meses completos

### Requirement: Comparar dos meses en la página
Con al menos dos meses guardados, la vista de historial SHALL dejar elegir dos meses, por defecto los dos más recientes, y SHALL mostrar una tabla accesible con cada categoría y el total: monto de cada mes en R-17 y la diferencia absoluta y porcentual con signo; sin valor porcentual se muestra un texto del catálogo. Con menos de dos meses SHALL decir que hacen falta dos.

#### Scenario: Comparación por defecto
- **WHEN** el historial tiene julio, agosto y septiembre de 2026 y el analista abre la vista de historial
- **THEN** la comparación muestra agosto contra septiembre, y la fila del total dice `$1,544,622.78`, `$1,278,296.56`, `-$266,326.22` y `-17.2%`

#### Scenario: Elegir otros meses
- **WHEN** el analista elige julio y agosto de 2026
- **THEN** la fila de Compras dice `$814,566.30`, `$201,746.52`, `-$612,819.78` y `-75.2%`

#### Scenario: Un solo mes guardado
- **WHEN** el historial tiene un solo mes
- **THEN** la vista dice que hacen falta dos meses para comparar y no muestra tabla vacía

### Requirement: Gráfica de la comparación
La comparación SHALL mostrarse también en una gráfica con el monto de cada categoría en cada uno de los dos meses, con título y descripción accesible que da los montos en R-17, y con los meses distinguibles sin depender solo del color.

#### Scenario: Gráfica de julio contra agosto
- **WHEN** el analista compara julio y agosto de 2026
- **THEN** la gráfica tiene una serie por mes con una barra por categoría, y su descripción accesible nombra Compras con `$814,566.30` y `$201,746.52`

### Requirement: Comparación en la suite de sistema
La suite de sistema SHALL comparar, tras el reinicio del flujo de persistencia, dos de los meses guardados y comprobar con cifras literales la fila del total y la de una categoría, sin peticiones fuera de 127.0.0.1.

#### Scenario: Julio contra agosto de punta a punta
- **WHEN** la prueba de sistema elige julio y agosto de 2026 en la comparación
- **THEN** la fila del total dice `-$144,847.89` y `-8.6%` y la de Entretenimiento `+$588,512.93` y `+227.5%`, y ninguna petición salió de 127.0.0.1
