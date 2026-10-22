import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import minimo from '../fixtures/a-mano/minimo.csv?raw';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, elegir } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

const { mapa } = textos.graficas;

afterEach(() => vi.restoreAllMocks());

async function conLaSemilla() {
  render(<App historial={crearHistorialFalso()} />);
  return elegir(archivoCsv(semilla1));
}

function elMapa(): Promise<HTMLElement> {
  return screen.findByRole('img', { name: new RegExp(`^${mapa.nombre}`) });
}

/** La suma de los puntos que la descripción atribuye a cada zona. */
function puntosEnLaDescripcion(descripcion: string): number {
  return [...descripcion.matchAll(/: ([\d,]+) puntos?/g)].reduce(
    (suma, [, n]) => suma + Number((n ?? '0').replace(/,/g, '')),
    0,
  );
}

describe('el mapa del mes', () => {
  it('con la semilla 1 tiene título y una gráfica con nombre cuya descripción da 755 puntos en Centro Histórico, CDMX', async () => {
    await conLaSemilla();

    const descripcion = (await elMapa()).getAttribute('aria-label');

    expect(screen.getByRole('heading', { level: 2, name: mapa.titulo })).toBeInTheDocument();
    expect(descripcion).toContain(mapa.detalle('Centro Histórico, CDMX', '755'));
    expect(descripcion).toContain(mapa.detalle('Monterrey, N.L.', '247'));
    expect(puntosEnLaDescripcion(descripcion ?? '')).toBe(2000);
  });

  it('se monta con los componentes de ECharts registrados: no avisa de ninguno sin registrar', async () => {
    const avisos = [vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')];

    await conLaSemilla();
    await elMapa();

    const medida = /Can't get DOM width or height/;
    const relevantes = avisos
      .flatMap((aviso) => aviso.mock.calls)
      .map((llamada) => String(llamada[0]))
      .filter((mensaje) => !medida.test(mensaje));
    expect(relevantes).toEqual([]);
  });

  it('abre encuadrado en CDMX: los rótulos de los ejes no llegan a Monterrey', async () => {
    await conLaSemilla();

    const rotulos = [...(await elMapa()).querySelectorAll('svg text')]
      .map((texto) => Number(texto.textContent))
      .filter((n) => !Number.isNaN(n));

    const longitudes = rotulos.filter((n) => n < 0);
    const latitudes = rotulos.filter((n) => n > 0);
    expect(longitudes.length).toBeGreaterThan(0);
    expect(latitudes.length).toBeGreaterThan(0);
    expect(longitudes.every((n) => n > -99.5 && n < -98.9)).toBe(true);
    expect(latitudes.every((n) => n > 19 && n < 19.8)).toBe(true);
  });

  it('el mapa lleva su cuadro de detalle al pasar el cursor (tooltip registrado)', async () => {
    await conLaSemilla();

    const grafica = await elMapa();

    expect(grafica.children).toHaveLength(2);
  });

  it('va entre el gasto por cuenta y la tabla', async () => {
    await conLaSemilla();
    await elMapa();

    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

    expect(titulos.slice(titulos.indexOf(textos.graficas.porCuenta.titulo))).toEqual([
      textos.graficas.porCuenta.titulo,
      mapa.titulo,
      textos.tabla.titulo,
    ]);
  });

  it('al filtrar solo Compras tiene 404 puntos (la suma de los de cada zona de su descripción)', async () => {
    const usuario = await conLaSemilla();
    await elMapa();

    await usuario.click(screen.getByRole('checkbox', { name: 'Compras' }));

    const descripcion = (await elMapa()).getAttribute('aria-label') ?? '';
    expect(puntosEnLaDescripcion(descripcion)).toBe(404);
  });

  it('con un filtro que deja 0 filas no hay ni mapa ni hallazgos, y sí el mensaje de estado', async () => {
    const usuario = await conLaSemilla();
    await elMapa();

    await usuario.type(
      screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }),
      '1000',
    );
    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo }), '10');

    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(
      textos.filtros.sinResultados,
    );
    expect(screen.queryByRole('heading', { name: mapa.titulo })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: new RegExp(`^${mapa.nombre}`) }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: textos.hallazgos.titulo })).not.toBeInTheDocument();
  });
});

describe('un mes sin coordenadas', () => {
  it('muestra el mensaje en lugar del mapa, sin errores, y el resto del tablero se ve', async () => {
    const errores = vi.spyOn(console, 'error');
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(minimo));

    const titulo = await screen.findByRole('heading', { level: 2, name: mapa.titulo });
    expect(titulo.closest('section')).toHaveTextContent(mapa.sinCoordenadas);
    expect(
      screen.queryByRole('img', { name: new RegExp(`^${mapa.nombre}`) }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: textos.kpis.gastoTotal })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: textos.hallazgos.titulo })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: textos.tabla.titulo }),
    ).toBeInTheDocument();
    expect(errores).not.toHaveBeenCalled();
  });
});
