import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import type { MotivoRechazo } from '../../src/dominio/carga';
import { archivoCsv, csv, elegir, gastosDeJulio, hayTablero } from './ayudas';

describe('página del tablero', () => {
  it('muestra al analista el título del tablero como encabezado', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: textos.titulo })).toBeInTheDocument();
  });

  it('al abrirla ofrece el control para elegir un CSV y todavía no hay KPIs', () => {
    render(<App />);

    expect(screen.getByLabelText(textos.elegirCsv)).toBeInTheDocument();
    expect(hayTablero()).toBe(false);
  });
});

describe('rechazo de la carga', () => {
  it('un CSV sin la columna monto muestra un rechazo que nombra monto y ningún KPI', async () => {
    render(<App />);

    await elegir(archivoCsv(csv('fecha,concepto', ['2026-07-03 10:00:00,Café'])));

    const rechazo = await screen.findByRole('alert');
    expect(rechazo).toHaveTextContent(textos.rechazo['faltan-columnas'](['monto']));
    expect(rechazo).toHaveTextContent('monto');
    expect(hayTablero()).toBe(false);
  });

  it('nombra todas las columnas que faltan', async () => {
    render(<App />);

    await elegir(archivoCsv(csv('concepto', ['Café'])));

    const rechazo = await screen.findByRole('alert');
    expect(rechazo).toHaveTextContent(textos.rechazo['faltan-columnas'](['fecha', 'monto']));
  });

  const casos: [Exclude<MotivoRechazo['codigo'], 'faltan-columnas'>, string][] = [
    ['vacio', ''],
    ['sin-filas', 'fecha,monto,concepto'],
    ['sin-filas-validas', csv('fecha,monto,concepto', ['no-es-fecha,abc,Café'])],
  ];
  it.each(casos)(
    'el rechazo «%s» le dice al analista por qué no sirve su archivo',
    async (codigo, texto) => {
      render(<App />);

      await elegir(archivoCsv(texto));

      const rechazo = await screen.findByRole('alert');
      expect(rechazo).toHaveTextContent(textos.rechazo[codigo]);
      expect(hayTablero()).toBe(false);
    },
  );

  it('tras un rechazo el analista elige otro archivo y lo carga sin recargar la página', async () => {
    render(<App />);
    await elegir(archivoCsv(csv('fecha,concepto', ['2026-07-03 10:00:00,Café'])));
    await screen.findByRole('alert');

    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));

    expect(await screen.findByRole('group', { name: textos.kpis.gastoTotal })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
