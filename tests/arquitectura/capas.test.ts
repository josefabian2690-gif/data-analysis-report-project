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

async function lintar(capa: Capa, codigo: string) {
  const [resultado] = await eslint.lintText(codigo, {
    filePath: join(arbol, 'src', capa, 'archivo-de-prueba.ts'),
  });
  return resultado?.messages ?? [];
}

async function reglasQueFallan(capa: Capa, codigo: string) {
  return (await lintar(capa, codigo)).map((mensaje) => mensaje.ruleId);
}

beforeAll(async () => {
  raizAnterior = process.cwd();
  arbol = realpathSync(mkdtempSync(join(tmpdir(), 'tablero-capas-')));
  writeFileSync(
    join(arbol, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { module: 'ESNext', moduleResolution: 'Bundler' } }),
  );
  for (const capa of capas) {
    mkdirSync(join(arbol, 'src', capa), { recursive: true });
    writeFileSync(join(arbol, 'src', capa, 'destino.ts'), 'export const valor = 1;\n');
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
      'no-restricted-properties',
      `export const e = process.env.TABLERO_HISTORIAL;\n`,
    ],
    ['llamar Date.now()', 'no-restricted-properties', `export const t = Date.now();\n`],
    [
      'construir new Date() sin argumentos',
      'no-restricted-syntax',
      `export const t = new Date();\n`,
    ],
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
        `export const t = [fetch, Date.now(), new Date(), process.env];\n`,
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
