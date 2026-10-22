import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';

// Sin variable de entorno que la cambie: los datos de gasto no salen de la máquina
// (docs/STACK.md, regla innegociable 2).
export const LOCAL_ADDRESS = '127.0.0.1';

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const FALLBACK_CONTENT_TYPE = 'application/octet-stream';
const ALLOWED_METHODS = 'GET, HEAD';

export type ApiHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

export interface StaticServerOptions {
  directory: string;
  port: number;
  api?: ApiHandler;
}

function isApiRequest(requestTarget: string): boolean {
  const [path = ''] = requestTarget.split(/[?#]/);
  return path.startsWith('/api/');
}

/** Ruta absoluta del archivo pedido, o `undefined` si la ruta no es válida o cae fuera de `directory`. */
function resolveInside(directory: string, requestTarget: string): string | undefined {
  const [rawPath = ''] = requestTarget.split(/[?#]/);
  if (!rawPath.startsWith('/')) return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return undefined;
  }
  if (decoded.includes('\0')) return undefined;
  const root = resolve(directory);
  const file = resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
  return file.startsWith(root + sep) ? file : undefined;
}

function reply(response: ServerResponse, status: number, headers: Record<string, string> = {}) {
  response.writeHead(status, headers);
  response.end();
}

async function serve(directory: string, request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return reply(response, 405, { Allow: ALLOWED_METHODS });
  }
  const file = resolveInside(directory, request.url ?? '');
  if (file === undefined) return reply(response, 404);
  try {
    const content = await readFile(file);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(file)] ?? FALLBACK_CONTENT_TYPE,
      'Content-Length': content.length,
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const missing = code === 'ENOENT' || code === 'ENOTDIR' || code === 'EISDIR';
    reply(response, missing ? 404 : 500);
  }
}

/** Sirve los archivos de `directory` por GET y HEAD, escuchando solo en `LOCAL_ADDRESS`. */
export function startStaticServer({ directory, port, api }: StaticServerOptions): Promise<Server> {
  const server = createServer((request, response) => {
    const handler = api !== undefined && isApiRequest(request.url ?? '') ? api : undefined;
    void (handler?.(request, response) ?? serve(directory, request, response));
  });
  return new Promise((resolveServer, rejectServer) => {
    server.once('error', rejectServer);
    server.listen(port, LOCAL_ADDRESS, () => {
      server.off('error', rejectServer);
      resolveServer(server);
    });
  });
}
