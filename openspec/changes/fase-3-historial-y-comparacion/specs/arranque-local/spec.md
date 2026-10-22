# Spec Delta

## MODIFIED Requirements

### Requirement: Sirve solo el bundle
El servidor SHALL responder `GET` y `HEAD` con los archivos del bundle del navegador y su tipo de contenido, `/` con la página, las rutas bajo `/api/meses` con la API del historial, y 404 a cualquier otra ruta que no sea un archivo del bundle, incluidas las que intentan salir de su carpeta. Fuera de `/api/`, cualquier método distinto de `GET` y `HEAD` SHALL responder 405.

#### Scenario: La página
- **WHEN** se pide `/`
- **THEN** la respuesta es 200 con la página HTML del tablero

#### Scenario: Un recurso del bundle
- **WHEN** se pide un archivo JavaScript del bundle
- **THEN** la respuesta es 200 con un tipo de contenido JavaScript

#### Scenario: Salir de la carpeta del bundle
- **WHEN** se pide una ruta con `..` que apunta fuera del bundle (también codificada como `%2e%2e`)
- **THEN** la respuesta es 404 y no se lee ningún archivo de fuera

#### Scenario: La API del historial
- **WHEN** se pide `GET /api/meses`
- **THEN** la respuesta es la lista JSON de meses guardados, no un archivo del bundle

#### Scenario: Otro método fuera de la API
- **WHEN** se envía `PUT /index.html`
- **THEN** la respuesta es 405 e indica `GET` y `HEAD`
