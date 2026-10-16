import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { start, type StartupDeps } from '../../src/servidor/startup';
import { StartupFailure } from '../../src/servidor/startup-failure';
import { cerrar, pedir, puertoDe } from './ayudas';

const PAGINA = '<!doctype html><title>tablero</title>';

let carpeta: string;
let servidores: Server[];
let ocupantes: ReturnType<typeof createServer>[];

function dependencias(cambios: Partial<StartupDeps> = {}): StartupDeps {
  return {
    env: { TABLERO_PUERTO: '0', TABLERO_SIN_NAVEGADOR: '1' },
    bundleDirectory: carpeta,
    readTimes: () => Promise.resolve({ bundle: 300, sources: [100] }),
    buildBundle: () => Promise.resolve(0),
    openBrowser: () => Promise.resolve(),
    log: () => {},
    ...cambios,
  };
}

async function arrancar(cambios: Partial<StartupDeps> = {}): Promise<Server> {
  const servidor = await start(dependencias(cambios));
  servidores.push(servidor);
  return servidor;
}

function ocuparPuerto(): Promise<number> {
  return new Promise((resolver) => {
    const ocupante = createServer();
    ocupantes.push(ocupante);
    ocupante.listen(0, '127.0.0.1', () => {
      resolver((ocupante.address() as { port: number }).port);
    });
  });
}

async function puertoLibre(): Promise<number> {
  const puerto = await ocuparPuerto();
  const ocupante = ocupantes.pop()!;
  await new Promise((resolver) => ocupante.close(resolver));
  return puerto;
}

beforeEach(() => {
  servidores = [];
  ocupantes = [];
  carpeta = mkdtempSync(join(tmpdir(), 'tablero-arranque-'));
  writeFileSync(join(carpeta, 'index.html'), PAGINA);
});

afterEach(async () => {
  await Promise.all(servidores.map(cerrar));
  await Promise.all(ocupantes.map((o) => new Promise((resolver) => o.close(resolver))));
  rmSync(carpeta, { recursive: true, force: true });
});

describe('arranque: servir el bundle', () => {
  it('deja la página servida en 127.0.0.1', async () => {
    const servidor = await arrancar();

    const respuesta = await pedir(servidor, 'GET', '/');

    expect(respuesta.estado).toBe(200);
    expect(respuesta.cuerpo).toBe(PAGINA);
  });
});

describe('arranque: construir solo si hace falta', () => {
  it('construye antes de servir cuando una fuente es más reciente que el bundle', async () => {
    const buildBundle = vi.fn(() => Promise.resolve(0));

    await arrancar({
      buildBundle,
      readTimes: () => Promise.resolve({ bundle: 100, sources: [200] }),
    });

    expect(buildBundle).toHaveBeenCalledTimes(1);
  });

  it('no sirve nada mientras construye: la página vieja nunca llega al navegador', async () => {
    const puerto = await puertoLibre();
    let alConstruir: unknown;

    await arrancar({
      env: { TABLERO_PUERTO: String(puerto), TABLERO_SIN_NAVEGADOR: '1' },
      readTimes: () => Promise.resolve({ bundle: 100, sources: [200] }),
      buildBundle: async () => {
        alConstruir = await pedir(puerto, 'GET', '/').catch(
          (error: NodeJS.ErrnoException) => error.code,
        );
        return 0;
      },
    });

    expect(alConstruir).toBe('ECONNREFUSED');
  });

  it('construye cuando no hay bundle', async () => {
    const buildBundle = vi.fn(() => Promise.resolve(0));

    await arrancar({
      buildBundle,
      readTimes: () => Promise.resolve({ bundle: undefined, sources: [200] }),
    });

    expect(buildBundle).toHaveBeenCalledTimes(1);
  });

  it('no construye cuando el bundle está al día', async () => {
    const buildBundle = vi.fn(() => Promise.resolve(0));

    await arrancar({ buildBundle });

    expect(buildBundle).not.toHaveBeenCalled();
  });

  it('si la construcción falla, termina con el código de la construcción y no escucha ni abre el navegador', async () => {
    const puerto = await puertoLibre();
    const openBrowser = vi.fn(() => Promise.resolve());

    const fallo = await arrancar({
      env: { TABLERO_PUERTO: String(puerto) },
      readTimes: () => Promise.resolve({ bundle: undefined, sources: [] }),
      buildBundle: () => Promise.resolve(2),
      openBrowser,
    }).catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(StartupFailure);
    expect((fallo as StartupFailure).exitCode).toBe(2);
    expect(openBrowser).not.toHaveBeenCalled();
    const ocupante = await new Promise<boolean>((resolver) => {
      const sonda = createServer();
      ocupantes.push(sonda);
      sonda.once('error', () => resolver(false));
      sonda.listen(puerto, '127.0.0.1', () => resolver(true));
    });
    expect(ocupante).toBe(true);
  });
});

describe('arranque: puerto', () => {
  it('escucha en el puerto de TABLERO_PUERTO', async () => {
    const puerto = await puertoLibre();

    const servidor = await arrancar({ env: { TABLERO_PUERTO: String(puerto) } });

    expect(puertoDe(servidor)).toBe(puerto);
  });

  it('con el puerto ocupado termina con código distinto de cero y un mensaje que nombra puerto y variable', async () => {
    const puerto = await ocuparPuerto();

    const fallo = await arrancar({ env: { TABLERO_PUERTO: String(puerto) } }).catch(
      (error: unknown) => error,
    );

    expect(fallo).toBeInstanceOf(StartupFailure);
    expect((fallo as StartupFailure).exitCode).not.toBe(0);
    expect((fallo as StartupFailure).message).toContain(String(puerto));
    expect((fallo as StartupFailure).message).toContain('TABLERO_PUERTO');
  });
});

describe('arranque: navegador', () => {
  it('con TABLERO_SIN_NAVEGADOR=1 no se llama a quien abre el navegador', async () => {
    const openBrowser = vi.fn(() => Promise.resolve());

    await arrancar({ env: { TABLERO_PUERTO: '0', TABLERO_SIN_NAVEGADOR: '1' }, openBrowser });

    expect(openBrowser).not.toHaveBeenCalled();
  });

  it('sin esa variable se abre el navegador en la dirección del tablero, ya escuchando', async () => {
    const respuestas: number[] = [];
    const openBrowser = vi.fn(async (url: string) => {
      respuestas.push((await pedir(Number(new URL(url).port), 'GET', '/')).estado);
    });

    const servidor = await arrancar({ env: { TABLERO_PUERTO: '0' }, openBrowser });

    const url = `http://127.0.0.1:${puertoDe(servidor)}/`;
    expect(openBrowser).toHaveBeenCalledExactlyOnceWith(url);
    expect(respuestas).toEqual([200]);
  });

  it('si el navegador no se puede abrir, el servidor sigue y se avisa además del mensaje de arranque', async () => {
    const mensajesSinFallo: string[] = [];
    const mensajesConFallo: string[] = [];
    await arrancar({
      env: { TABLERO_PUERTO: '0' },
      openBrowser: () => Promise.resolve(),
      log: (mensaje) => mensajesSinFallo.push(mensaje),
    });

    const servidor = await arrancar({
      env: { TABLERO_PUERTO: '0' },
      openBrowser: () => Promise.reject(new Error('sin navegador')),
      log: (mensaje) => mensajesConFallo.push(mensaje),
    });

    const url = `http://127.0.0.1:${puertoDe(servidor)}/`;
    expect((await pedir(servidor, 'GET', '/')).estado).toBe(200);
    const avisos = mensajesConFallo.slice(mensajesSinFallo.length);
    expect(avisos).not.toHaveLength(0);
    expect(avisos.every((aviso) => aviso.includes(url))).toBe(true);
  });
});
