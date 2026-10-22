import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { needsBuild } from '../../src/servidor/needs-build';
import { readTimes } from '../../src/servidor/read-times';

const ANTES = new Date('2026-01-01T00:00:00Z');
const BUNDLE = new Date('2026-02-01T00:00:00Z');
const DESPUES = new Date('2026-03-01T00:00:00Z');
const ENTRADAS = ['src', 'index.html', 'package-lock.json'];

let raiz: string;

function fijar(ruta: string, fecha: Date) {
  utimesSync(join(raiz, ruta), fecha, fecha);
}

async function hayQueConstruir(entradas = ENTRADAS): Promise<boolean> {
  return needsBuild(
    await readTimes({ root: raiz, bundleFile: 'dist/index.html', sources: entradas }),
  );
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'tablero-fechas-'));
  mkdirSync(join(raiz, 'src', 'cliente'), { recursive: true });
  mkdirSync(join(raiz, 'dist'));
  writeFileSync(join(raiz, 'src', 'cliente', 'App.tsx'), 'a');
  writeFileSync(join(raiz, 'index.html'), 'h');
  writeFileSync(join(raiz, 'package-lock.json'), '{}');
  writeFileSync(join(raiz, 'dist', 'index.html'), 'b');
  for (const ruta of [
    'src',
    'src/cliente',
    'src/cliente/App.tsx',
    'index.html',
    'package-lock.json',
  ]) {
    fijar(ruta, ANTES);
  }
  fijar('dist/index.html', BUNDLE);
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('lectura de las fechas del bundle y de sus fuentes', () => {
  it('con todas las fuentes más viejas que el bundle no hay que construir', async () => {
    expect(await hayQueConstruir()).toBe(false);
  });

  it('un archivo anidado en src más reciente que el bundle pide construir', async () => {
    fijar('src/cliente/App.tsx', DESPUES);

    expect(await hayQueConstruir()).toBe(true);
  });

  it('un archivo suelto de la lista más reciente que el bundle pide construir', async () => {
    fijar('index.html', DESPUES);

    expect(await hayQueConstruir()).toBe(true);
  });

  it.each(['src', 'src/cliente'])(
    'la carpeta %s con fecha más reciente (se creó o borró un archivo) pide construir',
    async (carpeta) => {
      fijar(carpeta, DESPUES);

      expect(await hayQueConstruir()).toBe(true);
    },
  );

  it('sin bundle construido, la fecha del bundle es undefined', async () => {
    rmSync(join(raiz, 'dist'), { recursive: true });

    const fechas = await readTimes({
      root: raiz,
      bundleFile: 'dist/index.html',
      sources: ENTRADAS,
    });

    expect(fechas.bundle).toBeUndefined();
    expect(needsBuild(fechas)).toBe(true);
  });

  it('una entrada de la lista que no existe no rompe ni oculta a las demás', async () => {
    fijar('src/cliente/App.tsx', DESPUES);

    expect(await hayQueConstruir([...ENTRADAS, 'vite.config.mts'])).toBe(true);
    expect(await hayQueConstruir(['vite.config.mts', 'index.html'])).toBe(false);
  });
});
