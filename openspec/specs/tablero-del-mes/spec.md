# tablero-del-mes Specification

## Purpose

La página donde el analista elige un CSV del mes y ve, sin red y en español de México, qué filas se descartaron y por qué, los KPIs del mes y el gasto por categoría con la dominante a la vista.

## Requirements

### Requirement: Elegir un CSV
La página SHALL ofrecer un control accesible para elegir un archivo CSV del disco, y SHALL leerlo y procesarlo en el navegador, sin enviarlo a ningún servidor.

#### Scenario: Estado inicial
- **WHEN** el analista abre la página
- **THEN** ve el título del tablero y el control para elegir un CSV, y todavía no hay KPIs

#### Scenario: El archivo no sale del navegador
- **WHEN** el analista elige un CSV
- **THEN** ninguna petición lleva el contenido del archivo

### Requirement: Rechazo visible
Cuando la carga se rechaza, la página SHALL mostrar el motivo en es-MX, nombrando las columnas que faltan si es el caso, y SHALL permitir elegir otro archivo.

#### Scenario: Falta una columna obligatoria
- **WHEN** el analista elige un CSV sin la columna `monto`
- **THEN** la página muestra un mensaje de rechazo que nombra `monto` y no muestra KPIs

### Requirement: Resumen de validación
Tras una carga aceptada, la página SHALL mostrar el mes, el número de transacciones válidas, el número de filas inválidas y la lista de filas inválidas con su número de fila y su motivo en es-MX.

#### Scenario: Filas inválidas listadas
- **WHEN** el analista elige un CSV con 2 filas inválidas, la 4 por monto y la 9 por estar fuera del mes
- **THEN** la página dice que hay 2 filas inválidas y lista la fila 4 con el motivo del monto y la fila 9 con «fuera del mes»

#### Scenario: Sin filas inválidas
- **WHEN** el analista elige `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la página dice que hay 0 filas inválidas y muestra el tablero

### Requirement: Confirmación con más del 5 % de inválidas (R-05)
Cuando la carga pide confirmación, la página SHALL decir qué proporción de filas es inválida y SHALL mostrar el tablero solo si el analista confirma; si cancela, SHALL volver al estado inicial.

#### Scenario: El analista confirma
- **WHEN** el analista elige un CSV con más del 5 % de filas inválidas y confirma
- **THEN** la página muestra el resumen de validación y el tablero

#### Scenario: El analista cancela
- **WHEN** el analista elige un CSV con más del 5 % de filas inválidas y cancela
- **THEN** la página vuelve al estado inicial sin KPIs

### Requirement: KPIs del mes en pantalla
La página SHALL mostrar los cinco KPIs de R-11, cada uno con su nombre accesible, con montos en formato `$12,345.67` (R-17).

#### Scenario: KPIs del fixture
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** ve 2 000 transacciones y un gasto total de `$1,689,470.67`

### Requirement: Gasto por categoría con la dominante a la vista
La página SHALL mostrar el gasto por categoría en una gráfica y en una lista accesible ordenada de mayor a menor monto, con monto y porcentaje sobre el monto (R-12); la primera categoría SHALL ir destacada.

#### Scenario: La dominante va primero
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** la primera categoría de la lista es Compras, destacada, con su monto y su porcentaje

### Requirement: Flujo principal en la suite de sistema
La suite de sistema SHALL recorrer el flujo contra `npm start`: elegir el fixture de semilla `2026-07` con filas inválidas añadidas en memoria (menos del 5 %), ver esas filas en el resumen de validación, los KPIs y la categoría dominante de su `*.esperado.json`, sin peticiones fuera de 127.0.0.1.

#### Scenario: Cargar y ver el mes de punta a punta
- **WHEN** la prueba de sistema elige el fixture de semilla `2026-07` con tres filas inválidas añadidas
- **THEN** la página lista esas tres filas con su motivo, muestra 2 000 transacciones y pone primero la `categoriaDominante` del esperado, y ninguna petición salió de 127.0.0.1

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
