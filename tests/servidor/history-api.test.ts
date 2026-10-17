import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHistoryApi } from '../../src/servidor/history-api';
import { createMonthStore } from '../../src/servidor/month-store';
import { startStaticServer } from '../../src/servidor/static-server';
import {
  AGOSTO,
  JULIO,
  SEPTIEMBRE,
  cerrar,
  pedir,
  puertoDe,
  transaccionesDelFixture,
  unaTransaccion,
  type Respuesta,
} from './ayudas';

const PAGINA = '<!doctype html><title>tablero</title>';
const JSON_HEADER = { 'content-type': 'application/json' };
const SECRETO = 'contenido-que-no-debe-salir';
const CUERPO_VALIDO = JSON.stringify([unaTransaccion('A1', '2026-07-01')]);

let raiz: string;
let carpeta: string;
let abiertos: Server[];
let avisos: string[];

interface OpcionesDelServidor {
  carpetaDelHistorial?: string;
  maxBodyBytes?: number;
}

async function iniciar({
  carpetaDelHistorial = carpeta,
  maxBodyBytes,
}: OpcionesDelServidor = {}): Promise<Server> {
  const store = createMonthStore({ directory: carpetaDelHistorial, log: (a) => avisos.push(a) });
  const api = createHistoryApi({
    store,
    log: (a) => avisos.push(a),
    ...(maxBodyBytes === undefined ? {} : { maxBodyBytes }),
  });
  const servidor = await startStaticServer({ directory: join(raiz, 'bundle'), port: 0, api });
  abiertos.push(servidor);
  return servidor;
}

function guardar(
  servidor: Server,
  mes: string,
  transacciones: unknown,
  consulta = '',
): Promise<Respuesta> {
  return pedir(servidor, 'PUT', `/api/meses/${mes}${consulta}`, {
    cuerpo: JSON.stringify(transacciones),
    encabezados: JSON_HEADER,
  });
}

function archivoDe(mes: string): string {
  return join(carpeta, `${mes}.json`);
}

beforeEach(() => {
  abiertos = [];
  avisos = [];
  raiz = mkdtempSync(join(tmpdir(), 'tablero-api-'));
  carpeta = join(raiz, 'historial');
  mkdirSync(join(raiz, 'bundle'));
  writeFileSync(join(raiz, 'bundle', 'index.html'), PAGINA);
});

afterEach(async () => {
  await Promise.all(abiertos.map(cerrar));
  rmSync(raiz, { recursive: true, force: true });
});

describe('API del historial: listar', () => {
  it('con el historial vacío responde 200 con [] y no crea la carpeta', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/api/meses');

    expect(respuesta.estado).toBe(200);
    expect(respuesta.cabeceras['content-type']).toContain('application/json');
    expect(JSON.parse(respuesta.cuerpo)).toEqual([]);
    expect(existsSync(carpeta)).toBe(false);
  });

  it('con tres meses guardados desordenados los lista en orden cronológico con sus filas y totales', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-09', transaccionesDelFixture(SEPTIEMBRE));
    await guardar(servidor, '2026-07', transaccionesDelFixture(JULIO));
    await guardar(servidor, '2026-08', transaccionesDelFixture(AGOSTO));

    const lista = JSON.parse((await pedir(servidor, 'GET', '/api/meses')).cuerpo) as {
      mes: string;
      filas: number;
      total: number;
    }[];

    expect(lista.map(({ mes, filas }) => ({ mes, filas }))).toEqual([
      { mes: '2026-07', filas: 2000 },
      { mes: '2026-08', filas: 2000 },
      { mes: '2026-09', filas: 2000 },
    ]);
    expect(lista[0]?.total).toBeCloseTo(1689470.67, 2);
    expect(lista[1]?.total).toBeCloseTo(1544622.78, 2);
    expect(lista[2]?.total).toBeCloseTo(1278296.56, 2);
  });

  it('un archivo ilegible no tumba la lista: responde 200 sin ese mes', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);
    writeFileSync(archivoDe('2026-08'), '{"cortado":');

    const respuesta = await pedir(servidor, 'GET', '/api/meses');

    expect(respuesta.estado).toBe(200);
    expect((JSON.parse(respuesta.cuerpo) as { mes: string }[]).map((m) => m.mes)).toEqual([
      '2026-07',
    ]);
  });
});

describe('API del historial: guardar y leer un mes', () => {
  it('PUT de un mes nuevo responde 201 y GET devuelve las transacciones tal como se guardaron', async () => {
    const servidor = await iniciar();
    const transacciones = transaccionesDelFixture(JULIO);

    const guardado = await guardar(servidor, '2026-07', transacciones);
    const leido = await pedir(servidor, 'GET', '/api/meses/2026-07');

    expect(guardado.estado).toBe(201);
    expect(leido.estado).toBe(200);
    expect(JSON.parse(leido.cuerpo)).toEqual(transacciones);
  });

  it('PUT de un mes que ya existe sin ?reemplazar=1 responde 409 y el archivo guardado no cambia', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);
    const antes = readFileSync(archivoDe('2026-07'), 'utf8');

    const respuesta = await guardar(servidor, '2026-07', [unaTransaccion('B1', '2026-07-09', 5)]);

    expect(respuesta.estado).toBe(409);
    expect(readFileSync(archivoDe('2026-07'), 'utf8')).toBe(antes);
  });

  it('PUT con ?reemplazar=1 responde 200 y el mes queda solo con las transacciones nuevas (R-09)', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);
    const nuevas = [unaTransaccion('B1', '2026-07-09', 5), unaTransaccion('B2', '2026-07-10', 6)];

    const respuesta = await guardar(servidor, '2026-07', nuevas, '?reemplazar=1');

    expect(respuesta.estado).toBe(200);
    const leido = await pedir(servidor, 'GET', '/api/meses/2026-07');
    expect(JSON.parse(leido.cuerpo)).toEqual(nuevas);
  });

  it('PUT con ?reemplazar=1 de un mes que no existía responde 201', async () => {
    const respuesta = await guardar(
      await iniciar(),
      '2026-07',
      [unaTransaccion('A1', '2026-07-01')],
      '?reemplazar=1',
    );

    expect(respuesta.estado).toBe(201);
  });

  it('GET de un mes que no está responde 404', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/api/meses/2026-01');

    expect(respuesta.estado).toBe(404);
  });
});

describe('API del historial: borrar', () => {
  it('DELETE de un mes guardado responde 204 y el mes deja de aparecer en la lista', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);

    const respuesta = await pedir(servidor, 'DELETE', '/api/meses/2026-07');

    expect(respuesta.estado).toBe(204);
    expect(JSON.parse((await pedir(servidor, 'GET', '/api/meses')).cuerpo)).toEqual([]);
  });

  it('DELETE de un mes que no está responde 404', async () => {
    const respuesta = await pedir(await iniciar(), 'DELETE', '/api/meses/2026-01');

    expect(respuesta.estado).toBe(404);
  });
});

describe('API del historial: el mes de la ruta se valida', () => {
  it.each(['GET', 'PUT', 'DELETE'])(
    '%s con un mes que sale de la carpeta o no existe responde 400 y no toca el disco',
    async (metodo) => {
      const servidor = await iniciar();
      mkdirSync(carpeta);
      const fuera = join(raiz, 'package.json');
      writeFileSync(fuera, SECRETO);
      writeFileSync(join(carpeta, 'package.json'), SECRETO);

      for (const mes of [
        '2026-13',
        '..%2F..%2Fpackage',
        '..%2Fpackage',
        '2026-07%2F..',
        '%E0%A4%A',
      ]) {
        const respuesta = await pedir(
          servidor,
          metodo,
          `/api/meses/${mes}`,
          metodo === 'PUT' ? { cuerpo: CUERPO_VALIDO, encabezados: JSON_HEADER } : {},
        );

        expect(respuesta.estado, mes).toBe(400);
        expect(respuesta.cuerpo).not.toContain(SECRETO);
      }
      expect(readFileSync(fuera, 'utf8')).toBe(SECRETO);
      expect(readdirSync(carpeta)).toEqual(['package.json']);
    },
  );

  it('PUT con un mes inválido no crea la carpeta del historial', async () => {
    const servidor = await iniciar();

    await guardar(servidor, '2026-13', [unaTransaccion('A1', '2026-13-01')]);

    expect(existsSync(carpeta)).toBe(false);
  });
});

describe('API del historial: el cuerpo se valida con el esquema del dominio', () => {
  async function rechazado(cuerpo: string, mes = '2026-07'): Promise<Respuesta> {
    const servidor = await iniciar();
    const respuesta = await pedir(servidor, 'PUT', `/api/meses/${mes}`, {
      cuerpo,
      encabezados: JSON_HEADER,
    });
    expect(existsSync(carpeta), 'no se escribe nada').toBe(false);
    return respuesta;
  }

  it('un cuerpo que no es JSON responde 400 con un error', async () => {
    const respuesta = await rechazado('{"cortado":');

    expect(respuesta.estado).toBe(400);
    expect(JSON.parse(respuesta.cuerpo)).toEqual({ error: expect.stringMatching(/\S/) as string });
  });

  it('una lista vacía responde 400 con el motivo del esquema', async () => {
    const respuesta = await rechazado('[]');

    expect(respuesta.estado).toBe(400);
    expect((JSON.parse(respuesta.cuerpo) as { error: string }).error).toContain('vacía');
  });

  it('una transacción de otro mes responde 400 nombrando la transacción y el mes', async () => {
    const respuesta = await rechazado(JSON.stringify([unaTransaccion('A1', '2026-08-01')]));

    expect(respuesta.estado).toBe(400);
    const { error } = JSON.parse(respuesta.cuerpo) as { error: string };
    expect(error).toContain('2026-08-01');
    expect(error).toContain('2026-07');
  });

  it('una transacción con monto 0 responde 400', async () => {
    const respuesta = await rechazado(JSON.stringify([unaTransaccion('A1', '2026-07-01', 0)]));

    expect(respuesta.estado).toBe(400);
  });

  it('un PUT rechazado no cambia el mes que ya estaba guardado', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);
    const antes = readFileSync(archivoDe('2026-07'), 'utf8');

    const respuesta = await guardar(servidor, '2026-07', [], '?reemplazar=1');

    expect(respuesta.estado).toBe(400);
    expect(readFileSync(archivoDe('2026-07'), 'utf8')).toBe(antes);
  });

  it.each([
    ['text/plain', { 'content-type': 'text/plain' }],
    ['sin tipo de contenido', {}],
  ])('un PUT con %s responde 415 y no guarda nada', async (_caso, encabezados) => {
    const servidor = await iniciar();

    const respuesta = await pedir(servidor, 'PUT', '/api/meses/2026-07', {
      cuerpo: JSON.stringify([unaTransaccion('A1', '2026-07-01')]),
      encabezados,
    });

    expect(respuesta.estado).toBe(415);
    expect(existsSync(carpeta)).toBe(false);
  });

  it('acepta application/json con charset', async () => {
    const servidor = await iniciar();

    const respuesta = await pedir(servidor, 'PUT', '/api/meses/2026-07', {
      cuerpo: JSON.stringify([unaTransaccion('A1', '2026-07-01')]),
      encabezados: { 'content-type': 'application/json; charset=utf-8' },
    });

    expect(respuesta.estado).toBe(201);
  });
});

describe('API del historial: tamaño del cuerpo', () => {
  const LIMITE_DE_64_MB = 64 * 1024 * 1024;

  it('un Content-Length de más de 64 MB responde 413 sin esperar el cuerpo ni guardar nada', async () => {
    const servidor = await iniciar();

    const respuesta = await pedir(servidor, 'PUT', '/api/meses/2026-07', {
      encabezados: { ...JSON_HEADER, 'content-length': String(LIMITE_DE_64_MB + 1) },
    });

    expect(respuesta.estado).toBe(413);
    expect(existsSync(carpeta)).toBe(false);
  });

  it('un cuerpo que pasa el límite responde 413 y no guarda nada', async () => {
    const servidor = await iniciar({ maxBodyBytes: 1024 });
    const demasiado = JSON.stringify([unaTransaccion('A1', '2026-07-01')]).padEnd(2048, ' ');

    const respuesta = await pedir(servidor, 'PUT', '/api/meses/2026-07', {
      cuerpo: demasiado,
      encabezados: JSON_HEADER,
    });

    expect(respuesta.estado).toBe(413);
    expect(existsSync(carpeta)).toBe(false);
  });

  it('un cuerpo sin Content-Length (por trozos) que pasa el límite también responde 413', async () => {
    const servidor = await iniciar({ maxBodyBytes: 1024 });
    const demasiado = JSON.stringify([unaTransaccion('A1', '2026-07-01')]).padEnd(2048, ' ');

    const respuesta = await pedir(servidor, 'PUT', '/api/meses/2026-07', {
      cuerpo: demasiado,
      encabezados: { ...JSON_HEADER, 'transfer-encoding': 'chunked' },
    });

    expect(respuesta.estado).toBe(413);
    expect(existsSync(carpeta)).toBe(false);
  });

  it('un cuerpo dentro del límite se guarda', async () => {
    const servidor = await iniciar({ maxBodyBytes: 4096 });

    const respuesta = await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);

    expect(respuesta.estado).toBe(201);
  });
});

describe('API del historial: solo atiende a la página del propio tablero', () => {
  it('GET /api/meses con un Host ajeno responde 403 y no incluye ningún mes', async () => {
    const servidor = await iniciar();
    await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);

    const respuesta = await pedir(servidor, 'GET', '/api/meses', {
      encabezados: { Host: `ataque.example:${puertoDe(servidor)}` },
    });

    expect(respuesta.estado).toBe(403);
    expect(respuesta.cuerpo).not.toContain('2026-07');
  });

  it('un Host con el nombre correcto pero otro puerto responde 403', async () => {
    const servidor = await iniciar();

    const respuesta = await pedir(servidor, 'GET', '/api/meses', {
      encabezados: { Host: '127.0.0.1:1' },
    });

    expect(respuesta.estado).toBe(403);
  });

  it('un PUT con Host ajeno responde 403 y no guarda nada', async () => {
    const servidor = await iniciar();

    const respuesta = await pedir(servidor, 'PUT', '/api/meses/2026-07', {
      cuerpo: JSON.stringify([unaTransaccion('A1', '2026-07-01')]),
      encabezados: { ...JSON_HEADER, Host: 'ataque.example' },
    });

    expect(respuesta.estado).toBe(403);
    expect(existsSync(carpeta)).toBe(false);
  });

  it.each(['127.0.0.1', 'localhost'])(
    'el Host %s con el puerto del servidor se atiende',
    async (nombre) => {
      const servidor = await iniciar();

      const respuesta = await pedir(servidor, 'GET', '/api/meses', {
        encabezados: { Host: `${nombre}:${puertoDe(servidor)}` },
      });

      expect(respuesta.estado).toBe(200);
    },
  );
});

describe('API del historial: rutas y métodos', () => {
  it('POST /api/meses responde 405 e indica GET', async () => {
    const respuesta = await pedir(await iniciar(), 'POST', '/api/meses');

    expect(respuesta.estado).toBe(405);
    expect(respuesta.cabeceras['allow']).toBe('GET');
  });

  it.each(['POST', 'PATCH'])(
    '%s /api/meses/2026-07 responde 405 e indica GET, PUT y DELETE',
    async (metodo) => {
      const respuesta = await pedir(await iniciar(), metodo, '/api/meses/2026-07');

      expect(respuesta.estado).toBe(405);
      expect(respuesta.cabeceras['allow']).toBe('GET, PUT, DELETE');
    },
  );

  it('una ruta desconocida bajo /api/ responde 404', async () => {
    const respuesta = await pedir(await iniciar(), 'GET', '/api/otra-cosa');

    expect(respuesta.estado).toBe(404);
  });

  it('la API no atiende fuera de /api/: el bundle sigue en GET y el resto de métodos da 405 con GET y HEAD', async () => {
    const servidor = await iniciar();

    const pagina = await pedir(servidor, 'GET', '/');
    const put = await pedir(servidor, 'PUT', '/index.html', { cuerpo: '{}' });

    expect(pagina.cuerpo).toBe(PAGINA);
    expect(put.estado).toBe(405);
    expect(put.cabeceras['allow']).toBe('GET, HEAD');
  });
});

describe('API del historial: fallos del almacenamiento', () => {
  it('si no se puede escribir responde 500 con un error y el servidor sigue atendiendo', async () => {
    const bloqueo = join(raiz, 'archivo-que-no-es-carpeta');
    writeFileSync(bloqueo, 'x');
    const servidor = await iniciar({ carpetaDelHistorial: join(bloqueo, 'historial') });

    const respuesta = await guardar(servidor, '2026-07', [unaTransaccion('A1', '2026-07-01')]);
    const siguiente = await pedir(servidor, 'GET', '/');

    expect(respuesta.estado).toBe(500);
    expect(JSON.parse(respuesta.cuerpo)).toEqual({ error: expect.stringMatching(/\S/) as string });
    expect(siguiente.estado).toBe(200);
    expect(avisos.length).toBeGreaterThan(0);
  });
});
