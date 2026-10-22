import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import invalidas from '../fixtures/a-mano/invalidas.csv?raw';
import { archivoCsv, csv, elegir, gastosDeJulio, hayTablero } from './ayudas';

describe('confirmación con más del 5 % de filas inválidas (R-05)', () => {
  it('dice qué proporción es inválida y no muestra el tablero hasta que el analista confirma', async () => {
    render(<App />);

    await elegir(archivoCsv(invalidas));

    expect(await screen.findByText(textos.confirmacion.aviso('60.0%'))).toBeInTheDocument();
    expect(hayTablero()).toBe(false);
    expect(screen.queryByRole('group', { name: textos.resumen.mes })).toBeNull();
  });

  it('al confirmar muestra el resumen con las filas inválidas y el tablero', async () => {
    render(<App />);
    const usuario = await elegir(archivoCsv(invalidas));

    await usuario.click(await screen.findByRole('button', { name: textos.confirmacion.confirmar }));

    expect(await screen.findByRole('group', { name: textos.kpis.gastoTotal })).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: textos.resumen.tablaDeInvalidas }),
    ).toBeInTheDocument();
    expect(screen.queryByText(textos.confirmacion.aviso('60.0%'))).toBeNull();
  });

  it('al cancelar vuelve al estado inicial sin KPIs y deja elegir el mismo archivo otra vez', async () => {
    render(<App />);
    const archivo = archivoCsv(invalidas);
    const usuario = await elegir(archivo);

    await usuario.click(await screen.findByRole('button', { name: textos.confirmacion.cancelar }));

    expect(screen.queryByRole('button', { name: textos.confirmacion.confirmar })).toBeNull();
    expect(hayTablero()).toBe(false);
    expect(screen.getByLabelText(textos.elegirCsv)).toBeInTheDocument();

    await usuario.upload(screen.getByLabelText(textos.elegirCsv), archivo);

    expect(
      await screen.findByRole('button', { name: textos.confirmacion.confirmar }),
    ).toBeInTheDocument();
  });

  it('con exactamente el 5 % de filas inválidas no pide confirmación', async () => {
    const filas = gastosDeJulio(40);
    filas[0] = '2026-07-01 08:00:00,abc,Gasto 1';
    filas[1] = '2026-07-01 08:00:00,abc,Gasto 2';
    render(<App />);

    await elegir(archivoCsv(csv('fecha,monto,concepto', filas)));

    expect(await screen.findByRole('group', { name: textos.kpis.gastoTotal })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: textos.confirmacion.confirmar })).toBeNull();
  });
});
