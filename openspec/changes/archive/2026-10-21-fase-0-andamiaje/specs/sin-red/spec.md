# Spec Delta

## Purpose

Garantiza la restricción «cero red en ejecución» de `docs/STACK.md`: la página se sirve solo desde 127.0.0.1 y ninguna petición sale de la máquina, vigilado por la suite de sistema desde la primera fase.

## ADDED Requirements

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
