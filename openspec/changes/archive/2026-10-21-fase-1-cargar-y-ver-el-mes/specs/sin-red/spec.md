# Spec Delta

## ADDED Requirements

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
