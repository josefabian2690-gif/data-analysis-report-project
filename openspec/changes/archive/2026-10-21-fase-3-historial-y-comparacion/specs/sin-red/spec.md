# Spec Delta

## ADDED Requirements

### Requirement: Las peticiones tardías también se vigilan
La vigilancia de la suite de sistema SHALL evaluar también las peticiones que la página dispara después de la última aserción de la prueba: antes de decidir, SHALL esperar a que no quede ninguna petición en vuelo, de modo que una petición a otro host lanzada tras el cuerpo de la prueba la haga fallar.

#### Scenario: Una petición externa después de la última aserción
- **WHEN** la página lanza una petición a otro host poco después de que la prueba termine sus aserciones
- **THEN** la prueba de sistema falla y nombra la URL externa
