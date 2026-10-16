import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CargaRechazada, parsearCsv } from '../../src/dominio/carga';
import type { Transaccion } from '../../src/dominio/esquema';

const DIRECTORIO_A_MANO = fileURLToPath(new URL('../fixtures/a-mano/', import.meta.url));

export const ENCABEZADO_MINIMO = 'fecha,monto,concepto';

export function csv(encabezado: string, ...filas: string[]): string {
  return [encabezado, ...filas].join('\n') + '\n';
}

export function leerFixtureAMano(nombre: string): string {
  return readFileSync(`${DIRECTORIO_A_MANO}${nombre}`, 'utf-8');
}

export function rechazoDe(texto: string): CargaRechazada {
  try {
    parsearCsv(texto);
  } catch (error) {
    if (error instanceof CargaRechazada) return error;
    throw error;
  }
  throw new Error('la carga no se rechazó');
}

export function gasto(parcial: Partial<Transaccion> & Pick<Transaccion, 'monto'>): Transaccion {
  return {
    id: 'TX000001',
    dia: '2026-07-01',
    hora: null,
    concepto: 'Gasto',
    categoria: 'Sin categoría',
    cuenta: 'Sin cuenta',
    zona: 'Sin zona',
    latitud: null,
    longitud: null,
    ...parcial,
  };
}

export function gastosDe(montos: number[], resto: Partial<Transaccion> = {}): Transaccion[] {
  return montos.map((monto, i) =>
    gasto({ ...resto, monto, id: `TX${String(i + 1).padStart(6, '0')}` }),
  );
}
