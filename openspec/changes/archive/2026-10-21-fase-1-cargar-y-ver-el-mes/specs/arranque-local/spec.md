# Spec Delta

## Purpose

Arranca el tablero con un solo comando, `npm start`: deja el bundle construido y al día, lo sirve desde la propia máquina escuchando únicamente en 127.0.0.1 y abre el navegador, sin ninguna petición a la red.

## ADDED Requirements

### Requirement: Un solo comando
`npm start` SHALL dejar la página servida en `http://127.0.0.1:<puerto>/` sin ningún paso previo: SHALL construir el bundle del navegador si falta o si alguna de sus fuentes es más reciente, y SHALL reutilizarlo si está al día.

#### Scenario: Sin bundle
- **WHEN** se corre `npm start` en un árbol recién clonado, sin bundle construido
- **THEN** el bundle se construye y la página responde en 127.0.0.1

#### Scenario: Bundle al día
- **WHEN** el bundle es más reciente que todas sus fuentes
- **THEN** no se vuelve a construir

#### Scenario: Una fuente cambió
- **WHEN** un archivo de `src/` es más reciente que el bundle
- **THEN** el bundle se vuelve a construir antes de servir

### Requirement: Escucha únicamente en 127.0.0.1
El servidor SHALL escuchar solo en la interfaz 127.0.0.1, nunca en todas las interfaces ni en otra dirección, y un test del gate SHALL fallar si escucha en otra.

#### Scenario: Dirección de escucha
- **WHEN** el servidor arranca
- **THEN** la dirección en la que escucha es exactamente `127.0.0.1`

### Requirement: Sirve solo el bundle
El servidor SHALL responder `GET` y `HEAD` con los archivos del bundle del navegador y su tipo de contenido, `/` con la página, y 404 a cualquier ruta que no sea un archivo del bundle, incluidas las que intentan salir de su carpeta.

#### Scenario: La página
- **WHEN** se pide `/`
- **THEN** la respuesta es 200 con la página HTML del tablero

#### Scenario: Un recurso del bundle
- **WHEN** se pide un archivo JavaScript del bundle
- **THEN** la respuesta es 200 con un tipo de contenido JavaScript

#### Scenario: Salir de la carpeta del bundle
- **WHEN** se pide una ruta con `..` que apunta fuera del bundle (también codificada como `%2e%2e`)
- **THEN** la respuesta es 404 y no se lee ningún archivo de fuera

### Requirement: Abre el navegador
Al quedar listo, el arranque SHALL abrir el navegador del sistema en la dirección del tablero, salvo que la variable `TABLERO_SIN_NAVEGADOR` valga `1`.

#### Scenario: Arranque normal
- **WHEN** el servidor queda escuchando
- **THEN** se abre el navegador en `http://127.0.0.1:<puerto>/`

#### Scenario: Arranque para pruebas
- **WHEN** el servidor arranca con `TABLERO_SIN_NAVEGADOR=1`
- **THEN** no se abre ningún navegador

### Requirement: Puerto fijo y configurable
El servidor SHALL escuchar en un puerto fijo por defecto, cambiable con la variable `TABLERO_PUERTO`; si el puerto está ocupado, el arranque SHALL terminar con un código distinto de cero y un mensaje que nombra el puerto y la variable.

#### Scenario: Puerto ocupado
- **WHEN** se arranca con un `TABLERO_PUERTO` que ya usa otro proceso
- **THEN** el arranque termina con error y el mensaje nombra ese puerto y `TABLERO_PUERTO`
