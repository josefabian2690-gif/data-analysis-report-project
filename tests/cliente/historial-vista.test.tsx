import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import type { Transaccion } from '../../src/dominio/esquema';
import invalidas from '../fixtures/a-mano/invalidas.csv?raw';
import { archivoCsv, csv, elegir, gastosDeJulio, hayTablero, valorDe } from './ayudas';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';
import { crearHistorialFalso } from './historial-falso';

const JULIO_GUARDADO: Transaccion = {
  id: 'TX900001',
  dia: '2026-07-20',
  hora: '09:00:00',
  monto: 99,
  concepto: 'Versión guardada antes',
  categoria: 'Sin categoría',
  cuenta: 'Sin cuenta',
  zona: 'Sin zona',
  latitud: null,
  longitud: null,
};

function botonDeVista(nombre: string): HTMLElement {
  return within(screen.getByRole('group', { name: textos.vistas.nombre })).getByRole('button', {
    name: nombre,
  });
}

function tablaDeMeses(): HTMLElement {
  return screen.getByRole('table', { name: textos.historial.tabla });
}

/** Las celdas de cada fila de la tabla de meses, sin la fila de encabezados. */
function filasDeMeses(): string[][] {
  return within(tablaDeMeses())
    .getAllByRole('row')
    .slice(1)
    .map((fila) =>
      within(fila)
        .getAllByRole('cell')
        .map((celda) => celda.textContent ?? ''),
    );
}

describe('el control de vistas', () => {
  it('ofrece «Tablero del mes» e «Historial» y marca la activa; empieza en el tablero', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    expect(botonDeVista(textos.vistas.tablero)).toHaveAttribute('aria-pressed', 'true');
    expect(botonDeVista(textos.vistas.historial)).toHaveAttribute('aria-pressed', 'false');

    await usuario.click(botonDeVista(textos.vistas.historial));

    expect(botonDeVista(textos.vistas.tablero)).toHaveAttribute('aria-pressed', 'false');
    expect(botonDeVista(textos.vistas.historial)).toHaveAttribute('aria-pressed', 'true');
  });

  it('en la vista de historial el tablero deja el árbol accesible, y en la del tablero lo deja el historial', async () => {
    render(<App historial={crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] })} />);
    const usuario = await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    expect(screen.queryByRole('table', { name: textos.historial.tabla })).toBeNull();

    await usuario.click(botonDeVista(textos.vistas.historial));

    expect(hayTablero()).toBe(false);
    expect(await screen.findByRole('table', { name: textos.historial.tabla })).toBeVisible();
  });
});

describe('la tabla de meses guardados', () => {
  it('trae una fila por mes con el mes en es-MX, las transacciones con miles y el total en pesos', async () => {
    const historial = Object.assign(crearHistorialFalso(), {
      listar: async () => [
        { mes: '2026-07', filas: 2000, total: 1689470.6699999995 },
        { mes: '2026-08', filas: 1800, total: 1544622.78 },
      ],
    });
    render(<App historial={historial} />);
    const usuario = userEvent.setup();

    await usuario.click(botonDeVista(textos.vistas.historial));

    await waitFor(() =>
      expect(filasDeMeses()).toEqual([
        ['julio de 2026', '2,000', '$1,689,470.67'],
        ['agosto de 2026', '1,800', '$1,544,622.78'],
      ]),
    );
    const encabezados = within(tablaDeMeses()).getAllByRole('columnheader');
    expect(encabezados.map((encabezado) => encabezado.textContent)).toEqual([
      textos.historial.columnas.mes,
      textos.historial.columnas.transacciones,
      textos.historial.columnas.total,
    ]);
  });

  it('sin meses guardados lo dice en lugar de mostrar una tabla vacía', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await userEvent.setup().click(botonDeVista(textos.vistas.historial));

    expect(await screen.findByText(textos.historial.vacio)).toBeVisible();
    expect(screen.queryByRole('table', { name: textos.historial.tabla })).toBeNull();
  });

  it('tras guardar un mes, la tabla de meses lo trae sin recargar la página', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await screen.findByText(textos.guardado.guardado('julio de 2026'));

    await usuario.click(botonDeVista(textos.vistas.historial));

    await waitFor(() => expect(filasDeMeses()).toEqual([['julio de 2026', '3', '$30.00']]));
  });

  it('se actualiza al reemplazar un mes con la versión nueva', async () => {
    render(<App historial={crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] })} />);
    const usuario = await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await usuario.click(await screen.findByRole('button', { name: textos.guardado.reemplazar }));
    await screen.findByText(textos.guardado.reemplazado('julio de 2026'));

    await usuario.click(botonDeVista(textos.vistas.historial));

    await waitFor(() => expect(filasDeMeses()).toEqual([['julio de 2026', '3', '$30.00']]));
  });
});

describe('respuestas de la lista que llegan tarde', () => {
  it('la lista pedida al abrir la página, si llega después de un guardado, no pisa la lista nueva', async () => {
    const historial = crearHistorialFalso();
    const listarDeVerdad = historial.listar;
    let pedidas = 0;
    let responderLaPrimera: () => void = () => undefined;
    historial.listar = () => {
      pedidas += 1;
      if (pedidas > 1) return listarDeVerdad();
      return new Promise((resolver) => {
        responderLaPrimera = () => resolver([]);
      });
    };
    render(<App historial={historial} />);
    const usuario = await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await usuario.click(botonDeVista(textos.vistas.historial));
    await waitFor(() => expect(filasDeMeses()).toEqual([['julio de 2026', '3', '$30.00']]));

    await act(async () => responderLaPrimera());

    expect(filasDeMeses()).toEqual([['julio de 2026', '3', '$30.00']]);
  });
});

describe('cargar un CSV con la vista de historial abierta', () => {
  it('una carga aceptada deja a la vista el resumen, los KPIs y el tablero del mes', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = userEvent.setup();
    await usuario.click(botonDeVista(textos.vistas.historial));

    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));

    expect(await screen.findByRole('group', { name: textos.kpis.gastoTotal })).toBeVisible();
    expect(screen.getByRole('heading', { name: textos.resumen.titulo })).toBeVisible();
    expect(botonDeVista(textos.vistas.tablero)).toHaveAttribute('aria-pressed', 'true');
  });

  it('con la confirmación de R-05, al confirmar quedan a la vista el resumen y el tablero', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = userEvent.setup();
    await usuario.click(botonDeVista(textos.vistas.historial));
    await elegir(archivoCsv(invalidas));

    await usuario.click(await screen.findByRole('button', { name: textos.confirmacion.confirmar }));

    expect(await screen.findByRole('group', { name: textos.kpis.gastoTotal })).toBeVisible();
    expect(screen.getByRole('heading', { name: textos.resumen.titulo })).toBeVisible();
  });

  it('un archivo rechazado se ve igual, sin cambiar de vista', async () => {
    render(<App historial={crearHistorialFalso()} />);
    await userEvent.setup().click(botonDeVista(textos.vistas.historial));

    await elegir(archivoCsv(csv('fecha,concepto', ['2026-07-03 10:00:00,Café'])));

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(botonDeVista(textos.vistas.historial)).toHaveAttribute('aria-pressed', 'true');
  });

  it('un archivo ilegible se ve igual, sin cambiar de vista', async () => {
    render(<App historial={crearHistorialFalso()} />);
    await userEvent.setup().click(botonDeVista(textos.vistas.historial));
    const sinDescargar = Object.assign(archivoCsv('x'), {
      text: () => Promise.reject(new Error('el archivo no está descargado')),
    });

    await elegir(sinDescargar);

    expect(await screen.findByRole('alert')).toHaveTextContent(textos.lecturaFallida);
    expect(botonDeVista(textos.vistas.historial)).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('cuando el historial no está disponible', () => {
  it('la vista lo dice y cargar un CSV sigue dando el tablero y su aviso de guardado', async () => {
    const historial = crearHistorialFalso();
    historial.fallar.listar = true;
    render(<App historial={historial} />);
    const usuario = await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });

    await usuario.click(botonDeVista(textos.vistas.historial));

    expect(await screen.findByText(textos.historial.noDisponible)).toBeVisible();
    expect(screen.queryByRole('table', { name: textos.historial.tabla })).toBeNull();
    await usuario.click(botonDeVista(textos.vistas.tablero));
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$30.00');
    expect(screen.getByRole('status', { name: textos.guardado.region })).toHaveTextContent(
      textos.guardado.guardado('julio de 2026'),
    );
  });
});

describe('cambiar de vista no borra el trabajo', () => {
  it('al volver al tablero siguen el mes cargado y su filtro', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$400.00');

    await usuario.click(botonDeVista(textos.vistas.historial));
    await usuario.click(botonDeVista(textos.vistas.tablero));

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$400.00');
    expect(valorDe(textos.kpis.transacciones)).toBe('2');
    expect(screen.getByRole('checkbox', { name: 'Comida' })).toBeChecked();
  });
});
