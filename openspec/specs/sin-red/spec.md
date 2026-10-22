# sin-red Specification

## Purpose

Garantiza la restricción «cero red en ejecución» de `docs/STACK.md`: la página se sirve solo desde 127.0.0.1 y ninguna petición sale de la máquina, vigilado por la suite de sistema desde la primera fase.

## Requirements

### Requirement: La página se sirve solo en 127.0.0.1
El proyecto SHALL servir la página, tanto en desarrollo como desde el bundle construido, escuchando únicamente en 127.0.0.1.

#### Scenario: Se abre la página construida
- **WHEN** se construye el bundle y se sirve con el comando que usa la suite de sistema
- **THEN** la página responde en `http://127.0.0.1:<puerto>/` y muestra el título del tablero

### Requirement: Ninguna petición sale de 127.0.0.1
Al cargar la página, el navegador SHALL hacer peticiones solo a 127.0.0.1; la suite de sistema SHALL fallar si observa cualquier petición a otro host.

#### Scenario: La página vacía no pide nada fuera
- **WHEN** la suite de sistema abre la página y espera a que termine de cargar
- **THEN** todas las peticiones registradas van a 127.0.0.1 y la prueba pasa

#### Scenario: Un asset externo se cuela
- **WHEN** la página incluye una referencia a un recurso en otro host (por ejemplo, una fuente web)
- **THEN** la prueba de sistema falla y nombra la URL externa

### Requirement: Ninguna prueba de sistema escapa de la vigilancia de peticiones
Toda prueba de `tests/sistema/` SHALL usar el `test` que vigila las peticiones, y el lint del gate SHALL rechazar cualquier otra forma de obtener el `test` de Playwright: el import con nombre, con alias, el import por defecto y el import desde el paquete `playwright/test`.

#### Scenario: Import por defecto de @playwright/test
- **WHEN** una spec de `tests/sistema/` hace `import pw from '@playwright/test'`
- **THEN** el lint del gate falla en ese archivo

#### Scenario: Import desde playwright/test
- **WHEN** una spec de `tests/sistema/` hace `import { test } from 'playwright/test'`
- **THEN** el lint del gate falla en ese archivo

#### Scenario: Import de la vigilancia
- **WHEN** una spec de `tests/sistema/` importa `test` de `./sin-red`
- **THEN** el lint del gate no marca ese import
