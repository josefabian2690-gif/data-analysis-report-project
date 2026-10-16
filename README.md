# Tablero de gastos

El objetivo del proyecto es una página web local en Node que cargue CSVs de transacciones del
generador y los convierta en un dashboard con filtros, historial de meses y reporte exportable,
sin red. Hoy el repositorio tiene el andamiaje: una página vacía con su gate de calidad, el
generador de datos y sus fixtures; el tablero se construye por fases (ver [`docs/`](docs/)).

## Instalación

El usuario instala las dependencias, con las versiones exactas del `package-lock.json`:

```bash
npm ci
```

## Scripts del gate

Se lanzan desde la raíz del repositorio; son los cuatro pasos del gate, en este orden:

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
