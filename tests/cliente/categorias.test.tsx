import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import esperado from '../fixtures/generador/2026-07-semilla-1.esperado.json';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, csv, elegir } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

async function filasDeCategorias(): Promise<HTMLElement[]> {
  const tabla = await screen.findByRole('table', { name: textos.categorias.tabla });
  return within(tabla).getAllByRole('row').slice(1);
}

function celdas(fila: HTMLElement): string[] {
  return within(fila)
    .getAllByRole('cell')
    .map((celda) => (celda.textContent ?? '').replace(textos.categorias.dominante, '').trim());
}

describe('gasto por categoría', () => {
  it('lista las categorías de mayor a menor monto con su monto y su porcentaje', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await elegir(
      archivoCsv(
        csv('fecha,monto,concepto,categoria', [
          '2026-07-03 10:00:00,100,Café,Comida',
          '2026-07-10 10:00:00,600,Vuelo,Viajes',
          '2026-07-17 10:00:00,300,Consulta,Salud',
        ]),
      ),
    );

    const filas = await filasDeCategorias();
    expect(filas.map(celdas)).toEqual([
      ['Viajes', '$600.00', '60.0%'],
      ['Salud', '$300.00', '30.0%'],
      ['Comida', '$100.00', '10.0%'],
    ]);
  });

  it('marca como dominante solo la primera categoría', async () => {
    render(<App historial={crearHistorialFalso()} />);
    await elegir(
      archivoCsv(
        csv('fecha,monto,concepto,categoria', [
          '2026-07-03 10:00:00,100,Café,Comida',
          '2026-07-10 10:00:00,600,Vuelo,Viajes',
        ]),
      ),
    );

    const [primera, segunda] = await filasDeCategorias();

    expect(primera).toHaveTextContent(textos.categorias.dominante);
    expect(segunda).not.toHaveTextContent(textos.categorias.dominante);
  });

  it('con el fixture de semilla 1 la primera es la categoría dominante de su esperado, marcada', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(semilla1));

    const [primera] = await filasDeCategorias();
    expect(primera).toHaveTextContent(esperado.categoriaDominante);
    expect(primera).toHaveTextContent(textos.categorias.dominante);
    expect(esperado.categoriaDominante).toBe('Compras');
  });
});
