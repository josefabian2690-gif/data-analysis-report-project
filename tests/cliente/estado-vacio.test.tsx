import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import { elegir, hayTablero, valorDe } from './ayudas';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';

async function conUnMontoImposible() {
  render(<App />);
  const usuario = await elegir(gastosDeJulioConDimensiones());
  await screen.findByRole('group', { name: textos.kpis.gastoTotal });
  await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }), '1000');
  await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo }), '10');
  return usuario;
}

describe('filtro que deja 0 filas', () => {
  it('avisa con un mensaje de estado en lugar de los KPIs y la gráfica, sin ningún NaN', async () => {
    await conUnMontoImposible();

    expect(screen.getByRole('status')).toHaveTextContent(textos.filtros.sinResultados);
    expect(hayTablero()).toBe(false);
    expect(screen.queryByRole('table', { name: textos.categorias.tabla })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /^Gráfico/ })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('deja el panel a la vista y quitar los filtros devuelve el tablero', async () => {
    const usuario = await conUnMontoImposible();
    expect(screen.getByRole('button', { name: textos.filtros.quitar })).toBeVisible();

    await usuario.click(screen.getByRole('button', { name: textos.filtros.quitar }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$1,200.00');
  });

  it('corregir el monto desde el propio panel también devuelve el tablero', async () => {
    const usuario = await conUnMontoImposible();

    await usuario.clear(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }));
    const maximo = screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo });
    await usuario.clear(maximo);
    await usuario.type(maximo, '300');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(valorDe(textos.kpis.gastoTotal)).toBe('$600.00');
  });
});
