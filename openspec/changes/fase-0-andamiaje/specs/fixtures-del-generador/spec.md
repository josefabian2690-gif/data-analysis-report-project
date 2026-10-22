# Spec Delta

## Purpose

Mantiene el generador de Python como herramienta aparte en `generador/` y define los fixtures con semilla que el tablero usa en sus tests y demos, con una respuesta esperada que es observable en los propios datos.

## ADDED Requirements

### Requirement: El generador vive en generador/ sin cambios de lógica
El generador SHALL vivir en `generador/` con el mismo comportamiento que tenía en la raíz: con los mismos argumentos y la misma semilla produce byte a byte el mismo CSV.

#### Scenario: Misma semilla tras la mudanza
- **WHEN** se ejecuta el generador desde `generador/` con `-n 2000 --mes 2026-07 --semilla N` y se compara con la salida del generador original con los mismos argumentos
- **THEN** los dos CSV son idénticos

### Requirement: Los fixtures se regeneran con un solo script
`generador/fixtures.sh` SHALL regenerar todos los fixtures del generador y su respuesta esperada, de forma determinista, y SHALL ser el único lugar del repositorio que ejecuta el generador.

#### Scenario: Regenerar no cambia nada
- **WHEN** se corre `generador/fixtures.sh` sobre un árbol limpio
- **THEN** `git status` no muestra cambios en `tests/fixtures/`

#### Scenario: Falta un Python con Faker
- **WHEN** se corre `generador/fixtures.sh` y el intérprete configurado no puede importar Faker
- **THEN** el script termina con código distinto de cero y un mensaje que dice cómo indicar el intérprete, sin dejar fixtures a medio escribir

### Requirement: Tres fixtures con semilla, de meses distintos
El repositorio SHALL incluir tres CSV del generador de 2 000 filas cada uno, con semillas distintas y de tres meses calendario distintos, cada uno acompañado de su `*.esperado.json` con la respuesta que el generador imprime con `-v`: categoría dominante, zona favorita, casa, trabajo, destino y días del viaje, y días de quincena.

#### Scenario: Tres meses para el historial
- **WHEN** se listan los fixtures del generador
- **THEN** hay exactamente tres CSV, cada uno con 2 000 filas de datos, y sus meses (`AAAA-MM`) son distintos entre sí

#### Scenario: Cada CSV tiene su respuesta
- **WHEN** se abre el `*.esperado.json` de un fixture
- **THEN** contiene la semilla, el mes y los patrones de `-v`, con los mismos valores que imprime el generador para esa semilla

### Requirement: La respuesta esperada es observable en los datos
Para cada fixture del generador, los patrones de su `*.esperado.json` SHALL ser observables en su CSV según las definiciones de `docs/DOMINIO.md` (R-16), y un test del gate SHALL comprobarlo.

#### Scenario: Categoría dominante
- **WHEN** se suma el monto por categoría del CSV
- **THEN** la categoría con mayor gasto es la `categoria_dominante` del esperado y concentra al menos el 35 % del gasto

#### Scenario: Zona favorita
- **WHEN** se suma el monto de Comida y Entretenimiento por zona local (las de la ciudad principal)
- **THEN** la zona con mayor gasto es la `zona_favorita` del esperado

#### Scenario: Viaje
- **WHEN** se toman las transacciones cuya zona es el destino del esperado
- **THEN** todas caen en a lo sumo 4 días consecutivos, dentro del rango de días del viaje del esperado

#### Scenario: Una semilla cuyo patrón no se ve
- **WHEN** un fixture se regenera con una semilla cuya zona favorita inyectada no es la de mayor gasto en Comida y Entretenimiento
- **THEN** el test de integridad falla y nombra el fixture y el patrón
