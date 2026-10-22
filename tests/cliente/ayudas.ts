import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { textos } from '../../src/cliente/textos';

export function archivoCsv(texto: string, nombre = 'gastos.csv'): File {
  return new File([texto], nombre, { type: 'text/csv' });
}

/** Une el encabezado y las filas con saltos de línea `\n`. */
export function csv(encabezado: string, filas: string[]): string {
  return [encabezado, ...filas].join('\n');
}

/** `n` gastos de julio de 2026 sin id: la fila de datos `k` ocupa la fila `k + 1` del archivo. */
export function gastosDeJulio(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `2026-07-01 08:00:00,10.00,Gasto ${i + 1}`);
}

/** `n` gastos de agosto de 2026 sin id, como `gastosDeJulio`. */
export function gastosDeAgosto(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `2026-08-01 08:00:00,10.00,Gasto ${i + 1}`);
}

export async function elegir(archivo: File) {
  const usuario = userEvent.setup();
  await usuario.upload(screen.getByLabelText(textos.elegirCsv), archivo);
  return usuario;
}

export function kpi(nombre: string): HTMLElement {
  return screen.getByRole('group', { name: nombre });
}

export function hayTablero(): boolean {
  return screen.queryByRole('group', { name: textos.kpis.gastoTotal }) !== null;
}

/** Lo que muestra el dato nombrado `nombre`, sin su etiqueta. */
export function valorDe(nombre: string): string {
  return (kpi(nombre).textContent ?? '').replace(nombre, '').trim();
}
