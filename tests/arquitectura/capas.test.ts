import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const configuracionReal = join(dirname(fileURLToPath(import.meta.url)), '../../eslint.config.mjs');
const REGLA_DE_CAPAS = 'import/no-restricted-paths';

const capas = ['dominio', 'graficas', 'reporte', 'cliente', 'servidor'] as const;
type Capa = (typeof capas)[number];
const capasPuras = ['dominio', 'graficas', 'reporte'] as const;

// Tabla de capas de docs/ARQUITECTURA.md: de quién puede importar cada capa del proyecto.
const puedeImportar: Record<Capa, readonly Capa[]> = {
  dominio: [],
  graficas: ['dominio'],
  reporte: ['dominio', 'graficas'],
  cliente: ['dominio', 'graficas', 'reporte'],
  servidor: ['dominio'],
};

const pares = capas.flatMap((origen) =>
  capas
    .filter((destino) => destino !== origen)
    .map((destino) => ({ origen, destino, permitido: puedeImportar[origen].includes(destino) })),
);
const prohibidos = pares.filter((par) => !par.permitido);
const permitidos = pares.filter((par) => par.permitido);

let raizAnterior: string;
let arbol: string;
let eslint: ESLint;

async function lintar(capa: Capa, codigo: string, extension = 'ts') {
  const [resultado] = await eslint.lintText(codigo, {
    filePath: join(arbol, 'src', capa, `archivo-de-prueba.${extension}`),
  });
  return resultado?.messages ?? [];
}

async function reglasQueFallan(capa: Capa, codigo: string, extension = 'ts') {
  return (await lintar(capa, codigo, extension)).map((mensaje) => mensaje.ruleId);
}

beforeAll(async () => {
  raizAnterior = process.cwd();
  arbol = realpathSync(mkdtempSync(join(tmpdir(), 'tablero-capas-')));
  writeFileSync(
    join(arbol, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler' } }),
  );
  writeFileSync(join(arbol, 'package.json'), JSON.stringify({ name: 'arbol-de-prueba' }));
  const modulo = 'export const valor = 1;\n';
  for (const carpeta of [...capas, 'otra']) {
    mkdirSync(join(arbol, 'src', carpeta), { recursive: true });
    writeFileSync(join(arbol, 'src', carpeta, 'destino.ts'), modulo);
  }
  mkdirSync(join(arbol, 'tests'));
  writeFileSync(join(arbol, 'tests', 'destino.ts'), modulo);
  writeFileSync(join(arbol, 'vite.config.mts'), modulo);
  mkdirSync(join(arbol, 'node_modules', 'papaparse'), { recursive: true });
  writeFileSync(
    join(arbol, 'node_modules', 'papaparse', 'package.json'),
    JSON.stringify({ name: 'papaparse', main: 'index.js' }),
  );
  writeFileSync(join(arbol, 'node_modules', 'papaparse', 'index.js'), 'module.exports = {};\n');
  mkdirSync(join(arbol, 'node_modules', 'echarts'), { recursive: true });
  writeFileSync(
    join(arbol, 'node_modules', 'echarts', 'package.json'),
    JSON.stringify({ name: 'echarts', main: 'index.js' }),
  );
  for (const archivo of ['index.js', 'core.js', 'charts.js']) {
    writeFileSync(join(arbol, 'node_modules', 'echarts', archivo), 'module.exports = {};\n');
  }
  process.chdir(arbol);
  eslint = new ESLint({ cwd: arbol, overrideConfigFile: configuracionReal });
  await lintar('dominio', '');
}, 60_000);

afterAll(() => {
  process.chdir(raizAnterior);
  rmSync(arbol, { recursive: true, force: true });
});

describe('capas: imports entre capas', () => {
  it.each(prohibidos)('$origen no puede importar de $destino', async ({ origen, destino }) => {
    const reglas = await reglasQueFallan(
      origen,
      `import { valor } from '../${destino}/destino';\nexport const eco = valor;\n`,
    );

    expect(reglas).toContain(REGLA_DE_CAPAS);
  });

  it.each(permitidos)('$origen puede importar de $destino', async ({ origen, destino }) => {
    const reglas = await reglasQueFallan(
      origen,
      `import { valor } from '../${destino}/destino';\nexport const eco = valor;\n`,
    );

    expect(reglas).toEqual([]);
  });
});

describe('capas: solo se importa de sí misma y de las capas permitidas', () => {
  const ajenos = [
    ['src/otra, que no es ninguna capa', '../otra/destino'],
    ['tests/', '../../tests/destino'],
    ['un archivo de configuración de la raíz', '../../vite.config.mts'],
  ] as const;
  const casos = capas.flatMap((capa) => ajenos.map(([ajeno, ruta]) => ({ capa, ajeno, ruta })));

  it.each(casos)('$capa no puede importar de $ajeno', async ({ capa, ruta }) => {
    const reglas = await reglasQueFallan(
      capa,
      `import { valor } from '${ruta}';\nexport const eco = valor;\n`,
    );

    expect(reglas).toContain(REGLA_DE_CAPAS);
  });

  it.each(capas)('%s puede importar de su propia capa', async (capa) => {
    const reglas = await reglasQueFallan(
      capa,
      `import { valor } from './destino';\nexport const eco = valor;\n`,
    );

    expect(reglas).toEqual([]);
  });

  it('dominio puede importar papaparse, un paquete de npm', async () => {
    const reglas = await reglasQueFallan(
      'dominio',
      `import papaparse from 'papaparse';\nexport const eco = papaparse;\n`,
    );

    expect(reglas).toEqual([]);
  });
});

describe('capas: aplican a todo archivo de código de src', () => {
  const modulos = ['ts', 'tsx', 'mts', 'js', 'jsx', 'mjs'];
  const todos = [...modulos, 'cts', 'cjs'];

  it.each(modulos)('un .%s de dominio no puede importar de cliente', async (extension) => {
    const reglas = await reglasQueFallan(
      'dominio',
      `import { valor } from '../cliente/destino';\nexport const eco = valor;\n`,
      extension,
    );

    expect(reglas).toContain(REGLA_DE_CAPAS);
  });

  it.each(todos)('un .%s de dominio no puede llamar Date.now()', async (extension) => {
    const reglas = await reglasQueFallan('dominio', `const t = Date.now();\n`, extension);

    expect(reglas).toContain('no-restricted-properties');
  });
});

describe('capas puras: sin I/O', () => {
  const infracciones = [
    [
      'importar node:fs',
      'import/no-nodejs-modules',
      `import { readFileSync } from 'node:fs';\nexport const f = readFileSync;\n`,
    ],
    ['llamar fetch', 'no-restricted-globals', `export const r = fetch('/api/meses');\n`],
    ['usar window', 'no-restricted-globals', `export const w = window.innerWidth;\n`],
    ['usar document', 'no-restricted-globals', `export const d = document.title;\n`],
    ['usar localStorage', 'no-restricted-globals', `export const l = localStorage.length;\n`],
    [
      'leer process.env',
      'no-restricted-globals',
      `export const e = process.env.TABLERO_HISTORIAL;\n`,
    ],
    ['llamar process.hrtime()', 'no-restricted-globals', `export const t = process.hrtime();\n`],
    [
      'leer el entorno por un alias de process',
      'no-restricted-globals',
      `const p = process;\nexport const e = p.env;\n`,
    ],
    ['llamar Date.now()', 'no-restricted-properties', `export const t = Date.now();\n`],
    [
      'construir new Date() sin argumentos',
      'no-restricted-syntax',
      `export const t = new Date();\n`,
    ],
    ['llamar Date()', 'no-restricted-syntax', `export const t = Date();\n`],
    ['leer import.meta.env', 'no-restricted-syntax', `export const e = import.meta.env;\n`],
    [
      'desestructurar import.meta',
      'no-restricted-syntax',
      `const { env } = import.meta;\nexport const e = env;\n`,
    ],
    ['leer import.meta["env"]', 'no-restricted-syntax', `export const e = import.meta['env'];\n`],
    ['llamar performance.now()', 'no-restricted-globals', `export const t = performance.now();\n`],
    [
      'llamar globalThis.fetch',
      'no-restricted-globals',
      `export const r = globalThis.fetch('/x');\n`,
    ],
    [
      'construir new globalThis.Date()',
      'no-restricted-globals',
      `export const t = new globalThis.Date();\n`,
    ],
    [
      'llamar globalThis.Date.now()',
      'no-restricted-globals',
      `export const t = globalThis.Date.now();\n`,
    ],
    [
      'leer globalThis.process.env',
      'no-restricted-globals',
      `export const e = globalThis.process.env;\n`,
    ],
    ['usar self', 'no-restricted-globals', `export const s = self.name;\n`],
    ['usar global', 'no-restricted-globals', `export const g = global.process;\n`],
    ['leer navigator.language', 'no-restricted-globals', `export const l = navigator.language;\n`],
    ['usar sessionStorage', 'no-restricted-globals', `export const l = sessionStorage.length;\n`],
    ['usar indexedDB', 'no-restricted-globals', `export const d = indexedDB.name;\n`],
    [
      'construir new XMLHttpRequest()',
      'no-restricted-globals',
      `export const x = new XMLHttpRequest();\n`,
    ],
    [
      'construir new WebSocket()',
      'no-restricted-globals',
      `export const w = new WebSocket('ws://x');\n`,
    ],
    ['leer location', 'no-restricted-globals', `export const h = location.href;\n`],
  ] as const;

  const casos = capasPuras.flatMap((capa) =>
    infracciones.map(([accion, regla, codigo]) => ({ capa, accion, regla, codigo })),
  );

  it.each(casos)('$capa no puede $accion', async ({ capa, regla, codigo }) => {
    const reglas = await reglasQueFallan(capa, codigo);

    expect(reglas).toContain(regla);
  });

  it.each(capasPuras)('%s puede parsear una fecha con argumentos', async (capa) => {
    const reglas = await reglasQueFallan(capa, `export const t = new Date('2026-07-01');\n`);

    expect(reglas).toEqual([]);
  });

  it.each(['cliente', 'servidor'] as const)(
    '%s no tiene la restricción de pureza',
    async (capa) => {
      const reglas = await reglasQueFallan(
        capa,
        `export const t = [fetch, Date.now(), new Date(), Date(), process.env, globalThis, performance, navigator];\n`,
      );

      expect(reglas).toEqual([]);
    },
  );

  it('servidor puede importar node:fs', async () => {
    const reglas = await reglasQueFallan(
      'servidor',
      `import { readFileSync } from 'node:fs';\nexport const f = readFileSync;\n`,
    );

    expect(reglas).toEqual([]);
  });
});

describe('graficas: de echarts solo se importan tipos', () => {
  const REGLA_DE_IMPORTS = '@typescript-eslint/no-restricted-imports';
  const valores = [
    ['importar un valor de echarts', `import { init } from 'echarts';\nexport const f = init;\n`],
    [
      'importar el módulo entero de echarts',
      `import * as echarts from 'echarts';\nexport const f = echarts;\n`,
    ],
    [
      'importar el default de echarts',
      `import echarts from 'echarts';\nexport const f = echarts;\n`,
    ],
    [
      'importar un valor de echarts/core',
      `import { use } from 'echarts/core';\nexport const f = use;\n`,
    ],
    [
      'importar un valor de echarts/charts',
      `import { BarChart } from 'echarts/charts';\nexport const f = BarChart;\n`,
    ],
    [
      'importar un valor con import { type X, valor }',
      `import { type EChartsOption, init } from 'echarts';\nexport const f: EChartsOption = init;\n`,
    ],
    ['importar solo por efecto de echarts/core', `import 'echarts/core';\n`],
    ['reexportar todo de echarts', `export * from 'echarts';\n`],
    ['reexportar un valor de echarts', `export { init } from 'echarts';\n`],
  ] as const;

  it.each(valores)('graficas no puede %s', async (_accion, codigo) => {
    const reglas = await reglasQueFallan('graficas', codigo);

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it.each([
    ['import(echarts)', `export const f = () => import('echarts');\n`],
    ['import(`echarts`)', 'export const f = () => import(`echarts`);\n'],
    ['import(echarts/core)', `export const f = () => import('echarts/core');\n`],
  ])('graficas no puede cargar %s de forma dinámica', async (_accion, codigo) => {
    const reglas = await reglasQueFallan('graficas', codigo);

    expect(reglas).toContain('no-restricted-syntax');
  });

  it.each([
    [
      'import type { X } from echarts',
      `import type { EChartsOption } from 'echarts';\nexport type F = EChartsOption;\n`,
    ],
    [
      'import { type X } from echarts',
      `import { type EChartsOption } from 'echarts';\nexport type F = EChartsOption;\n`,
    ],
    [
      'import type X from echarts/core',
      `import type Core from 'echarts/core';\nexport type F = Core;\n`,
    ],
    [
      'import type { X } from echarts/charts',
      `import type { BarSeriesOption } from 'echarts/charts';\nexport type F = BarSeriesOption;\n`,
    ],
  ])('graficas puede usar %s', async (_accion, codigo) => {
    const reglas = await reglasQueFallan('graficas', codigo);

    expect(reglas).toEqual([]);
  });

  it.each(['dominio', 'reporte', 'servidor'] as const)(
    '%s no queda sujeta a esta regla de echarts',
    async (capa) => {
      const reglas = await reglasQueFallan(
        capa,
        `import { init } from 'echarts';\nexport const f = init;\n`,
      );

      expect(reglas).not.toContain('@typescript-eslint/no-restricted-imports');
    },
  );

  it('cliente puede importar valores de echarts y de sus subrutas', async () => {
    const reglas = await reglasQueFallan(
      'cliente',
      [
        `import { init, use } from 'echarts/core';`,
        `import { BarChart } from 'echarts/charts';`,
        `import * as echarts from 'echarts';`,
        `export const f = [init, use, BarChart, echarts];`,
        '',
      ].join('\n'),
    );

    expect(reglas).toEqual([]);
  });

  it('graficas conserva la pureza: Date.now() sigue fallando junto a la regla de echarts', async () => {
    const reglas = await reglasQueFallan('graficas', `export const t = Date.now();\n`);

    expect(reglas).toContain('no-restricted-properties');
  });
});
