import { readFileSync } from 'node:fs';
import { request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { parsearCsv } from '../../src/dominio/carga';
import type { Transaccion } from '../../src/dominio/esquema';

export interface Respuesta {
  estado: number;
  cabeceras: Record<string, string | string[] | undefined>;
  cuerpo: string;
}

export function puertoDe(servidor: Server): number {
  return (servidor.address() as AddressInfo).port;
}

export interface OpcionesDePeticion {
  cuerpo?: string;
  encabezados?: Record<string, string>;
}

// Se usa node:http y no fetch: fetch normaliza `..` y `%2e%2e` antes de enviar la ruta.
export function pedir(
  destino: Server | number,
  metodo: string,
  ruta: string,
  { cuerpo, encabezados }: OpcionesDePeticion = {},
): Promise<Respuesta> {
  const puerto = typeof destino === 'number' ? destino : puertoDe(destino);
  return new Promise((resolver, rechazar) => {
    const peticion = request(
      {
        host: '127.0.0.1',
        port: puerto,
        method: metodo,
        path: ruta,
        agent: false,
        headers: encabezados,
      },
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
    peticion.end(cuerpo);
  });
}

export function cerrar(servidor: Server): Promise<void> {
  return new Promise((resolver) => {
    servidor.close(() => resolver());
    servidor.closeAllConnections();
  });
}

const CARPETA_DE_FIXTURES = fileURLToPath(new URL('../fixtures/generador/', import.meta.url));

export function transaccionesDelFixture(archivo: string): Transaccion[] {
  return parsearCsv(readFileSync(CARPETA_DE_FIXTURES + archivo, 'utf8')).transacciones;
}

export const JULIO = '2026-07-semilla-1.csv';
export const AGOSTO = '2026-08-semilla-2.csv';
export const SEPTIEMBRE = '2026-09-semilla-3.csv';

export function unaTransaccion(id: string, dia: string, monto = 100): Transaccion {
  return {
    id,
    dia,
    hora: '12:00:00',
    monto,
    concepto: 'Compra de prueba',
    categoria: 'Compras',
    cuenta: 'Efectivo',
    zona: 'Centro',
    latitud: null,
    longitud: null,
  };
}
