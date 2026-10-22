import { render, screen, waitFor } from '@testing-library/react';
import { getInstanceByDom } from 'echarts/core';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, csv, elegir, gastosDeJulio } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

const DESCRIPCION = new RegExp(`^${textos.categorias.nombreGrafica}`);

async function contenedorDeLaGrafica(): Promise<HTMLElement> {
  return screen.findByRole('img', { name: DESCRIPCION });
}

describe('gráfica del gasto por categoría', () => {
  it('su descripción accesible recorre las categorías en orden con monto y porcentaje legibles', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(semilla1));

    const nombre = (await contenedorDeLaGrafica()).getAttribute('aria-label') ?? '';
    expect(nombre).toMatch(/Compras.*\$814,566\.30.*48\.2%.*Comida.*\$260,686\.59.*15\.4%/);
    expect(nombre).not.toContain('814566');
  });

  it('se monta como una gráfica SVG en su contenedor, con su descripción accesible', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));

    const contenedor = await contenedorDeLaGrafica();
    expect(contenedor.querySelector('svg')).not.toBeNull();
    expect(contenedor.querySelector('canvas')).toBeNull();
  });

  it('se libera cuando el analista deja el tablero', async () => {
    const { unmount } = render(<App historial={crearHistorialFalso()} />);
    await elegir(archivoCsv(csv('fecha,monto,concepto', gastosDeJulio(3))));
    const contenedor = await contenedorDeLaGrafica();
    expect(getInstanceByDom(contenedor)).toBeDefined();

    unmount();

    expect(getInstanceByDom(contenedor)).toBeUndefined();
  });

  it('en StrictMode queda una sola gráfica viva, no una liberada ni dos', async () => {
    render(
      <StrictMode>
        <App historial={crearHistorialFalso()} />
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
    render(<App historial={crearHistorialFalso()} />);
    await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-07-03 10:00:00,100,Café,Comida'])),
    );
    await contenedorDeLaGrafica();

    await elegir(
      archivoCsv(csv('fecha,monto,concepto,categoria', ['2026-07-03 10:00:00,100,Vuelo,Viajes'])),
    );

    await waitFor(() =>
      expect(screen.getByRole('img', { name: DESCRIPCION }).getAttribute('aria-label')).toContain(
        'Viajes',
      ),
    );
    expect(screen.getAllByRole('img', { name: DESCRIPCION })).toHaveLength(1);
    expect(screen.getByRole('img', { name: DESCRIPCION }).querySelectorAll('svg')).toHaveLength(1);
  });
});
