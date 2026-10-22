# Spec Delta

## Purpose

Detecta solos los patrones de gasto de R-16 sobre el conjunto que el analista está viendo, con su evidencia numérica y umbrales que el analista ajusta desde la pantalla, y comprueba con las semillas del generador que los patrones inyectados se encuentran.

## ADDED Requirements

### Requirement: Un hallazgo solo aparece si supera su umbral (R-16)
Cada hallazgo SHALL aparecer solo cuando su medida alcanza su umbral, con estos valores por defecto: categoría dominante 35 % del gasto, quincena 1.5, fin de semana 1.2, viaje 4 días consecutivos, atípicos 3 veces el percentil 99 de su categoría. La zona favorita no tiene umbral: aparece siempre que haya gasto de Comida o Entretenimiento en una zona local.

#### Scenario: Los seis hallazgos de la semilla 1
- **WHEN** se calculan los hallazgos de `tests/fixtures/generador/2026-07-semilla-1.csv` con los umbrales por defecto
- **THEN** hay categoría dominante, zona favorita, quincena, fin de semana, viaje y atípicos

#### Scenario: Sin transacciones
- **WHEN** se calculan los hallazgos de una lista vacía
- **THEN** no hay ningún hallazgo y no se produce ningún error ni valor no numérico

### Requirement: Categoría dominante (R-16)
La categoría con mayor monto SHALL ser hallazgo cuando su proporción del gasto total (R-12) es mayor o igual que el umbral; su evidencia SHALL ser la categoría, su monto y su proporción.

#### Scenario: Compras domina julio
- **WHEN** se calculan los hallazgos de la semilla 1
- **THEN** la categoría dominante es Compras con `$814,566.30` y 48.2 % del gasto

#### Scenario: Justo en el umbral
- **WHEN** una categoría concentra exactamente el 35 % del gasto
- **THEN** es categoría dominante, y con 34.9 % no lo es

### Requirement: Zona favorita (R-16)
La zona local con mayor monto en Comida y Entretenimiento juntas SHALL ser hallazgo; su evidencia SHALL ser la zona, ese monto y su proporción del gasto de Comida y Entretenimiento en zonas locales. Una zona local es una zona de la ciudad principal; `Sin zona` nunca es zona local.

#### Scenario: Centro Histórico en julio
- **WHEN** se calculan los hallazgos de la semilla 1
- **THEN** la zona favorita es `Centro Histórico, CDMX` con `$269,450.15` y 72.8 %

#### Scenario: El destino del viaje no compite
- **WHEN** la zona con más Comida y Entretenimiento está fuera de la ciudad principal
- **THEN** la zona favorita es la local con más gasto en esas categorías

#### Scenario: Sin Comida ni Entretenimiento
- **WHEN** el conjunto no tiene gasto de Comida ni de Entretenimiento en zonas locales
- **THEN** no hay hallazgo de zona favorita

### Requirement: Ciudad principal
La ciudad de una zona SHALL ser el texto tras su última coma, sin espacios a los lados, o la zona entera si no tiene coma; la ciudad principal SHALL ser la de mayor monto, con empate resuelto por nombre. `Sin zona` no pertenece a ninguna ciudad.

#### Scenario: CDMX es la ciudad principal de julio
- **WHEN** se calcula la ciudad principal de la semilla 1
- **THEN** es `CDMX`, y `Monterrey, N.L.` queda fuera de ella

#### Scenario: Zona sin coma
- **WHEN** las zonas no llevan coma
- **THEN** cada zona es su propia ciudad y la principal es la de mayor monto

### Requirement: Quincena (R-16)
El gasto promedio por día de los días de quincena y post-quincena (R-13), dividido entre el promedio por día del resto de los días del periodo, SHALL ser hallazgo cuando es mayor o igual que su umbral. Los promedios cuentan los días naturales del periodo aunque no tengan gasto; si alguno de los dos grupos no tiene días o su promedio es 0, no hay hallazgo.

#### Scenario: La quincena de julio
- **WHEN** se calculan los hallazgos de la semilla 1
- **THEN** hay hallazgo de quincena con una razón de 2.83

#### Scenario: Periodo sin días de quincena
- **WHEN** el periodo del filtro es del 2 al 10 de julio
- **THEN** no hay hallazgo de quincena y no hay división entre cero

### Requirement: Fin de semana (R-16)
El gasto promedio por día de viernes a domingo (R-14), dividido entre el de lunes a jueves, sobre los días naturales del periodo, SHALL ser hallazgo cuando es mayor o igual que su umbral; si alguno de los dos grupos no tiene días o su promedio es 0, no hay hallazgo.

#### Scenario: El fin de semana de julio
- **WHEN** se calculan los hallazgos de la semilla 1
- **THEN** hay hallazgo de fin de semana con una razón de 1.67

#### Scenario: Semilla 3 apenas sobre el umbral
- **WHEN** se calculan los hallazgos de `2026-09-semilla-3.csv`
- **THEN** hay hallazgo de fin de semana con una razón de 1.25, y con umbral 1.3 no lo hay

### Requirement: Viaje (R-16)
Cada zona fuera de la ciudad principal cuyo gasto cae en un tramo de días, del primero al último con gasto, de longitud menor o igual que el umbral SHALL ser hallazgo de viaje, con la zona como destino, el primer y el último día y su monto. Solo cuentan los días dentro del mes.

#### Scenario: Monterrey en julio
- **WHEN** se calculan los hallazgos de la semilla 1
- **THEN** hay un viaje a `Monterrey, N.L.` del 24 al 26 de julio de 2026 con `$276,744.96`

#### Scenario: Gasto disperso fuera de la ciudad
- **WHEN** una zona fuera de la ciudad principal tiene gasto el día 2 y el día 20
- **THEN** no es viaje

#### Scenario: Cinco días con umbral 4
- **WHEN** una zona fuera de la ciudad principal tiene gasto del 10 al 14
- **THEN** no es viaje con el umbral por defecto, y sí con umbral 5

### Requirement: Atípicos (R-16)
Una transacción SHALL ser atípica cuando su monto es mayor que el umbral multiplicado por el percentil 99 de los montos de su categoría (rango más cercano: el valor en la posición ⌈0.99·n⌉ de los montos ordenados). Habrá hallazgo si hay al menos una, con su cuenta y las transacciones de mayor a menor monto.

#### Scenario: Dos atípicos en julio
- **WHEN** se calculan los hallazgos de la semilla 1
- **THEN** hay 2 atípicos y el mayor es `TX001575`, Tour guiado Aguilera, `$10,795.88`

#### Scenario: Igual al límite no es atípico
- **WHEN** un monto es exactamente 3 veces el percentil 99 de su categoría
- **THEN** no es atípico

### Requirement: Test de semillas
Para cada fixture de `tests/fixtures/generador/`, los hallazgos con los umbrales por defecto SHALL coincidir con su `*.esperado.json` en la categoría dominante, la zona favorita y el viaje (destino, primer y último día).

#### Scenario: Las tres semillas
- **WHEN** se calculan los hallazgos de cada fixture del generador
- **THEN** `categoriaDominante`, `zonaFavorita` y `viaje` (`destino`, `desde`, `hasta`) coinciden con su esperado

### Requirement: Panel de hallazgos en la página
Tras una carga aceptada, la página SHALL mostrar tras los KPIs una sección de hallazgos con nombre accesible, un elemento por hallazgo con un texto es-MX y su evidencia en el formato de R-17, y un mensaje cuando ningún hallazgo supera su umbral.

#### Scenario: Hallazgos de julio en pantalla
- **WHEN** el analista carga la semilla 1
- **THEN** ve la categoría dominante Compras con 48.2 %, la zona favorita `Centro Histórico, CDMX`, el viaje a `Monterrey, N.L.` del 24/07/2026 al 26/07/2026 y 2 atípicos con el mayor en `$10,795.88`

#### Scenario: Ningún hallazgo
- **WHEN** los umbrales dejan sin hallazgos el conjunto visible
- **THEN** la sección dice que ningún patrón supera su umbral

### Requirement: Umbrales ajustables desde la pantalla
La sección de hallazgos SHALL ofrecer un control con nombre accesible por umbral (categoría dominante en %, quincena, fin de semana, días de viaje y factor de atípicos), con su valor por defecto; al cambiar uno, los hallazgos SHALL recalcularse con él. Un control SHALL permitir restablecer todos los valores por defecto.

#### Scenario: Subir el umbral de la dominante
- **WHEN** con la semilla 1 el analista pone el umbral de categoría dominante en 50
- **THEN** el hallazgo de categoría dominante desaparece y los demás siguen

#### Scenario: Restablecer
- **WHEN** el analista restablece los umbrales
- **THEN** cada control vuelve a su valor por defecto y la categoría dominante reaparece

### Requirement: Umbral inválido
Un valor de umbral vacío, no numérico, menor o igual que 0, o mayor que 100 en el porcentaje de la dominante, SHALL no aplicarse ni guardarse: el control SHALL marcarse inválido con un mensaje y los hallazgos SHALL seguir con el último valor válido.

#### Scenario: Umbral vacío
- **WHEN** el analista borra el umbral de fin de semana
- **THEN** el control se marca inválido, ve el mensaje, el hallazgo de fin de semana sigue como estaba y el valor guardado no cambia

### Requirement: Los umbrales se conservan en el navegador
Los umbrales ajustados SHALL guardarse en el almacenamiento local del navegador al cambiar o restablecerse, y SHALL leerse de ahí al abrir la página: sobreviven a cargar otro CSV, a recargar la página y a reiniciar el servidor, solo en ese navegador. Ninguna petición SHALL llevarlos.

#### Scenario: Otro CSV conserva los umbrales
- **WHEN** el analista sube el umbral de la dominante a 50 y carga `2026-08-semilla-2.csv`
- **THEN** el control sigue en 50 y Entretenimiento, con 54.8 %, aparece como dominante

#### Scenario: Recargar la página conserva los umbrales
- **WHEN** el analista sube el umbral de la dominante a 50, recarga la página y vuelve a cargar la semilla 1
- **THEN** el control sigue en 50, no hay hallazgo de categoría dominante y ninguna petición llevó los umbrales

#### Scenario: Restablecer también se guarda
- **WHEN** el analista restablece los umbrales y recarga la página
- **THEN** los controles muestran los valores por defecto

### Requirement: Umbrales guardados inválidos
Al leer los umbrales guardados, cada umbral ausente, de otro tipo o fuera de rango SHALL tomar su valor por defecto, y los válidos SHALL conservarse; un valor guardado que no se puede leer SHALL dar todos los valores por defecto, sin errores.

#### Scenario: Guardado ilegible
- **WHEN** lo guardado no es JSON
- **THEN** los controles muestran los valores por defecto y la página funciona

#### Scenario: Un umbral guardado fuera de rango
- **WHEN** lo guardado trae fin de semana -1 y quincena 2
- **THEN** fin de semana vale 1.2 y quincena 2

### Requirement: Navegador sin almacenamiento
Si el almacenamiento local no está disponible o falla al leer o escribir, la página SHALL funcionar igual, con los umbrales ajustables durante la sesión, sin mostrar errores.

#### Scenario: Escritura que falla
- **WHEN** el almacenamiento rechaza la escritura y el analista sube el umbral de la dominante a 50
- **THEN** el hallazgo de categoría dominante desaparece y no hay ningún error en la página
