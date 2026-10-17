import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

import { textos } from '../../src/cliente/textos';
import { archivoCsv, csv } from './ayudas';

export const ENCABEZADO = 'fecha,monto,concepto,categoria,cuenta,zona';

export function csvDeGastos(filas: string[]): File {
  return archivoCsv(csv(ENCABEZADO, filas));
}

export function tablaDeTransacciones(): Promise<HTMLElement> {
  return screen.findByRole('table', { name: textos.tabla.nombre });
}

export function filasDeDatos(tabla: HTMLElement): HTMLElement[] {
  return within(tabla).getAllByRole('row').slice(1);
}

export function celdasDe(fila: HTMLElement): string[] {
  return within(fila)
    .getAllByRole('cell')
    .map((celda) => celda.textContent ?? '');
}

export function conceptosDe(tabla: HTMLElement): string[] {
  return filasDeDatos(tabla).map((fila) => celdasDe(fila)[1] ?? '');
}

export function ordenAnunciado(tabla: HTMLElement, columna: string): string | null {
  return within(tabla).getByRole('columnheader', { name: columna }).getAttribute('aria-sort');
}

export function ordenarPor(usuario: UserEvent, tabla: HTMLElement, columna: string) {
  return usuario.click(within(tabla).getByRole('button', { name: columna }));
}

export function textoDePagina(): string {
  return screen.getByText(/^Página \d+ de \d+$/).textContent ?? '';
}

/**
 * `n` gastos del 1 de julio de 2026, uno por minuto desde las 08:00, con categoría alterna:
 * el gasto `k` (de 1 a n) se llama «Gasto k», es de Comida si `k` es impar y de Ocio si es par.
 */
export function gastosAlternados(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const hora = String(8 + Math.floor(i / 60)).padStart(2, '0');
    const minuto = String(i % 60).padStart(2, '0');
    const categoria = i % 2 === 0 ? 'Comida' : 'Ocio';
    return `2026-07-01 ${hora}:${minuto}:00,${i + 1},Gasto ${i + 1},${categoria},Débito,Centro`;
  });
}
