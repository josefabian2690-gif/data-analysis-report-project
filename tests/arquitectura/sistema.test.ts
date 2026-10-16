import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const configuracionReal = join(dirname(fileURLToPath(import.meta.url)), '../../eslint.config.mjs');
const REGLA_DE_IMPORTS = 'no-restricted-imports';

let raizAnterior: string;
let arbol: string;
let eslint: ESLint;

async function reglasQueFallan(archivo: string, codigo: string) {
  const [resultado] = await eslint.lintText(codigo, { filePath: join(arbol, archivo) });
  return (resultado?.messages ?? []).map((mensaje) => mensaje.ruleId);
}

beforeAll(async () => {
  raizAnterior = process.cwd();
  arbol = realpathSync(mkdtempSync(join(tmpdir(), 'tablero-sistema-')));
  writeFileSync(join(arbol, 'package.json'), JSON.stringify({ name: 'arbol-de-prueba' }));
  mkdirSync(join(arbol, 'tests', 'sistema'), { recursive: true });
  process.chdir(arbol);
  eslint = new ESLint({ cwd: arbol, overrideConfigFile: configuracionReal });
  await reglasQueFallan('tests/sistema/calentamiento.spec.ts', '');
}, 60_000);

afterAll(() => {
  process.chdir(raizAnterior);
  rmSync(arbol, { recursive: true, force: true });
});

describe('suite de sistema: toda spec lleva la vigilancia de peticiones', () => {
  const importaTestDePlaywright = `import { test } from '@playwright/test';\ntest('x', async () => {});\n`;

  it('una spec no puede importar test de @playwright/test', async () => {
    const reglas = await reglasQueFallan('tests/sistema/flujo.spec.ts', importaTestDePlaywright);

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec no puede importar test de @playwright/test con otro nombre', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import { test as probar } from '@playwright/test';\nprobar('x', async () => {});\n`,
    );

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec puede importar test de ./sin-red', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import { expect, test } from './sin-red';\ntest('x', async () => { expect(1).toBe(1); });\n`,
    );

    expect(reglas).toEqual([]);
  });

  it('una spec puede importar tipos y expect de @playwright/test', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import { expect } from '@playwright/test';\nexport const e = expect;\n`,
    );

    expect(reglas).toEqual([]);
  });

  it('sin-red.ts sí puede importar test de @playwright/test, porque lo extiende', async () => {
    const reglas = await reglasQueFallan('tests/sistema/sin-red.ts', importaTestDePlaywright);

    expect(reglas).toEqual([]);
  });
});
