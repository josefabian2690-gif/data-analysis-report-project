import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const configuracionReal = join(dirname(fileURLToPath(import.meta.url)), '../../eslint.config.mjs');
const REGLA_DE_IMPORTS = 'no-restricted-imports';
const REGLA_DE_SINTAXIS = 'no-restricted-syntax';

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

  it('una spec no puede importar el default de @playwright/test, que trae test', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import pw from '@playwright/test';\nexport const probar = pw.test;\n`,
    );

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec no puede importar @playwright/test como espacio de nombres', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import * as pw from '@playwright/test';\nexport const probar = pw.test;\n`,
    );

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec no puede importar test del paquete playwright/test', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import { test } from 'playwright/test';\ntest('x', async () => {});\n`,
    );

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec no puede importar el default ni el espacio de nombres de playwright/test', async () => {
    const porDefecto = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import pw from 'playwright/test';\nexport const probar = pw.test;\n`,
    );
    const espacio = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import * as pw from 'playwright/test';\nexport const probar = pw.test;\n`,
    );

    expect(porDefecto).toContain(REGLA_DE_IMPORTS);
    expect(espacio).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec puede importar solo tipos de @playwright/test', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import type { Page } from '@playwright/test';\nexport type Pagina = Page;\n`,
    );

    expect(reglas).toEqual([]);
  });

  it('una spec no puede importar _baseTest de @playwright/test, el test sin vigilancia', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import { _baseTest } from '@playwright/test';\nexport const probar = _baseTest;\n`,
    );

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it('una spec no puede importar _baseTest de playwright/test', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `import { _baseTest } from 'playwright/test';\nexport const probar = _baseTest;\n`,
    );

    expect(reglas).toContain(REGLA_DE_IMPORTS);
  });

  it.each(['@playwright/test', 'playwright/test'])(
    'una spec no puede obtener test con import() dinámico de %s',
    async (paquete) => {
      const reglas = await reglasQueFallan(
        'tests/sistema/flujo.spec.ts',
        `export const cargar = async () => { const { test } = await import('${paquete}'); return test; };\n`,
      );

      expect(reglas).toContain(REGLA_DE_SINTAXIS);
    },
  );

  it('una spec no puede obtener test con import() dinámico de una plantilla sin sustituciones', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      'export const cargar = async () => (await import(`@playwright/test`)).test;\n',
    );

    expect(reglas).toContain(REGLA_DE_SINTAXIS);
  });

  it('una spec puede usar import() dinámico de ./sin-red', async () => {
    const reglas = await reglasQueFallan(
      'tests/sistema/flujo.spec.ts',
      `export const cargar = async () => (await import('./sin-red')).test;\n`,
    );

    expect(reglas).toEqual([]);
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

describe('suite de sistema: el historial de la corrida', () => {
  const raizDelRepositorio = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '../..'));
  const entornoInicial = { ...process.env };
  const creadas: string[] = [];

  async function evaluarLaConfiguracion(): Promise<string> {
    vi.resetModules();
    const { webServer } = (await import('../../playwright.config')).default;
    const servidor = Array.isArray(webServer) ? webServer[0] : webServer;
    const carpeta = servidor?.env?.['TABLERO_HISTORIAL'];
    if (carpeta === undefined) throw new Error('playwright.config.ts no define TABLERO_HISTORIAL');
    creadas.push(carpeta);
    return carpeta;
  }

  function empezarOtraCorrida() {
    for (const clave of Object.keys(process.env)) {
      if (!(clave in entornoInicial)) delete process.env[clave];
    }
  }

  beforeEach(() => {
    // La suite se lanza desde la raíz del repositorio; el `beforeAll` de arriba dejó el directorio de trabajo en un árbol temporal.
    process.chdir(raizAnterior);
  });

  afterEach(() => {
    process.chdir(arbol);
    empezarOtraCorrida();
    for (const carpeta of creadas.splice(0)) rmSync(carpeta, { recursive: true, force: true });
  });

  it('la carpeta del historial del servidor de la suite cae fuera del repositorio', async () => {
    const carpeta = await evaluarLaConfiguracion();

    const respectoDelRepositorio = relative(raizDelRepositorio, realpathSync(carpeta));
    const dentro = !respectoDelRepositorio.startsWith('..') && !isAbsolute(respectoDelRepositorio);
    expect(isAbsolute(carpeta)).toBe(true);
    expect(dentro).toBe(false);
  });

  it('evaluar la configuración otra vez en la misma corrida reutiliza la carpeta y no borra lo guardado', async () => {
    const carpeta = await evaluarLaConfiguracion();
    writeFileSync(join(carpeta, '2026-07.json'), '[]');

    const otraEvaluacion = await evaluarLaConfiguracion();

    expect(otraEvaluacion).toBe(carpeta);
    expect(readdirSync(carpeta)).toEqual(['2026-07.json']);
  });

  it('cada corrida empieza con una carpeta vacía, distinta de la anterior', async () => {
    const anterior = await evaluarLaConfiguracion();
    writeFileSync(join(anterior, '2026-07.json'), '[]');
    empezarOtraCorrida();

    const carpeta = await evaluarLaConfiguracion();

    expect(carpeta).not.toBe(anterior);
    expect(readdirSync(carpeta)).toEqual([]);
  });
});
