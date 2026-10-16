import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

// Tabla de capas de docs/ARQUITECTURA.md: de qué capas del proyecto puede importar cada una.
/** @type {Record<string, string[]>} */
const puedeImportar = {
  dominio: [],
  graficas: ['dominio'],
  reporte: ['dominio', 'graficas'],
  cliente: ['dominio', 'graficas', 'reporte'],
  servidor: ['dominio'],
};
const capasPuras = ['dominio', 'graficas', 'reporte'];
const extensionesDeCodigo = 'js,jsx,mjs,cjs,ts,tsx,mts,cts';
/** @param {string} capa */
const rutaDeCapa = (capa) => `./src/${capa}`;

const zonasDeCapas = Object.entries(puedeImportar).map(([capa, permitidas]) => ({
  target: rutaDeCapa(capa),
  from: '.',
  except: [...[capa, ...permitidas].map(rutaDeCapa), './node_modules'],
  message:
    'Una capa solo importa de sí misma y de las que su fila de docs/ARQUITECTURA.md permite; de ningún otro archivo del proyecto.',
}));

const sinIo = 'Las capas puras no hacen I/O (docs/STACK.md, regla innegociable 1).';
const sinAliasGlobal = `${sinIo} Tampoco por un alias del objeto global.`;

const globalesProhibidos = [
  ...['fetch', 'window', 'document', 'localStorage', 'sessionStorage', 'indexedDB'],
  ...['XMLHttpRequest', 'WebSocket', 'location', 'navigator', 'performance', 'process'],
].map((name) => ({ name, message: sinIo }));
const aliasesDelGlobal = ['globalThis', 'self', 'global'].map((name) => ({
  name,
  message: sinAliasGlobal,
}));

export default defineConfig(
  {
    ignores: [
      '.claude/',
      'openspec/',
      'docs/',
      'graft/',
      'generador/',
      '.venv/',
      'output/',
      'historial/',
      'dist/',
      'tests/fixtures/generador/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: [`src/**/*.{${extensionesDeCodigo}}`],
    plugins: { import: importPlugin },
    settings: { 'import/resolver': { typescript: { alwaysTryTypes: true } } },
    rules: {
      'import/no-restricted-paths': ['error', { zones: zonasDeCapas }],
    },
  },
  {
    files: capasPuras.map((capa) => `src/${capa}/**/*.{${extensionesDeCodigo}}`),
    rules: {
      'import/no-nodejs-modules': 'error',
      'no-restricted-globals': ['error', ...globalesProhibidos, ...aliasesDelGlobal],
      'no-restricted-properties': ['error', { object: 'Date', property: 'now', message: sinIo }],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: sinIo },
        { selector: "CallExpression[callee.name='Date']", message: sinIo },
        { selector: "MetaProperty[meta.name='import']", message: sinIo },
      ],
    },
  },
  {
    files: [`tests/sistema/**/*.{${extensionesDeCodigo}}`],
    ignores: ['tests/sistema/sin-red.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test'],
              message:
                'Importa test de ./sin-red: así toda prueba de sistema vigila que ninguna petición salga de 127.0.0.1 (docs/STACK.md, «Sin red en ejecución»).',
            },
          ],
        },
      ],
    },
  },
);
