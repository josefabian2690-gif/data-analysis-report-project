# Spec Delta

## Purpose

Guarda en el disco de la propia máquina los meses que el analista carga, uno por archivo y sin mezclarlos, los conserva entre arranques del servidor local y los ofrece a la página para listarlos y compararlos (R-09).

## ADDED Requirements

### Requirement: Un mes por archivo en la carpeta del historial
El servidor SHALL guardar cada mes como un archivo `AAAA-MM.json` con sus transacciones, en la carpeta `historial/` de la raíz del proyecto o en la que indique la variable `TABLERO_HISTORIAL`, y SHALL crear la carpeta solo al guardar el primer mes.

#### Scenario: Guardar en la carpeta de la variable
- **WHEN** el servidor arranca con `TABLERO_HISTORIAL` apuntando a una carpeta vacía y recibe un mes `2026-07` válido
- **THEN** en esa carpeta aparece `2026-07.json` con esas transacciones y en `historial/` del proyecto no se escribe nada

#### Scenario: Arrancar no crea la carpeta
- **WHEN** el servidor arranca con una carpeta de historial que no existe y no recibe ningún mes
- **THEN** la carpeta sigue sin existir

### Requirement: Escritura atómica
Guardar un mes SHALL escribir primero un archivo temporal en la misma carpeta y después renombrarlo, de modo que un fallo a mitad de la escritura deja el mes anterior intacto o ningún archivo, nunca uno a medias; un archivo temporal sobrante no SHALL aparecer como mes.

#### Scenario: Falla la escritura
- **WHEN** la escritura de un mes que ya existía falla antes de renombrar
- **THEN** el archivo del mes conserva su contenido anterior y la API responde con error

#### Scenario: Temporal sobrante
- **WHEN** la carpeta del historial contiene un archivo temporal de una escritura interrumpida
- **THEN** la lista de meses no lo incluye

### Requirement: Listar los meses guardados
`GET /api/meses` SHALL responder 200 con un JSON `[{ mes, filas, total }]`, un elemento por mes guardado en orden cronológico, donde `filas` es el número de transacciones y `total` la suma de sus montos.

#### Scenario: Tres meses guardados
- **WHEN** el historial tiene `2026-09`, `2026-07` y `2026-08`
- **THEN** la respuesta lista `2026-07`, `2026-08` y `2026-09` en ese orden, cada uno con sus filas y su total

#### Scenario: Historial vacío
- **WHEN** la carpeta del historial no existe o está vacía
- **THEN** la respuesta es 200 con `[]`

#### Scenario: Un archivo ilegible no tumba la lista
- **WHEN** la carpeta tiene un `AAAA-MM.json` cuyo contenido no es una lista válida de transacciones de ese mes
- **THEN** la lista responde 200 sin ese mes y el servidor deja constancia del archivo en su salida

### Requirement: Leer un mes guardado
`GET /api/meses/:mes` SHALL responder 200 con las transacciones guardadas de ese mes, o 404 si no está en el historial.

#### Scenario: Mes guardado
- **WHEN** se pide `/api/meses/2026-07` y ese mes está guardado
- **THEN** la respuesta es 200 con sus transacciones tal como se guardaron

#### Scenario: Mes que no está
- **WHEN** se pide `/api/meses/2026-01` y no está guardado
- **THEN** la respuesta es 404

### Requirement: Guardar y reemplazar un mes (R-09)
`PUT /api/meses/:mes` SHALL guardar las transacciones del cuerpo: 201 si el mes no existía; 409 sin tocar el archivo si ya existía y falta `?reemplazar=1`; 200 al reemplazarlo con `?reemplazar=1`. Los meses nunca se mezclan: reemplazar sustituye el contenido entero.

#### Scenario: Mes nuevo
- **WHEN** se envía `PUT /api/meses/2026-07` con transacciones válidas de julio de 2026 y el mes no existe
- **THEN** la respuesta es 201 y el mes queda guardado

#### Scenario: Mes que ya existe
- **WHEN** se envía `PUT /api/meses/2026-07` sin `?reemplazar=1` y el mes ya está guardado
- **THEN** la respuesta es 409 y el archivo guardado no cambia

#### Scenario: Reemplazar
- **WHEN** se envía `PUT /api/meses/2026-07?reemplazar=1` con otras transacciones y el mes ya está guardado
- **THEN** la respuesta es 200 y `GET /api/meses/2026-07` devuelve solo las transacciones nuevas

### Requirement: El cuerpo se valida con el esquema del dominio
El servidor SHALL rechazar con 400, sin escribir nada, un `PUT` cuyo cuerpo no sea JSON, no sea una lista no vacía de transacciones con el esquema del dominio, tenga ids repetidos o tenga alguna transacción de otro mes que el de la ruta; SHALL rechazar con 415 un cuerpo que no se declare `application/json` y con 413 uno de más de 64 MB.

#### Scenario: Transacción de otro mes
- **WHEN** se envía `PUT /api/meses/2026-07` con una transacción del `2026-08-01`
- **THEN** la respuesta es 400 y no se guarda nada

#### Scenario: Lista vacía
- **WHEN** se envía `PUT /api/meses/2026-07` con `[]`
- **THEN** la respuesta es 400 y no se guarda nada

#### Scenario: Monto no positivo
- **WHEN** se envía una transacción con `monto` igual a 0
- **THEN** la respuesta es 400 y no se guarda nada

#### Scenario: Sin tipo de contenido JSON
- **WHEN** se envía un `PUT` con `Content-Type: text/plain`
- **THEN** la respuesta es 415 y no se guarda nada

### Requirement: El mes de la ruta se valida
Toda ruta `/api/meses/:mes` SHALL aceptar solo un mes `AAAA-MM` con el mes entre 01 y 12 y responder 400 a cualquier otro valor, de modo que ninguna ruta lea, escriba ni borre fuera de la carpeta del historial.

#### Scenario: Intento de salir de la carpeta
- **WHEN** se pide `/api/meses/..%2F..%2Fpackage` o `/api/meses/2026-13`
- **THEN** la respuesta es 400 y no se lee ni se escribe ningún archivo

### Requirement: Borrar un mes
`DELETE /api/meses/:mes` SHALL borrar el archivo del mes y responder 204, o 404 si no estaba guardado.

#### Scenario: Borrar un mes guardado
- **WHEN** se envía `DELETE /api/meses/2026-07` y el mes está guardado
- **THEN** la respuesta es 204 y el mes deja de aparecer en la lista

#### Scenario: Borrar un mes que no está
- **WHEN** se envía `DELETE /api/meses/2026-01` y no está guardado
- **THEN** la respuesta es 404

### Requirement: La API solo atiende a la página del propio tablero
El servidor SHALL responder 403 a toda petición a `/api/` cuyo encabezado `Host` no sea `127.0.0.1:<puerto>` o `localhost:<puerto>` del propio servidor, para que una página de otro origen que resuelva a 127.0.0.1 no pueda leer ni modificar el historial.

#### Scenario: Otro anfitrión
- **WHEN** llega `GET /api/meses` con `Host: ataque.example:4310`
- **THEN** la respuesta es 403 y no incluye ningún mes

### Requirement: El mes aceptado se guarda al cargarlo
Tras una carga aceptada (y, si R-05 pide confirmación, solo tras confirmarla) la página SHALL guardar el mes en el historial y SHALL anunciar en una región de estado si se guardó o si no se pudo guardar, sin dejar de mostrar el tablero del mes.

#### Scenario: Mes nuevo
- **WHEN** el analista carga `tests/fixtures/generador/2026-07-semilla-1.csv` y julio de 2026 no está guardado
- **THEN** ve el tablero del mes y el aviso de que julio de 2026 quedó guardado

#### Scenario: Carga cancelada
- **WHEN** el analista cancela la confirmación de R-05
- **THEN** no se guarda nada

#### Scenario: El servidor no responde
- **WHEN** el guardado falla por red o por un error del servidor
- **THEN** la página sigue mostrando el tablero del mes y avisa que no se pudo guardar, sin decir que el archivo es ilegible

### Requirement: Reemplazar un mes pide confirmación (R-09)
Cuando el mes cargado ya está en el historial, la página SHALL preguntar si se reemplaza, nombrando el mes, sin ocultar el tablero; reemplazar SHALL guardar la versión nueva y conservar SHALL dejar intacta la guardada.

#### Scenario: El analista reemplaza
- **WHEN** el analista carga un mes que ya está guardado y elige reemplazarlo
- **THEN** la página anuncia que el mes se reemplazó y el historial tiene la versión nueva

#### Scenario: El analista conserva el guardado
- **WHEN** el analista carga un mes que ya está guardado y elige conservar el guardado
- **THEN** el historial conserva la versión anterior y la página lo anuncia

### Requirement: Lista de meses guardados en la página
La página SHALL mostrar, en una vista de historial separada del tablero del mes, una tabla accesible con cada mes guardado (el mes en es-MX, sus transacciones y su gasto total en R-17), actualizada tras cada guardado; si el historial no está disponible, SHALL decirlo sin impedir cargar un CSV. Cambiar de vista SHALL conservar el mes cargado y su filtro.

#### Scenario: Meses guardados
- **WHEN** el historial tiene julio y agosto de 2026 y el analista abre la vista de historial
- **THEN** ve una fila por mes con «julio de 2026», «2,000» transacciones y `$1,689,470.67`, y la de agosto con `$1,544,622.78`

#### Scenario: Historial no disponible
- **WHEN** la lista de meses no se puede obtener
- **THEN** la vista de historial lo dice y el tablero del mes sigue funcionando

### Requirement: Persistencia en la suite de sistema
La suite de sistema SHALL guardar los fixtures de semilla `2026-07`, `2026-08` y `2026-09` desde la página, reiniciar el proceso del servidor con la misma carpeta de historial y comprobar que la lista sigue mostrando los tres meses; SHALL recorrer también el 409 con «conservar» y «reemplazar». Ninguna prueba SHALL escribir en `historial/` del repositorio.

#### Scenario: Guardar, reiniciar y seguir ahí
- **WHEN** la prueba de sistema carga los tres fixtures, detiene el servidor y lo vuelve a arrancar con la misma carpeta de historial
- **THEN** la vista de historial lista julio, agosto y septiembre de 2026 con 2,000 transacciones cada uno y sus totales `$1,689,470.67`, `$1,544,622.78` y `$1,278,296.56`, y ninguna petición salió de 127.0.0.1

#### Scenario: Cargar otra vez un mes guardado
- **WHEN** la prueba carga otra vez `2026-07-semilla-1.csv`
- **THEN** la página pregunta si se reemplaza julio de 2026, y tanto conservar como reemplazar dejan el historial con un solo julio de 2026
