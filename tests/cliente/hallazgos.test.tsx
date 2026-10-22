import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { PanelDeHallazgos } from '../../src/cliente/PanelDeHallazgos';
import { textos } from '../../src/cliente/textos';
import { periodoDelMes } from '../../src/dominio/calendario';
import { parsearCsv } from '../../src/dominio/carga';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, csv, elegir } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

async function conLaSemilla() {
  render(<App historial={crearHistorialFalso()} />);
  const usuario = await elegir(archivoCsv(semilla1));
  const region = await screen.findByRole('region', { name: textos.hallazgos.titulo });
  return { usuario, region };
}

/** Verdadero si cada fragmento aparece en `texto` después del anterior. */
function enOrden(texto: string, fragmentos: string[]): boolean {
  let desde = 0;
  for (const fragmento of fragmentos) {
    const posicion = texto.indexOf(fragmento, desde);
    if (posicion < 0) return false;
    desde = posicion + fragmento.length;
  }
  return true;
}

function elementos(region: HTMLElement): string[] {
  return within(region)
    .getAllByRole('listitem')
    .map((elemento) => elemento.textContent ?? '');
}

describe('panel de hallazgos', () => {
  it('va tras los indicadores y antes del gasto por categoría', async () => {
    await conLaSemilla();

    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

    const posicion = (titulo: string) => titulos.indexOf(titulo);
    expect(posicion(textos.kpis.titulo)).toBeGreaterThanOrEqual(0);
    expect(posicion(textos.hallazgos.titulo)).toBe(posicion(textos.kpis.titulo) + 1);
    expect(posicion(textos.categorias.titulo)).toBe(posicion(textos.hallazgos.titulo) + 1);
  });

  it('muestra un elemento por hallazgo de la semilla 1 con su evidencia en formato R-17', async () => {
    const { region } = await conLaSemilla();

    const items = elementos(region);

    expect(items).toHaveLength(6);
    expect(items[0]).toContain('Compras');
    expect(items[0]).toContain('48.2%');
    expect(items[1]).toContain('Centro Histórico, CDMX');
    expect(enOrden(items[2] ?? '', ['2.8', '$124,661.72', '$44,104.58'])).toBe(true);
    expect(enOrden(items[3] ?? '', ['1.7', '$71,071.73', '$42,529.90'])).toBe(true);
    expect(within(region).queryByText(textos.hallazgos.ninguno)).toBeNull();
    expect(items[4]).toContain('Monterrey, N.L.');
    expect(items[4]).toContain('24/07/2026');
    expect(items[4]).toContain('26/07/2026');
    expect(items[5]).toContain('2 ');
    expect(items[5]).toContain('$10,795.88');
  });

  it('al filtrar solo Compras la dominante es del 100 % y no hay zona favorita', async () => {
    const { usuario, region } = await conLaSemilla();

    await usuario.click(screen.getByRole('checkbox', { name: 'Compras' }));

    const items = elementos(region);
    expect(items[0]).toContain('Compras');
    expect(items[0]).toContain('100.0%');
    expect(items.some((item) => item.includes('Centro Histórico, CDMX'))).toBe(false);
  });

  it('un filtro que deja 0 filas quita el panel', async () => {
    const { usuario } = await conLaSemilla();

    await usuario.type(
      screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }),
      '99999999',
    );

    expect(screen.queryByRole('region', { name: textos.hallazgos.titulo })).toBeNull();
  });
});

describe('panel de hallazgos con un rango de fechas', () => {
  it('compara fines de semana y resto solo con los días del rango elegido', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = await elegir(
      archivoCsv(
        csv('fecha,monto,concepto', [
          '2026-07-04 10:00:00,1000,Sábado',
          '2026-07-06 10:00:00,100,Lunes',
        ]),
      ),
    );
    await screen.findByRole('region', { name: textos.hallazgos.titulo });

    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.desde }),
      '04/07/2026',
    );
    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.hasta }),
      '06/07/2026',
    );

    const region = screen.getByRole('region', { name: textos.hallazgos.titulo });
    const finDeSemana = elementos(region).find((item) => item.includes('$500.00'));
    expect(enOrden(finDeSemana ?? '', ['5', '$500.00', '$100.00'])).toBe(true);
  });
});

describe('PanelDeHallazgos con umbrales propios', () => {
  const { transacciones, mes } = parsearCsv(semilla1);
  const periodo = periodoDelMes(mes);

  it('dice que ningún patrón supera su umbral cuando los umbrales no dejan pasar nada', () => {
    const imposibles = {
      categoriaDominante: 1.01,
      quincena: 1e6,
      finDeSemana: 1e6,
      diasDeViaje: 0,
      factorDeAtipicos: 1e6,
    };
    const sinZonaFavorita = transacciones.filter((t) => t.categoria === 'Compras');
    render(
      <PanelDeHallazgos transacciones={sinZonaFavorita} periodo={periodo} umbrales={imposibles} />,
    );

    const region = screen.getByRole('region', { name: textos.hallazgos.titulo });
    expect(within(region).queryAllByRole('listitem')).toHaveLength(0);
    expect(within(region).getByText(textos.hallazgos.ninguno)).toBeTruthy();
  });
});
