# Spec Delta

## MODIFIED Requirements

### Requirement: Flujo principal en la suite de sistema
La suite de sistema SHALL recorrer el flujo contra `npm start`: elegir el fixture de semilla `2026-07` con filas inválidas añadidas en memoria (menos del 5 %), ver esas filas en el resumen de validación, los KPIs, la categoría dominante de su `*.esperado.json` y, en el panel de hallazgos, su categoría dominante, su zona favorita y el destino de su viaje, ver el mapa dibujado, esperar a que termine el intento de guardado (el aviso de guardado o, si otra prueba ya guardó ese mes en el mismo servidor, la pregunta de reemplazo) y comprobar que solo la petición de guardado lleva cuerpo, sin peticiones fuera de 127.0.0.1.

#### Scenario: Cargar y ver el mes de punta a punta
- **WHEN** la prueba de sistema elige el fixture de semilla `2026-07` con tres filas inválidas añadidas
- **THEN** la página lista esas tres filas con su motivo, muestra 2 000 transacciones y pone primero la `categoriaDominante` del esperado, el panel de hallazgos muestra la `categoriaDominante`, la `zonaFavorita` y el `viaje.destino` del esperado, el mapa se dibuja sin el mensaje de «sin coordenadas», anuncia el resultado del guardado, ninguna petición lleva el texto del archivo ni un trozo suyo en la URL, y ninguna petición salió de 127.0.0.1
