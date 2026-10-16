# Tablero de gastos

Página web local en Node que carga CSVs de transacciones del generador y los convierte en un
dashboard con filtros, historial de meses y reporte exportable. Funciona sin red: el servidor
escucha solo en `127.0.0.1` y todos los recursos van en el paquete.

La documentación del proyecto está en [`docs/`](docs/).

## Instalación

El usuario instala las dependencias, con las versiones exactas del `package-lock.json`:

```bash
npm ci
```

## Scripts del gate

Se lanzan desde la raíz del repositorio y el gate los corre en este orden:

| Comando                | Qué comprueba                  |
| ---------------------- | ------------------------------ |
| `npm run format:check` | El formato (Prettier)          |
| `npm run lint`         | ESLint, incluidas las capas    |
| `npm run typecheck`    | Los tipos de TypeScript        |
| `npm test`             | Las pruebas unitarias (Vitest) |

## Generador de datos

Los CSV de ejemplo y los fixtures de las pruebas los produce un generador de Python que vive aparte
en [`generador/`](generador/README.md); su README explica cómo usarlo y cómo regenerar los fixtures
con `generador/fixtures.sh`.
