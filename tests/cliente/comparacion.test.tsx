import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import type { Transaccion } from '../../src/dominio/esquema';
import { archivoCsv, csv, elegir } from './ayudas';
import {
  AGOSTO,
  AGOSTO_A_MANO,
  JULIO,
  JULIO_A_MANO,
  MESES_A_MANO,
  SEPTIEMBRE,
  elegirMeses,
  filaDe,
  filasDe,
  fixturesDelGenerador,
  seccionDeLaComparacion,
  selectorDeMes,
  tablaDeLaComparacion,
} from './ayudas-comparacion';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';
import { crearHistorialFalso, type HistorialFalso } from './historial-falso';

const JULIO_ROTULO = 'julio de 2026';
const AGOSTO_ROTULO = 'agosto de 2026';
const SEPTIEMBRE_ROTULO = 'septiembre de 2026';

const { comparacion } = textos;

async function abrirElHistorial() {
  const usuario = userEvent.setup();
  await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));
  return usuario;
}

async function historialAbierto(historial: HistorialFalso) {
  render(<App historial={historial} />);
  return abrirElHistorial();
}

describe('R-15: la comparación por defecto', () => {
  it('con tres meses guardados compara el penúltimo contra el último, con las cifras de los fixtures', async () => {
    await historialAbierto(crearHistorialFalso(fixturesDelGenerador()));

    const tabla = await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    expect(filaDe(tabla, comparacion.total)).toEqual([
      comparacion.total,
      '$1,544,622.78',
      '$1,278,296.56',
      '-$266,326.22',
      '-17.2%',
    ]);
    expect(selectorDeMes(comparacion.mesBase)).toHaveValue(AGOSTO);
    expect(selectorDeMes(comparacion.mesAComparar)).toHaveValue(SEPTIEMBRE);
  });

  it('elegir julio y agosto cambia la comparación: la fila de Compras trae sus cifras', async () => {
    const usuario = await historialAbierto(crearHistorialFalso(fixturesDelGenerador()));
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    await elegirMeses(usuario, JULIO, AGOSTO);

    const tabla = await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(filaDe(tabla, 'Compras')).toEqual([
      'Compras',
      '$814,566.30',
      '$201,746.52',
      '-$612,819.78',
      '-75.2%',
    ]);
  });
});

describe('R-15: la tabla de la comparación', () => {
  it('trae una columna por mes con el mes en es-MX, la diferencia y la diferencia porcentual', async () => {
    await historialAbierto(crearHistorialFalso(MESES_A_MANO));

    const tabla = await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    expect(
      within(tabla)
        .getAllByRole('columnheader')
        .map((encabezado) => encabezado.textContent),
    ).toEqual([
      comparacion.columnas.categoria,
      AGOSTO_ROTULO,
      SEPTIEMBRE_ROTULO,
      comparacion.columnas.diferencia,
      comparacion.columnas.proporcion,
    ]);
  });

  it('una fila por categoría de mayor a menor monto del último mes, con signo, y el total al final con el rótulo del catálogo', async () => {
    await historialAbierto(crearHistorialFalso(MESES_A_MANO));

    const tabla = await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    expect(filasDe(tabla)).toEqual([
      ['Comida', '$150.00', '$300.00', '+$150.00', '+100.0%'],
      ['Compras', '$100.50', '$100.50', '$0.00', '0.0%'],
      ['Viajes', '$80.00', '$40.00', '-$40.00', '-50.0%'],
      ['Entretenimiento', '$0.00', '$20.00', '+$20.00', comparacion.sinProporcion],
      [comparacion.total, '$330.50', '$460.50', '+$130.00', '+39.3%'],
    ]);
  });

  it('R-15: una categoría que falta en un mes cuenta como 0; si era 0 el porcentaje dice el texto del catálogo, nunca NaN ni Infinity', async () => {
    const usuario = await historialAbierto(crearHistorialFalso(MESES_A_MANO));
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    await elegirMeses(usuario, JULIO, AGOSTO);

    const tabla = await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(filasDe(tabla)).toEqual([
      ['Comida', '$100.00', '$150.00', '+$50.00', '+50.0%'],
      ['Compras', '$300.50', '$100.50', '-$200.00', '-66.6%'],
      ['Viajes', '$0.00', '$80.00', '+$80.00', comparacion.sinProporcion],
      ['Salud', '$50.00', '$0.00', '-$50.00', '-100.0%'],
      [comparacion.total, '$450.50', '$330.50', '-$120.00', '-26.6%'],
    ]);
    expect(tabla.textContent).not.toMatch(/NaN|Infinity/);
  });

  it('el rótulo de la fila del total sale del catálogo, no del nombre de la clave del dominio', async () => {
    await historialAbierto(crearHistorialFalso(MESES_A_MANO));

    const tabla = await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    const ultima = within(tabla).getAllByRole('row').at(-1);
    expect(within(ultima as HTMLElement).getByRole('rowheader')).toHaveTextContent(
      comparacion.total,
    );
    expect(comparacion.total).not.toBe('Total');
  });
});

describe('R-15: elegir los meses', () => {
  it('ofrece en cada selector todos los meses guardados, con el mes en es-MX', async () => {
    await historialAbierto(crearHistorialFalso(MESES_A_MANO));
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    for (const nombre of [comparacion.mesBase, comparacion.mesAComparar]) {
      const opciones = within(selectorDeMes(nombre)).getAllByRole('option');
      expect(opciones.map((opcion) => opcion.textContent)).toEqual([
        JULIO_ROTULO,
        AGOSTO_ROTULO,
        SEPTIEMBRE_ROTULO,
      ]);
    }
  });

  it('un mes no se compara consigo mismo: dice que se elijan dos distintos y no muestra tabla', async () => {
    const usuario = await historialAbierto(crearHistorialFalso(MESES_A_MANO));
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    await usuario.selectOptions(selectorDeMes(comparacion.mesAComparar), AGOSTO);

    expect(within(seccionDeLaComparacion()).getByText(comparacion.mismoMes)).toBeVisible();
    expect(
      within(seccionDeLaComparacion()).queryByRole('table', { name: /^Gasto por categoría/ }),
    ).toBeNull();
    expect(
      screen.queryByRole('img', { name: /^Gráfico de columnas del gasto por categoría en/ }),
    ).toBeNull();
  });

  it('si el analista elige el mes más reciente como base, la tabla sigue en orden cronológico y su título lo dice', async () => {
    const usuario = await historialAbierto(crearHistorialFalso(MESES_A_MANO));
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    await elegirMeses(usuario, SEPTIEMBRE, JULIO);

    const tabla = await tablaDeLaComparacion(JULIO_ROTULO, SEPTIEMBRE_ROTULO);
    expect(filaDe(tabla, comparacion.total)).toEqual([
      comparacion.total,
      '$450.50',
      '$460.50',
      '+$10.00',
      '+2.2%',
    ]);
  });
});

describe('R-15: menos de dos meses guardados', () => {
  it.each([
    ['un solo mes', { [JULIO]: JULIO_A_MANO }],
    ['ningún mes', {}],
  ])('con %s dice que hacen falta dos y no muestra tabla ni selectores', async (_caso, inicial) => {
    await historialAbierto(crearHistorialFalso(inicial));

    expect(await screen.findByText(comparacion.faltanMeses)).toBeVisible();
    expect(
      within(seccionDeLaComparacion()).queryByRole('table', { name: /^Gasto por categoría/ }),
    ).toBeNull();
    expect(within(seccionDeLaComparacion()).queryByRole('combobox')).toBeNull();
  });

  it('al guardar el segundo mes la comparación aparece sin recargar la página', async () => {
    const historial = crearHistorialFalso({ [JULIO]: JULIO_A_MANO });
    render(<App historial={historial} />);
    const usuario = await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-08-03 10:00:00,100,Café,Comida'])),
    );
    await screen.findByText(textos.guardado.guardado(AGOSTO_ROTULO));

    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));

    const tabla = await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(filaDe(tabla, 'Comida')).toEqual(['Comida', '$100.00', '$100.00', '$0.00', '0.0%']);
  });
});

describe('R-15: la comparación usa los meses enteros del historial', () => {
  it('con un mes cargado y filtrado en el tablero, los montos son los del mes guardado', async () => {
    const historial = crearHistorialFalso({ [JULIO]: JULIO_A_MANO, [AGOSTO]: AGOSTO_A_MANO });
    render(<App historial={historial} />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));

    const tabla = await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(filaDe(tabla, 'Comida')).toEqual(['Comida', '$100.00', '$150.00', '+$50.00', '+50.0%']);
    expect(filaDe(tabla, comparacion.total)[1]).toBe('$450.50');
  });
});

describe('R-15: los meses se piden al historial y se recuerdan', () => {
  it('un mes ya pedido no se vuelve a pedir al cambiar la selección y volver', async () => {
    const historial = crearHistorialFalso(MESES_A_MANO);
    const pedidos: string[] = [];
    const obtener = historial.obtener;
    historial.obtener = (mes) => {
      pedidos.push(mes);
      return obtener(mes);
    };
    const usuario = await historialAbierto(historial);
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    await usuario.selectOptions(selectorDeMes(comparacion.mesBase), JULIO);
    await tablaDeLaComparacion(JULIO_ROTULO, SEPTIEMBRE_ROTULO);
    await usuario.selectOptions(selectorDeMes(comparacion.mesBase), AGOSTO);
    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);

    expect([...pedidos].sort()).toEqual([JULIO, AGOSTO, SEPTIEMBRE]);
  });

  it('tras reemplazar un mes la comparación usa la versión nueva y no la que recordaba', async () => {
    const historial = crearHistorialFalso({ [JULIO]: JULIO_A_MANO, [AGOSTO]: AGOSTO_A_MANO });
    const usuario = await historialAbierto(historial);
    const antes = await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(filaDe(antes, 'Comida')[1]).toBe('$100.00');

    await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-07-05 10:00:00,999,Café,Comida'])),
    );
    await usuario.click(await screen.findByRole('button', { name: textos.guardado.reemplazar }));
    await screen.findByText(textos.guardado.reemplazado(JULIO_ROTULO));
    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));

    await waitFor(() =>
      expect(
        filaDe(
          screen.getByRole('table', {
            name: textos.comparacion.tabla(JULIO_ROTULO, AGOSTO_ROTULO),
          }),
          'Comida',
        ),
      ).toEqual(['Comida', '$999.00', '$150.00', '-$849.00', '-85.0%']),
    );
  });

  it('reemplazar un mes desde la pregunta, sin salir de Historial, actualiza la comparación', async () => {
    const historial = crearHistorialFalso({ [JULIO]: JULIO_A_MANO, [AGOSTO]: AGOSTO_A_MANO });
    render(<App historial={historial} />);
    const usuario = await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-07-05 10:00:00,999,Café,Comida'])),
    );
    await screen.findByRole('button', { name: textos.guardado.reemplazar });
    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));
    const antes = await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(filaDe(antes, 'Comida')[1]).toBe('$100.00');

    await usuario.click(screen.getByRole('button', { name: textos.guardado.reemplazar }));

    await waitFor(() =>
      expect(
        filaDe(
          screen.getByRole('table', {
            name: textos.comparacion.tabla(JULIO_ROTULO, AGOSTO_ROTULO),
          }),
          'Comida',
        )[1],
      ).toBe('$999.00'),
    );
  });

  it('un fallo pasajero al pedir un mes no se recuerda: al volver a elegir se pide otra vez', async () => {
    const historial = crearHistorialFalso(MESES_A_MANO);
    const obtener = historial.obtener;
    let falla = true;
    historial.obtener = (mes) => {
      if (falla && mes === SEPTIEMBRE) return Promise.reject(new TypeError('Failed to fetch'));
      return obtener(mes);
    };
    const usuario = await historialAbierto(historial);
    await within(seccionDeLaComparacion()).findByRole('alert');
    falla = false;

    await usuario.selectOptions(selectorDeMes(comparacion.mesBase), JULIO);

    await tablaDeLaComparacion(JULIO_ROTULO, SEPTIEMBRE_ROTULO);
  });
});

describe('R-15: cuando falla pedir un mes', () => {
  it.each([
    [
      'la red cae',
      (): Promise<Transaccion[] | undefined> => Promise.reject(new TypeError('Failed to fetch')),
    ],
    [
      'el mes ya no existe (404)',
      (): Promise<Transaccion[] | undefined> => Promise.resolve(undefined),
    ],
  ])('si %s, la sección lo anuncia y la tabla de meses sigue ahí', async (_caso, respuesta) => {
    const historial = crearHistorialFalso(MESES_A_MANO);
    historial.obtener = respuesta;
    await historialAbierto(historial);

    expect(await within(seccionDeLaComparacion()).findByRole('alert')).toHaveTextContent(
      comparacion.fallo,
    );
    expect(screen.getByRole('table', { name: textos.historial.tabla })).toBeVisible();
    expect(
      within(seccionDeLaComparacion()).queryByRole('table', { name: /^Gasto por categoría/ }),
    ).toBeNull();
  });
});

describe('R-15: respuestas que llegan tarde', () => {
  it('la respuesta de una selección anterior no pinta la comparación de la actual', async () => {
    const historial = crearHistorialFalso(MESES_A_MANO);
    const obtener = historial.obtener;
    let soltarAgosto: () => void = () => undefined;
    let primeraDeAgosto = true;
    historial.obtener = async (mes) => {
      const transacciones = await obtener(mes);
      if (mes !== AGOSTO || !primeraDeAgosto) return transacciones;
      primeraDeAgosto = false;
      await new Promise<void>((resolver) => {
        soltarAgosto = resolver;
      });
      return transacciones;
    };
    const usuario = await historialAbierto(historial);
    await usuario.selectOptions(selectorDeMes(comparacion.mesBase), JULIO);
    await tablaDeLaComparacion(JULIO_ROTULO, SEPTIEMBRE_ROTULO);

    await act(async () => soltarAgosto());

    expect(
      screen.getByRole('table', {
        name: textos.comparacion.tabla(JULIO_ROTULO, SEPTIEMBRE_ROTULO),
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('table', {
        name: textos.comparacion.tabla(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO),
      }),
    ).toBeNull();
  });
});

describe('R-15: cuando la lista de meses cambia', () => {
  async function guardarSeptiembre(usuario: ReturnType<typeof userEvent.setup>) {
    await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-09-03 10:00:00,100,Café,Comida'])),
    );
    await screen.findByText(textos.guardado.guardado(SEPTIEMBRE_ROTULO));
    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));
  }

  it('mientras el analista no haya elegido, la comparación sigue a los dos meses más recientes', async () => {
    const historial = crearHistorialFalso({ [JULIO]: JULIO_A_MANO, [AGOSTO]: AGOSTO_A_MANO });
    const usuario = await historialAbierto(historial);
    await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);

    await guardarSeptiembre(usuario);

    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);
  });

  it('si el analista ya eligió los dos meses, guardar otro no se los cambia', async () => {
    const historial = crearHistorialFalso(MESES_A_MANO);
    const usuario = await historialAbierto(historial);
    await elegirMeses(usuario, JULIO, AGOSTO);
    await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);

    historial.guardados.delete(SEPTIEMBRE);
    await guardarSeptiembre(usuario);

    await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);
    expect(selectorDeMes(comparacion.mesBase)).toHaveValue(JULIO);
  });

  it('un mes elegido que deja de existir vuelve a la selección por defecto y la sección no se rompe', async () => {
    const historial = crearHistorialFalso(MESES_A_MANO);
    const usuario = await historialAbierto(historial);
    await elegirMeses(usuario, JULIO, AGOSTO);
    await tablaDeLaComparacion(JULIO_ROTULO, AGOSTO_ROTULO);

    historial.guardados.delete(JULIO);
    historial.guardados.delete(SEPTIEMBRE);
    await guardarSeptiembre(usuario);

    await tablaDeLaComparacion(AGOSTO_ROTULO, SEPTIEMBRE_ROTULO);
  });
});
