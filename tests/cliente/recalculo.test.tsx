import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import { elegir, kpi, valorDe } from './ayudas';
import {
  casillasDe,
  casillasMarcadas,
  diasOfrecidos,
  gastoDeAgosto,
  gastosDeJulioConDimensiones,
} from './ayudas-filtros';

async function tablaDeCategorias(): Promise<string[][]> {
  const tabla = await screen.findByRole('table', { name: textos.categorias.tabla });
  return within(tabla)
    .getAllByRole('row')
    .slice(1)
    .map((fila) =>
      within(fila)
        .getAllByRole('cell')
        .map((celda) => (celda.textContent ?? '').replace(textos.categorias.dominante, '').trim()),
    );
}

async function conElMesCargado() {
  render(<App />);
  const usuario = await elegir(gastosDeJulioConDimensiones());
  await screen.findByRole('group', { name: textos.kpis.gastoTotal });
  return usuario;
}

describe('el tablero se recalcula con el filtro', () => {
  it('sin filtros muestra el mes entero', async () => {
    await conElMesCargado();

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,200.00');
    expect(valorDe(textos.kpis.transacciones)).toBe('4');
    expect(valorDe(textos.kpis.gastoPromedioPorDia)).toBe('$38.71');
  });

  it('elegir una categoría deja en los KPIs y en la lista por categoría solo sus gastos', async () => {
    const usuario = await conElMesCargado();

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$400.00');
    expect(valorDe(textos.kpis.transacciones)).toBe('2');
    expect(valorDe(textos.kpis.ticketPromedio)).toBe('$200.00');
    expect(await tablaDeCategorias()).toEqual([['Comida', '$400.00', '100.0%']]);
  });

  it('dos categorías suman sus gastos y desmarcar una deja solo la otra', async () => {
    const usuario = await conElMesCargado();

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    await usuario.click(screen.getByRole('checkbox', { name: 'Ocio' }));
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$600.00');

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$200.00');
    expect(await tablaDeCategorias()).toEqual([['Ocio', '$200.00', '100.0%']]);
  });

  it('una cuenta y una zona se combinan con Y', async () => {
    const usuario = await conElMesCargado();

    await usuario.click(screen.getByRole('checkbox', { name: 'Débito' }));
    await usuario.click(screen.getByRole('checkbox', { name: 'Roma' }));

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$600.00');
    expect(valorDe(textos.kpis.transacciones)).toBe('1');
    expect(screen.getByRole('checkbox', { name: 'Débito' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Roma' })).toBeChecked();
  });

  it('un rango de fechas divide el gasto entre los días del periodo, no entre los del mes', async () => {
    const usuario = await conElMesCargado();

    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.desde }),
      '10/07/2026',
    );
    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.hasta }),
      '20/07/2026',
    );

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,100.00');
    expect(valorDe(textos.kpis.transacciones)).toBe('3');
    expect(valorDe(textos.kpis.gastoPromedioPorDia)).toBe('$100.00');
  });

  it('un monto máximo recorta el tablero y vaciar el campo quita la restricción', async () => {
    const usuario = await conElMesCargado();
    const maximo = screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo });

    await usuario.type(maximo, '300');
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$600.00');

    await usuario.clear(maximo);
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,200.00');
    expect(valorDe(textos.kpis.transacciones)).toBe('4');
  });

  it('el resumen de la carga no cambia al filtrar', async () => {
    const usuario = await conElMesCargado();

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    expect(valorDe(textos.resumen.validas)).toBe('4');
    expect(valorDe(textos.resumen.invalidas)).toBe('0');
  });

  it('quitar los filtros devuelve el total y desmarca todos los controles', async () => {
    const usuario = await conElMesCargado();
    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.desde }),
      '10/07/2026',
    );
    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }), '50');

    await usuario.click(screen.getByRole('button', { name: textos.filtros.quitar }));

    expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,200.00');
    expect(casillasMarcadas()).toHaveLength(0);
    expect(screen.getByRole('combobox', { name: textos.filtros.desde })).toHaveValue('');
    expect(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo })).toHaveValue(null);
  });

  it('las tarjetas de KPI siguen siendo localizables por nombre con el panel a la vista', async () => {
    await conElMesCargado();

    for (const nombre of Object.values(textos.kpis).slice(1)) {
      expect(kpi(nombre)).toBeInTheDocument();
    }
  });
});

describe('otro archivo empieza sin filtros', () => {
  it('al elegir un mes nuevo con un filtro puesto ve el mes completo, sin casillas marcadas', async () => {
    const usuario = await conElMesCargado();
    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.desde }),
      '10/07/2026',
    );

    await elegir(gastoDeAgosto());

    await screen.findByRole('checkbox', { name: 'Transporte' });
    expect(casillasDe(textos.filtros.categorias)).toEqual(['Transporte']);
    expect(casillasMarcadas()).toHaveLength(0);
    expect(diasOfrecidos(textos.filtros.desde)[1]).toBe('01/08/2026');
    expect(screen.getByRole('combobox', { name: textos.filtros.desde })).toHaveValue('');
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$50.00');
  });

  it('elegir otra vez el mismo archivo también quita el filtro', async () => {
    const usuario = await conElMesCargado();
    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$400.00');

    await elegir(gastosDeJulioConDimensiones());

    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    expect(casillasMarcadas()).toHaveLength(0);
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,200.00');
  });
});
