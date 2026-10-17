import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import { archivoCsv, csv, elegir, valorDe } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

it('con tres gastos de 100, 200 y 600 el analista lee los cinco KPIs en MXN', async () => {
  render(<App historial={crearHistorialFalso()} />);

  await elegir(
    archivoCsv(
      csv('fecha,monto,concepto', [
        '2026-07-03 10:00:00,100,Café',
        '2026-07-10 10:00:00,200,Comida',
        '2026-07-17 10:00:00,600,Renta',
      ]),
    ),
  );

  await screen.findByRole('group', { name: textos.kpis.gastoTotal });
  expect(valorDe(textos.kpis.gastoTotal)).toBe('$900.00');
  expect(valorDe(textos.kpis.transacciones)).toBe('3');
  expect(valorDe(textos.kpis.ticketPromedio)).toBe('$300.00');
  expect(valorDe(textos.kpis.mediana)).toBe('$200.00');
  expect(valorDe(textos.kpis.gastoPromedioPorDia)).toBe('$29.03');
});

it('con el fixture de semilla 1 lee 2,000 transacciones y un gasto total de $1,689,470.67', async () => {
  const { default: semilla1 } = await import('../fixtures/generador/2026-07-semilla-1.csv?raw');
  render(<App historial={crearHistorialFalso()} />);

  await elegir(archivoCsv(semilla1));

  await screen.findByRole('group', { name: textos.kpis.gastoTotal });
  expect(valorDe(textos.kpis.transacciones)).toBe('2,000');
  expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,689,470.67');
});
