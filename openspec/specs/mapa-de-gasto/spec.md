# mapa-de-gasto Specification

## Purpose

Muestra dónde se gasta: un mapa local de las transacciones con coordenadas, dibujado como puntos por longitud y latitud, con color y forma por zona, sin teselas, contornos ni ninguna petición de red.

## Requirements

### Requirement: Puntos por zona
El mapa SHALL dibujar un punto por transacción con coordenadas, en la posición de su longitud (horizontal) y su latitud (vertical), agrupado por zona; las transacciones sin coordenadas (R-02, R-07) no aparecen.

#### Scenario: Julio en el mapa
- **WHEN** se construye el mapa de `tests/fixtures/generador/2026-07-semilla-1.csv`
- **THEN** tiene 2 000 puntos en 7 grupos, uno por zona, con 755 en `Centro Histórico, CDMX` y 247 en `Monterrey, N.L.`

#### Scenario: Transacción sin coordenadas
- **WHEN** una de tres transacciones no tiene coordenadas
- **THEN** el mapa tiene 2 puntos y la cuenta de transacciones sin coordenadas es 1

### Requirement: Color y forma por zona
Cada zona SHALL tener un color y una forma de punto propios dentro del mapa, de modo que dos zonas no se distingan solo por el color, y una leyenda SHALL nombrar cada zona. Las zonas van de mayor a menor monto, como en la gráfica por zona.

#### Scenario: Siete zonas distintas
- **WHEN** se construye el mapa de la semilla 1
- **THEN** sus 7 zonas tienen 7 combinaciones distintas de color y forma, y la leyenda nombra las 7

### Requirement: Encuadre en la ciudad principal
El mapa SHALL abrirse encuadrado en los puntos de la ciudad principal y SHALL permitir acercar, alejar y desplazarse hasta los puntos de fuera de ella.

#### Scenario: CDMX a la vista, Monterrey al alejar
- **WHEN** el analista carga la semilla 1
- **THEN** el mapa abre con las zonas de CDMX separadas a la vista, y alejándose llega a los puntos de `Monterrey, N.L.`

### Requirement: Sin red ni contorno
El mapa SHALL dibujarse solo con lo que va en el bundle: sin teselas, sin GeoJSON ni contorno, y sin ninguna petición fuera de 127.0.0.1.

#### Scenario: Ninguna petición al dibujar el mapa
- **WHEN** la suite de sistema carga la semilla 1 y el mapa se dibuja
- **THEN** ninguna petición sale de 127.0.0.1

### Requirement: Mapa en la página
Tras una carga aceptada, la página SHALL mostrar el mapa tras la gráfica por cuenta y antes de la tabla, con un título, un nombre accesible y una descripción accesible que diga cuántos puntos tiene cada zona.

#### Scenario: Sección del mapa
- **WHEN** el analista carga la semilla 1
- **THEN** ve la sección del mapa entre la gráfica por cuenta y la tabla, y su descripción accesible nombra `Centro Histórico, CDMX` con 755 puntos

### Requirement: Mes sin coordenadas
Cuando ninguna transacción del conjunto visible tiene coordenadas, la sección del mapa SHALL mostrar un mensaje de que no hay coordenadas en lugar del mapa, sin errores.

#### Scenario: CSV sin columnas de coordenadas
- **WHEN** el analista carga `tests/fixtures/a-mano/minimo.csv`
- **THEN** la sección del mapa dice que no hay coordenadas y el resto del tablero se ve
