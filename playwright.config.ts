import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const puerto = '4173';
const origen = `http://127.0.0.1:${puerto}`;

// Playwright evalúa este archivo en su proceso principal y otra vez en cada worker, que heredan
// el entorno: la primera evaluación crea la carpeta del historial y la anota aquí, y las demás
// la reutilizan sin tocarla. Así cada corrida empieza con una carpeta vacía y ninguna evaluación
// posterior borra la de un servidor ya arrancado. Los meses guardados por la suite nunca caen en
// el `historial/` del repositorio (docs/ARQUITECTURA.md, «Almacenamiento»).
const CARPETA_DE_LA_CORRIDA = 'TABLERO_HISTORIAL_SISTEMA';

function carpetaDelHistorial(): string {
  const existente = process.env[CARPETA_DE_LA_CORRIDA];
  if (existente !== undefined) return existente;
  const carpeta = realpathSync(mkdtempSync(join(tmpdir(), 'tablero-sistema-historial-')));
  process.env[CARPETA_DE_LA_CORRIDA] = carpeta;
  process.once('exit', () => rmSync(carpeta, { recursive: true, force: true }));
  return carpeta;
}

export default defineConfig({
  testDir: 'tests/sistema',
  forbidOnly: true,
  use: { baseURL: origen },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    env: {
      TABLERO_SIN_NAVEGADOR: '1',
      TABLERO_PUERTO: puerto,
      TABLERO_HISTORIAL: carpetaDelHistorial(),
    },
    url: origen,
    reuseExistingServer: false,
  },
});
