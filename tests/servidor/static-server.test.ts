import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startStaticServer } from '../../src/servidor/static-server';
import { cerrar, pedir } from './ayudas';

const PAGINA = '<!doctype html><title>tablero</title>';
const SECRETO = 'contenido-que-no-debe-salir';

let raiz: string;
let carpeta: string;
let abiertos: Server[];

async function iniciar(): Promise<Server> {
  const servidor = await startStaticServer({ directory: carpeta, port: 0 });
  abiertos.push(servidor);
  return servidor;
}

beforeEach(() => {
  abiertos = [];
  raiz = mkdtempSync(join(tmpdir(), 'tablero-estaticos-'));
  carpeta = join(raiz, 'bundle');
  mkdirSync(join(carpeta, 'assets'), { recursive: true });
  writeFileSync(join(carpeta, 'index.html'), PAGINA);
  writeFileSync(join(carpeta, 'assets', 'app.js'), 'console.log(1);');
  writeFileSync(join(raiz, 'secreto.txt'), SECRETO);
  mkdirSync(join(raiz, 'bundle-otro'));
  writeFileSync(join(raiz, 'bundle-otro', 'secreto.txt'), SECRETO);
});

afterEach(async () => {
  await Promise.all(abiertos.map(cerrar));
  rmSync(raiz, { recursive: true, force: true });
});

describe('servidor de estáticos: dónde escucha', () => {
  it('escucha exactamente en 127.0.0.1', async () => {
    const servidor = await iniciar();

    expect(servidor.address()).toMatchObject({ address: '127.0.0.1', family: 'IPv4' });
  });
});

describe('servidor de estáticos: sirve el bundle', () => {
  it('GET / responde 200 con la página', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/');

    expect(respuesta.estado).toBe(200);
    expect(respuesta.cuerpo).toBe(PAGINA);
  });

  it('GET de un recurso del bundle responde 200 con su contenido', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/assets/app.js');

    expect(respuesta.estado).toBe(200);
    expect(respuesta.cuerpo).toBe('console.log(1);');
  });

  it('ignora la query string al buscar el archivo', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/assets/app.js?v=3');

    expect(respuesta.estado).toBe(200);
  });

  it('decodifica la ruta: un archivo con espacio se sirve por su nombre codificado', async () => {
    writeFileSync(join(carpeta, 'assets', 'con espacio.js'), 'ok');

    const respuesta = await pedir(await iniciar(), 'GET', '/assets/con%20espacio.js');

    expect(respuesta.estado).toBe(200);
    expect(respuesta.cuerpo).toBe('ok');
  });

  it.each([
    ['index.html', 'text/html; charset=utf-8'],
    ['app.js', 'text/javascript; charset=utf-8'],
    ['app.css', 'text/css; charset=utf-8'],
    ['logo.svg', 'image/svg+xml'],
    ['datos.json', 'application/json; charset=utf-8'],
    ['favicon.ico', 'image/x-icon'],
    ['fuente.woff2', 'font/woff2'],
    ['desconocido.xyz', 'application/octet-stream'],
  ])('%s se sirve como %s', async (nombre, tipo) => {
    writeFileSync(join(carpeta, nombre), 'x');

    const respuesta = await pedir(await iniciar(), 'GET', `/${nombre}`);

    expect(respuesta.cabeceras['content-type']).toBe(tipo);
  });

  it('HEAD responde con los encabezados de GET y sin cuerpo', async () => {
    const servidor = await iniciar();

    const respuesta = await pedir(servidor, 'HEAD', '/');

    expect(respuesta.estado).toBe(200);
    expect(respuesta.cabeceras['content-type']).toBe('text/html; charset=utf-8');
    expect(respuesta.cabeceras['content-length']).toBe(String(Buffer.byteLength(PAGINA)));
    expect(respuesta.cuerpo).toBe('');
  });
});

describe('servidor de estáticos: solo el bundle', () => {
  it.each([
    ['..', '/../secreto.txt'],
    ['%2e%2e', '/%2e%2e/secreto.txt'],
    ['%2E%2E', '/%2E%2E/secreto.txt'],
    ['.. dentro de la ruta', '/assets/../../secreto.txt'],
    ['una carpeta hermana con el mismo prefijo', '/%2e%2e/bundle-otro/secreto.txt'],
  ])('%s fuera de la carpeta responde 404 y no sirve el archivo de fuera', async (_caso, ruta) => {
    const respuesta = await pedir(await iniciar(), 'GET', ruta);

    expect(respuesta.estado).toBe(404);
    expect(respuesta.cuerpo).not.toContain(SECRETO);
  });

  it('una ruta con bytes mal codificados no tumba el servidor', async () => {
    const servidor = await iniciar();

    const mala = await pedir(servidor, 'GET', '/%E0%A4%A');
    const siguiente = await pedir(servidor, 'GET', '/');

    expect([400, 404]).toContain(mala.estado);
    expect(siguiente.estado).toBe(200);
  });

  it('un byte nulo en la ruta responde 404 y el servidor sigue vivo', async () => {
    const servidor = await iniciar();

    const nulo = await pedir(servidor, 'GET', '/index.html%00');
    const siguiente = await pedir(servidor, 'GET', '/');

    expect(nulo.estado).toBe(404);
    expect(siguiente.estado).toBe(200);
  });

  it('una ruta que no existe responde 404', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/no-existe');

    expect(respuesta.estado).toBe(404);
  });

  it('no hay fallback de SPA: una ruta sin archivo no devuelve la página', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/mes/2026-07');

    expect(respuesta.cuerpo).not.toContain(PAGINA);
  });

  it('una carpeta no se lista: responde 404', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/assets/');

    expect(respuesta.estado).toBe(404);
  });

  it.each(['POST', 'PUT', 'DELETE', 'PATCH'])(
    '%s responde 405 e indica GET y HEAD',
    async (metodo) => {
      const respuesta = await pedir(await iniciar(), metodo, '/');

      expect(respuesta.estado).toBe(405);
      expect(respuesta.cabeceras['allow']).toBe('GET, HEAD');
    },
  );
});
