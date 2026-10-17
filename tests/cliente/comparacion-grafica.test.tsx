import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import { AGOSTO, JULIO, elegirMeses, fixturesDelGenerador } from './ayudas-comparacion';
import { crearHistorialFalso } from './historial-falso';

const { comparacion } = textos;
const JULIO_ROTULO = 'julio de 2026';
const AGOSTO_ROTULO = 'agosto de 2026';
const NOMBRE = comparacion.grafica.nombre(JULIO_ROTULO, AGOSTO_ROTULO);

async function abrirJulioContraAgosto() {
  render(<App historial={crearHistorialFalso(fixturesDelGenerador())} />);
  const usuario = userEvent.setup();
  await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));
  await screen.findByRole('table', {
    name: comparacion.tabla('agosto de 2026', 'septiembre de 2026'),
  });
  await elegirMeses(usuario, JULIO, AGOSTO);
  return screen.findByRole('img', { name: new RegExp(`^${NOMBRE}`) });
}

describe('R-15: la gráfica de la comparación', () => {
  it('tiene su título y una descripción accesible que da los montos de cada mes en R-17', async () => {
    const grafica = await abrirJulioContraAgosto();

    expect(
      within(screen.getByRole('region', { name: comparacion.titulo })).getByRole('heading', {
        level: 3,
        name: comparacion.grafica.titulo,
      }),
    ).toBeVisible();
    const descripcion = grafica.getAttribute('aria-label') ?? '';
    expect(descripcion).toContain(
      comparacion.grafica.detalle(
        'Compras',
        JULIO_ROTULO,
        '$814,566.30',
        AGOSTO_ROTULO,
        '$201,746.52',
      ),
    );
    expect(descripcion).toMatch(/Compras.*\$814,566\.30.*\$201,746\.52/);
    expect(descripcion).not.toContain('814566');
  });

  it('dibuja una leyenda con los dos meses y marca con un patrón las barras del segundo, además del color', async () => {
    const grafica = await abrirJulioContraAgosto();

    const dibujo = grafica.querySelector('svg');

    expect(dibujo?.textContent).toContain(JULIO_ROTULO);
    expect(dibujo?.textContent).toContain(AGOSTO_ROTULO);
    const barrasConPatron = dibujo?.querySelectorAll('path[fill^="url("]:not([transform])');
    expect(barrasConPatron).toHaveLength(10);
  });

  it('al salir de la vista de historial la gráfica se libera y al volver se pinta de nuevo', async () => {
    render(<App historial={crearHistorialFalso(fixturesDelGenerador())} />);
    const usuario = userEvent.setup();
    const enElDocumento = () =>
      document.querySelectorAll('[aria-label^="Gráfico de columnas del gasto por categoría en"]');
    const nombre = new RegExp(
      `^${comparacion.grafica.nombre('agosto de 2026', 'septiembre de 2026')}`,
    );
    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));
    await screen.findByRole('img', { name: nombre });

    await usuario.click(screen.getByRole('button', { name: textos.vistas.tablero }));

    expect(enElDocumento()).toHaveLength(0);
    await usuario.click(screen.getByRole('button', { name: textos.vistas.historial }));
    const grafica = await screen.findByRole('img', { name: nombre });
    expect(grafica.querySelector('svg')).not.toBeNull();
    expect(enElDocumento()).toHaveLength(1);
  });
});
