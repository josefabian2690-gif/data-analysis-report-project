import { defineConfig, devices } from '@playwright/test';

const puerto = '4173';
const origen = `http://127.0.0.1:${puerto}`;

export default defineConfig({
  testDir: 'tests/sistema',
  forbidOnly: true,
  use: { baseURL: origen },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm start',
    env: { TABLERO_SIN_NAVEGADOR: '1', TABLERO_PUERTO: puerto },
    url: origen,
    reuseExistingServer: false,
  },
});
