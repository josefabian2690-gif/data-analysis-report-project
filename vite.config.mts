import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

const servidorLocal = { host: '127.0.0.1', strictPort: true } as const;

export default defineConfig({
  plugins: [react()],
  server: { ...servidorLocal, port: 5173 },
  preview: { ...servidorLocal, port: 4173 },
  test: {
    projects: [
      {
        test: {
          name: 'cliente',
          environment: 'jsdom',
          include: ['tests/cliente/**/*.test.{ts,tsx}'],
          setupFiles: ['tests/preparar-cliente.ts'],
        },
      },
      {
        test: {
          name: 'nucleo',
          environment: 'node',
          include: ['tests/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, 'tests/cliente/**', 'tests/sistema/**'],
        },
      },
    ],
  },
});
