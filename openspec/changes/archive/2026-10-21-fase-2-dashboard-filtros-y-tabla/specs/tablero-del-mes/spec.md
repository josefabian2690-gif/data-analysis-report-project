# Spec Delta

## ADDED Requirements

### Requirement: Gráficas por día, hora, día de la semana, zona y cuenta
Tras una carga aceptada, la página SHALL mostrar una gráfica por cada serie (día del periodo, hora, día de la semana, zona y cuenta), cada una con su título y una descripción accesible con sus valores en el formato de R-17.

#### Scenario: Las cinco gráficas del fixture
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** ve las gráficas por día, por hora, por día de la semana, por zona y por cuenta, y la de zona nombra primero `Centro Histórico, CDMX`

### Requirement: La quincena se ve en el gasto por día (R-13)
La gráfica por día SHALL distinguir los días de quincena, post-quincena y pre-quincena de los normales, con una marca que no dependa solo del color y cuyo significado se lea en la página.

#### Scenario: El 15 de julio
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la gráfica por día identifica el `15/07/2026` y el `31/07/2026` como quincena

### Requirement: El fin de semana se ve en el gasto por día de la semana (R-14)
La gráfica por día de la semana SHALL mostrar el gasto promedio por día de cada día de la semana y SHALL distinguir viernes, sábado y domingo como fin de semana, con una marca que no dependa solo del color.

#### Scenario: Viernes a domingo
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la gráfica por día de la semana identifica viernes, sábado y domingo como fin de semana

### Requirement: Una sola barra no ocupa la gráfica
Una gráfica de barras con una sola entrada SHALL dibujarla con el mismo grosor máximo que cuando hay varias.

#### Scenario: Filtrar por una categoría
- **WHEN** el analista filtra por una sola categoría
- **THEN** la gráfica por categoría muestra una barra de grosor acotado, no una que llena el alto

### Requirement: Dashboard filtrado en la suite de sistema
La suite de sistema SHALL recorrer contra `npm start` el dashboard filtrado: cargar el fixture `2026-07`, ver la quincena marcada, filtrar, ver los KPIs y la tabla recalculados, ordenar la tabla y quitar los filtros, sin peticiones fuera de 127.0.0.1.

#### Scenario: Filtrar y ordenar de punta a punta
- **WHEN** la prueba de sistema carga `tests/fixtures/generador/2026-07-semilla-1.csv`, filtra del `01/07/2026` al `10/07/2026` y después ordena la tabla por monto descendente
- **THEN** ve 590 transacciones, `$458,549.33` y un gasto promedio por día de `$45,854.93`, la primera fila de la tabla es la de mayor monto de esos días, y ninguna petición salió de 127.0.0.1
