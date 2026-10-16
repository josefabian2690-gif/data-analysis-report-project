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
const capas = Object.keys(puedeImportar);
const capasPuras = ['dominio', 'graficas', 'reporte'];
/** @param {string} capa */
const rutaDeCapa = (capa) => `./src/${capa}`;

const zonasDeCapas = Object.entries(puedeImportar).map(([capa, permitidas]) => ({
  target: rutaDeCapa(capa),
  from: capas.filter((otra) => otra !== capa && !permitidas.includes(otra)).map(rutaDeCapa),
  message: 'Una capa solo importa de las que su fila de docs/ARQUITECTURA.md permite.',
}));

const sinIo = 'Las capas puras no hacen I/O (docs/STACK.md, regla innegociable 1).';

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
    files: ['src/**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    settings: { 'import/resolver': { typescript: { alwaysTryTypes: true } } },
    rules: {
      'import/no-restricted-paths': ['error', { zones: zonasDeCapas }],
    },
  },
  {
    files: capasPuras.map((capa) => `src/${capa}/**/*.{ts,tsx}`),
    rules: {
      'import/no-nodejs-modules': 'error',
      'no-restricted-globals': [
        'error',
        ...['fetch', 'window', 'document', 'localStorage'].map((name) => ({
          name,
          message: sinIo,
        })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'env', message: sinIo },
        { object: 'Date', property: 'now', message: sinIo },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: sinIo,
        },
      ],
    },
  },
);
