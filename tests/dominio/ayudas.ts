import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CargaRechazada, parsearCsv } from '../../src/dominio/carga';

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
