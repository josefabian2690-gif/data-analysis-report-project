# Spec Delta

## Purpose

Hace automática la tabla de capas de `docs/ARQUITECTURA.md` y la ausencia de I/O en las capas puras, para que una violación deje el gate en rojo en lugar de depender de la revisión.

## ADDED Requirements

### Requirement: El lint rechaza los imports que la tabla de capas prohíbe
El paso `lint` del gate SHALL fallar cuando un archivo de una capa importa de otra capa que la tabla de capas de `docs/ARQUITECTURA.md` no le permite. `cliente` y `servidor` no se importan entre sí, y `dominio` no importa de ninguna otra capa del proyecto.

#### Scenario: El dominio importa del cliente
- **WHEN** un archivo bajo `src/dominio/` importa un módulo de `src/cliente/`
- **THEN** el lint reporta un error sobre ese import y el gate queda en rojo

#### Scenario: El cliente importa del servidor
- **WHEN** un archivo bajo `src/cliente/` importa un módulo de `src/servidor/`
- **THEN** el lint reporta un error sobre ese import

#### Scenario: Un import permitido
- **WHEN** un archivo bajo `src/graficas/` importa un módulo de `src/dominio/`
- **THEN** el lint no reporta error por ese import

### Requirement: El lint rechaza el I/O en las capas puras
El paso `lint` SHALL fallar cuando un archivo de `src/dominio/`, `src/graficas/` o `src/reporte/` importa un módulo `node:*` o usa `fetch`, el reloj del sistema, el DOM o las variables de entorno.

#### Scenario: El dominio lee un archivo
- **WHEN** un archivo bajo `src/dominio/` importa `node:fs`
- **THEN** el lint reporta un error y el gate queda en rojo

#### Scenario: Las gráficas consultan el reloj
- **WHEN** un archivo bajo `src/graficas/` llama a `Date.now()` o construye `new Date()` sin argumentos
- **THEN** el lint reporta un error

#### Scenario: El reporte lee el entorno
- **WHEN** un archivo bajo `src/reporte/` lee `process.env`
- **THEN** el lint reporta un error

### Requirement: Las reglas de capas están protegidas por un test
El gate SHALL incluir un test que demuestre que el lint rechaza al menos un import prohibido entre capas y un uso de I/O en una capa pura, y que acepta un import permitido, de modo que desactivar o romper la configuración deje el gate en rojo.

#### Scenario: Alguien relaja la configuración del lint
- **WHEN** se elimina la regla de capas de la configuración de ESLint
- **THEN** el test de arquitectura falla
