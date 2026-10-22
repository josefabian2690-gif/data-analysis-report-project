import { request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface Respuesta {
  estado: number;
  cabeceras: Record<string, string | string[] | undefined>;
  cuerpo: string;
}

export function puertoDe(servidor: Server): number {
  return (servidor.address() as AddressInfo).port;
}

// Se usa node:http y no fetch: fetch normaliza `..` y `%2e%2e` antes de enviar la ruta.
export function pedir(destino: Server | number, metodo: string, ruta: string): Promise<Respuesta> {
  const puerto = typeof destino === 'number' ? destino : puertoDe(destino);
  return new Promise((resolver, rechazar) => {
    const peticion = request(
      { host: '127.0.0.1', port: puerto, method: metodo, path: ruta, agent: false },
      (respuesta) => {
        const trozos: Buffer[] = [];
        respuesta.on('data', (trozo: Buffer) => trozos.push(trozo));
        respuesta.on('end', () =>
          resolver({
            estado: respuesta.statusCode ?? 0,
            cabeceras: respuesta.headers,
            cuerpo: Buffer.concat(trozos).toString('utf8'),
          }),
        );
      },
    );
    peticion.on('error', rechazar);
    peticion.end();
  });
}

export function cerrar(servidor: Server): Promise<void> {
  return new Promise((resolver) => {
    servidor.close(() => resolver());
    servidor.closeAllConnections();
  });
}
