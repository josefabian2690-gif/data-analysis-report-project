# Spec Delta

## MODIFIED Requirements

### Requirement: Elegir un CSV
La página SHALL ofrecer un control accesible para elegir un archivo CSV del disco, y SHALL leerlo y procesarlo en el navegador, sin enviar el archivo a ningún servidor. Lo único que sale de la página tras una carga aceptada son las transacciones del mes, hacia el historial del servidor local en 127.0.0.1.

#### Scenario: Estado inicial
- **WHEN** el analista abre la página
- **THEN** ve el título del tablero y el control para elegir un CSV, y todavía no hay KPIs

#### Scenario: El archivo no sale del navegador
- **WHEN** el analista elige un CSV
- **THEN** ninguna petición lleva el texto del archivo, y la única petición con cuerpo es la que guarda las transacciones del mes en `http://127.0.0.1:<puerto>/api/meses/AAAA-MM`

### Requirement: Flujo principal en la suite de sistema
La suite de sistema SHALL recorrer el flujo contra `npm start`: elegir el fixture de semilla `2026-07` con filas inválidas añadidas en memoria (menos del 5 %), ver esas filas en el resumen de validación, los KPIs y la categoría dominante de su `*.esperado.json`, esperar a que termine el intento de guardado (el aviso de guardado o, si otra prueba ya guardó ese mes en el mismo servidor, la pregunta de reemplazo) y comprobar que solo la petición de guardado lleva cuerpo, sin peticiones fuera de 127.0.0.1.

#### Scenario: Cargar y ver el mes de punta a punta
- **WHEN** la prueba de sistema elige el fixture de semilla `2026-07` con tres filas inválidas añadidas
- **THEN** la página lista esas tres filas con su motivo, muestra 2 000 transacciones y pone primero la `categoriaDominante` del esperado, anuncia el resultado del guardado, ninguna petición lleva el texto del archivo ni un trozo suyo en la URL, y ninguna petición salió de 127.0.0.1
