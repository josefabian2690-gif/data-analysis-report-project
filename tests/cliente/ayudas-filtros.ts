import { screen, within } from '@testing-library/react';

import { archivoCsv, csv } from './ayudas';

/**
 * Cuatro gastos de julio de 2026 con cifras hechas a mano:
 * total 1,200; Comida suma 400 en 2 gastos; del 10 al 20 hay 3 gastos que suman 1,100 en 11 días.
 */
export function gastosDeJulioConDimensiones(): File {
  return archivoCsv(
    csv('fecha,monto,concepto,categoria,cuenta,zona', [
      '2026-07-03 10:00:00,100,Café,Comida,Débito,Centro',
      '2026-07-10 10:00:00,200,Cine,Ocio,Crédito,Roma',
      '2026-07-17 10:00:00,300,Súper,Comida,Crédito,Centro',
      '2026-07-20 10:00:00,600,Renta,Hogar,Débito,Roma',
    ]),
  );
}

/** Un gasto de agosto con una categoría que julio no tiene. */
export function gastoDeAgosto(): File {
  return archivoCsv(
    csv('fecha,monto,concepto,categoria,cuenta,zona', [
      '2026-08-05 10:00:00,50,Taxi,Transporte,Efectivo,Condesa',
    ]),
  );
}

export function dimension(nombre: string): HTMLElement {
  return screen.getByRole('group', { name: nombre });
}

/** Nombres de las casillas de una dimensión, en el orden en que se ofrecen. */
export function casillasDe(nombre: string): string[] {
  return within(dimension(nombre))
    .getAllByRole('checkbox')
    .map((casilla) => casilla.closest('label')?.textContent ?? '');
}

export function casillasMarcadas(): HTMLElement[] {
  return screen.queryAllByRole('checkbox', { checked: true });
}

export function diasOfrecidos(lista: string): string[] {
  const control = screen.getByRole('combobox', { name: lista });
  return within(control)
    .getAllByRole('option')
    .map((opcion) => opcion.textContent ?? '');
}
