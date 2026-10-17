import { screen, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

import { textos } from '../../src/cliente/textos';
import { parsearCsv } from '../../src/dominio/carga';
import type { Transaccion } from '../../src/dominio/esquema';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import semilla2 from '../fixtures/generador/2026-08-semilla-2.csv?raw';
import semilla3 from '../fixtures/generador/2026-09-semilla-3.csv?raw';

export const JULIO = '2026-07';
export const AGOSTO = '2026-08';
export const SEPTIEMBRE = '2026-09';

/** Un gasto del día 10 de `mes`; `n` hace único el id dentro del mes. */
export function gasto(mes: string, n: number, categoria: string, monto: number): Transaccion {
  return {
    id: `TX${String(n).padStart(6, '0')}`,
    dia: `${mes}-10`,
    hora: '10:00:00',
    monto,
    concepto: `Gasto ${n}`,
    categoria,
    cuenta: 'Débito',
    zona: 'Centro',
    latitud: null,
    longitud: null,
  };
}

function delMes(mes: string, categorias: [string, number][]): Transaccion[] {
  return categorias.map(([categoria, monto], i) => gasto(mes, i + 1, categoria, monto));
}

/** Julio: total 450.50. Es el único con Salud. */
export const JULIO_A_MANO = delMes(JULIO, [
  ['Comida', 100],
  ['Compras', 300.5],
  ['Salud', 50],
]);

/** Agosto: total 330.50. Es el primero con Viajes. */
export const AGOSTO_A_MANO = delMes(AGOSTO, [
  ['Comida', 150],
  ['Compras', 100.5],
  ['Viajes', 80],
]);

/** Septiembre: total 460.50. Es el único con Entretenimiento. */
export const SEPTIEMBRE_A_MANO = delMes(SEPTIEMBRE, [
  ['Comida', 300],
  ['Compras', 100.5],
  ['Viajes', 40],
  ['Entretenimiento', 20],
]);

/** Los tres meses del generador tal como la carga del tablero los guardaría. */
export function fixturesDelGenerador(): Record<string, Transaccion[]> {
  return {
    [JULIO]: parsearCsv(semilla1).transacciones,
    [AGOSTO]: parsearCsv(semilla2).transacciones,
    [SEPTIEMBRE]: parsearCsv(semilla3).transacciones,
  };
}

export const MESES_A_MANO = {
  [JULIO]: JULIO_A_MANO,
  [AGOSTO]: AGOSTO_A_MANO,
  [SEPTIEMBRE]: SEPTIEMBRE_A_MANO,
};

export function seccionDeLaComparacion(): HTMLElement {
  return screen.getByRole('region', { name: textos.comparacion.titulo });
}

export function selectorDeMes(nombre: string): HTMLElement {
  return within(seccionDeLaComparacion()).getByRole('combobox', { name: nombre });
}

export async function elegirMeses(
  usuario: ReturnType<typeof userEvent.setup>,
  base: string,
  comparado: string,
) {
  await usuario.selectOptions(selectorDeMes(textos.comparacion.mesBase), base);
  await usuario.selectOptions(selectorDeMes(textos.comparacion.mesAComparar), comparado);
}

/** La tabla de la comparación entre los dos meses rotulados, en su orden cronológico. */
export function tablaDeLaComparacion(anterior: string, posterior: string): Promise<HTMLElement> {
  return screen.findByRole('table', { name: textos.comparacion.tabla(anterior, posterior) });
}

/** Cada fila del cuerpo: su encabezado de fila y sus celdas. */
export function filasDe(tabla: HTMLElement): string[][] {
  return within(tabla)
    .getAllByRole('row')
    .slice(1)
    .map((fila) => [
      ...within(fila)
        .getAllByRole('rowheader')
        .map((celda) => celda.textContent ?? ''),
      ...within(fila)
        .getAllByRole('cell')
        .map((celda) => celda.textContent ?? ''),
    ]);
}

export function filaDe(tabla: HTMLElement, nombre: string): string[] {
  const fila = filasDe(tabla).find(([encabezado]) => encabezado === nombre);
  if (fila === undefined) throw new Error(`la tabla no tiene la fila ${nombre}`);
  return fila;
}
