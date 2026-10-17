import type { IncomingMessage, ServerResponse } from 'node:http';
import { esMes, leerMesGuardado } from '../dominio/esquema';
import type { MonthStore } from './month-store';
import type { ApiHandler } from './static-server';

export const MAX_BODY_BYTES = 64 * 1024 * 1024;

const LIST_ROUTE = '/api/meses';
const MONTH_ROUTE = /^\/api\/meses\/([^/]*)$/;
const LIST_METHODS = 'GET';
const MONTH_METHODS = 'GET, PUT, DELETE';
const REPLACE_PARAMETER = 'reemplazar';

export interface HistoryApiOptions {
  store: MonthStore;
  log(message: string): void;
  maxBodyBytes?: number;
}

function send(response: ServerResponse, status: number, body?: unknown, headers = {}) {
  if (body === undefined) {
    response.writeHead(status, headers);
    response.end();
    return;
  }
  const text = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    ...headers,
  });
  response.end(text);
}

function fail(response: ServerResponse, status: number, error: string, headers = {}) {
  send(response, status, { error }, headers);
}

// Un servidor en 127.0.0.1 no impide que una página abierta en el navegador resuelva su propio
// dominio a 127.0.0.1 y lea `GET /api/meses`, que no necesita preflight de CORS. Aceptar solo el
// `Host` del propio servidor cumple «los datos nunca salen de la máquina» (docs/PLAN.md).
function isOwnHost(request: IncomingMessage): boolean {
  const port = request.socket.localPort;
  return [`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host ?? '');
}

function isJson(request: IncomingMessage): boolean {
  const type = request.headers['content-type'] ?? '';
  return type.split(';')[0]?.trim().toLowerCase() === 'application/json';
}

function readBody(request: IncomingMessage, limit: number): Promise<Buffer | undefined> {
  const declared = Number(request.headers['content-length']);
  if (declared > limit) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    request.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (received > limit) {
        chunks.length = 0;
        request.removeAllListeners('data');
        request.resume();
        resolve(undefined);
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function parseJson(body: Buffer): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(body.toString('utf8')) as unknown };
  } catch {
    return { ok: false };
  }
}

/** Atiende `/api/meses` y `/api/meses/:mes` sobre un almacén (docs/ARQUITECTURA.md, «API del historial»). */
export function createHistoryApi({
  store,
  log,
  maxBodyBytes = MAX_BODY_BYTES,
}: HistoryApiOptions): ApiHandler {
  async function put(
    request: IncomingMessage,
    response: ServerResponse,
    mes: string,
    replace: boolean,
  ) {
    if (!isJson(request)) return fail(response, 415, 'El cuerpo debe declararse application/json.');
    const body = await readBody(request, maxBodyBytes);
    if (body === undefined) {
      return fail(response, 413, 'El cuerpo supera los 64 MB.', { Connection: 'close' });
    }
    const parsed = parseJson(body);
    if (!parsed.ok) return fail(response, 400, 'El cuerpo no es JSON.');
    const mesGuardado = leerMesGuardado(mes, parsed.value);
    if (!mesGuardado.ok) return fail(response, 400, mesGuardado.motivo);
    const outcome = await store.save(mes, mesGuardado.transacciones, { replace });
    if (outcome === 'existe') return fail(response, 409, `El mes ${mes} ya está guardado.`);
    send(response, outcome === 'creado' ? 201 : 200);
  }

  async function month(request: IncomingMessage, response: ServerResponse, url: URL, raw: string) {
    let mes: string;
    try {
      mes = decodeURIComponent(raw);
    } catch {
      return fail(response, 400, 'El mes de la ruta no es un texto válido.');
    }
    if (!esMes(mes)) return fail(response, 400, `«${mes}» no es un mes AAAA-MM.`);
    switch (request.method) {
      case 'GET': {
        const transacciones = await store.read(mes);
        if (transacciones === undefined)
          return fail(response, 404, `El mes ${mes} no está guardado.`);
        return send(response, 200, transacciones);
      }
      case 'PUT':
        return put(request, response, mes, url.searchParams.get(REPLACE_PARAMETER) === '1');
      case 'DELETE':
        return (await store.remove(mes))
          ? send(response, 204)
          : fail(response, 404, `El mes ${mes} no está guardado.`);
      default:
        return fail(response, 405, 'Método no permitido.', { Allow: MONTH_METHODS });
    }
  }

  async function route(request: IncomingMessage, response: ServerResponse) {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === LIST_ROUTE) {
      if (request.method !== 'GET') {
        return fail(response, 405, 'Método no permitido.', { Allow: LIST_METHODS });
      }
      return send(response, 200, await store.list());
    }
    const raw = MONTH_ROUTE.exec(url.pathname)?.[1];
    if (raw === undefined) return fail(response, 404, 'No existe esa ruta de la API.');
    return month(request, response, url, raw);
  }

  return async (request, response) => {
    if (!isOwnHost(request)) return fail(response, 403, 'Host no permitido.');
    try {
      await route(request, response);
    } catch (error) {
      log(`Error en la API del historial: ${(error as Error).message}`);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      fail(response, 500, 'No se pudo atender la petición del historial.');
    }
  };
}
