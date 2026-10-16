# Spec Delta

## Purpose

La página donde el analista elige un CSV del mes y ve, sin red y en español de México, qué filas se descartaron y por qué, los KPIs del mes y el gasto por categoría con la dominante a la vista.

## ADDED Requirements

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
