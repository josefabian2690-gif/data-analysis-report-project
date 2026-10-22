import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import type { MotivoRechazo } from '../../src/dominio/carga';
import { archivoCsv, csv, elegir, gastosDeJulio, hayTablero, valorDe } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

describe('página del tablero', () => {
  it('muestra al analista el título del tablero como encabezado', () => {
    render(<App historial={crearHistorialFalso()} />);

    expect(screen.getByRole('heading', { name: textos.titulo })).toBeInTheDocument();
  });

  it('al abrirla ofrece el control para elegir un CSV y todavía no hay KPIs', () => {
    render(<App historial={crearHistorialFalso()} />);

    expect(screen.getByLabelText(textos.elegirCsv)).toBeInTheDocument();
    expect(hayTablero()).toBe(false);
  });
});

describe('rechazo de la carga', () => {
  it('un CSV sin la columna monto muestra un rechazo que nombra monto y ningún KPI', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(csv('fecha,concepto', ['2026-07-03 10:00:00,Café'])));

    const rechazo = await screen.findByRole('alert');
    expect(rechazo).toHaveTextContent(textos.rechazo['faltan-columnas'](['monto']));
    expect(rechazo).toHaveTextContent('monto');
    expect(hayTablero()).toBe(false);
  });

  it('nombra todas las columnas que faltan', async () => {
    render(<App historial={crearHistorialFalso()} />);

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
      render(<App historial={crearHistorialFalso()} />);

      await elegir(archivoCsv(texto));

      const rechazo = await screen.findByRole('alert');
      expect(rechazo).toHaveTextContent(textos.rechazo[codigo]);
      expect(hayTablero()).toBe(false);
    },
  );

  it('tras un rechazo el analista elige otro archivo y lo carga sin recargar la página', async () => {
    render(<App historial={crearHistorialFalso()} />);
    await elegir(archivoCsv(csv('fecha,concepto', ['2026-07-03 10:00:00,Café'])));
    await screen.findByRole('alert');

    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));

    expect(await screen.findByRole('group', { name: textos.kpis.gastoTotal })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('archivo que no se puede leer', () => {
  it('avisa con una alerta y deja de mostrar el mes anterior, que ya no es el que eligió el analista', async () => {
    render(<App historial={crearHistorialFalso()} />);
    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    const sinDescargar = Object.assign(archivoCsv('x'), {
      text: () => Promise.reject(new Error('el archivo no está descargado')),
    });

    await elegir(sinDescargar);

    expect(await screen.findByRole('alert')).toHaveTextContent(textos.lecturaFallida);
    expect(hayTablero()).toBe(false);
  });
});

describe('dos elecciones seguidas', () => {
  it('cuenta solo la última aunque la primera termine de leerse después', async () => {
    render(<App historial={crearHistorialFalso()} />);
    let terminarLecturaLenta: (texto: string) => void = () => undefined;
    const textoLento = csv('fecha,monto,concepto', ['2026-07-03 10:00:00,100,Café']);
    const lento = Object.assign(archivoCsv(textoLento), {
      text: () => new Promise<string>((resolver) => (terminarLecturaLenta = resolver)),
    });
    const rapido = archivoCsv(csv('fecha,monto,concepto', ['2026-07-03 10:00:00,900,Renta']));
    await elegir(lento);
    await elegir(rapido);
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$900.00');

    await act(async () => terminarLecturaLenta(textoLento));

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$900.00');
  });
});
