import { render, screen, waitFor } from '@testing-library/react';
import { getInstanceByDom } from 'echarts/core';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { archivoCsv, csv, elegir, gastosDeJulio } from './ayudas';

const DESCRIPCION_EN_ESPANOL = /^Este es un gráfico/;

async function contenedorDeLaGrafica(): Promise<HTMLElement> {
  return screen.findByRole('img', { name: DESCRIPCION_EN_ESPANOL });
}

describe('gráfica del gasto por categoría', () => {
  it('se monta como una gráfica SVG en su contenedor, con su descripción accesible en español', async () => {
    render(<App />);

    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));

    const contenedor = await contenedorDeLaGrafica();
    expect(contenedor.querySelector('svg')).not.toBeNull();
    expect(contenedor.querySelector('canvas')).toBeNull();
  });

  it('se libera cuando el analista deja el tablero', async () => {
    const { unmount } = render(<App />);
    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    const contenedor = await contenedorDeLaGrafica();
    expect(getInstanceByDom(contenedor)).toBeDefined();

    unmount();

    expect(getInstanceByDom(contenedor)).toBeUndefined();
  });

  it('en StrictMode queda una sola gráfica viva, no una liberada ni dos', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));

    const contenedor = await contenedorDeLaGrafica();
    const instancia = getInstanceByDom(contenedor);
    expect(instancia).toBeDefined();
    expect(instancia?.isDisposed()).toBeFalsy();
    expect(contenedor.querySelectorAll('svg')).toHaveLength(1);
  });

  it('al cambiar de archivo la gráfica muestra el nuevo y no se acumula otra', async () => {
    render(<App />);
    await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-07-03 10:00:00,100,Café,Comida'])),
    );
    await contenedorDeLaGrafica();

    await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-07-03 10:00:00,100,Vuelo,Viajes'])),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('img', { name: DESCRIPCION_EN_ESPANOL }).getAttribute('aria-label'),
      ).toContain('Viajes'),
    );
    expect(screen.getAllByRole('img', { name: DESCRIPCION_EN_ESPANOL })).toHaveLength(1);
    expect(
      screen.getByRole('img', { name: DESCRIPCION_EN_ESPANOL }).querySelectorAll('svg'),
    ).toHaveLength(1);
  });
});
