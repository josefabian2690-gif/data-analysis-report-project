import { defineConfig, devices } from '@playwright/test';

const origen = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: 'tests/sistema',
  forbidOnly: true,
  use: { baseURL: origen },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: './node_modules/.bin/vite preview',
    url: origen,
    reuseExistingServer: false,
  },
});
