import type { EChartsType } from 'echarts/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dibujarComoSvg } from '../../src/cliente/echarts';
import { opcionDelMapa, opcionPorDia } from '../../src/cliente/opciones-de-graficas';
import { textos } from '../../src/cliente/textos';
import { parsearCsv } from '../../src/dominio/carga';
import { metricas as calcularMetricas } from '../../src/dominio/metricas';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';

const creadas = vi.hoisted(() => [] as EChartsType[]);

vi.mock('echarts/core', async (importarOriginal) => {
  const original = await importarOriginal<typeof import('echarts/core')>();
  return {
    ...original,
    init: (...argumentos: Parameters<typeof original.init>) => {
      const grafica = original.init(...argumentos);
      creadas.push(grafica);
      return grafica;
    },
  };
});

const metricas = calcularMetricas(parsearCsv(semilla1).transacciones);

beforeEach(() => {
  creadas.length = 0;
});

describe('dibujar una gráfica como SVG sin montarla', () => {
  it('la gráfica por día sale de 720 de ancho, con sus rótulos de día y el patrón de la marca de quincena', () => {
    const svg = dibujarComoSvg(opcionPorDia(metricas), 720, 420);

    expect(svg).toContain('width="720"');
    expect(svg).toContain('>01/07/2026<');
    expect(svg).toContain('>31/07/2026<');
    expect(svg).toContain(`>${textos.graficas.tiposDeDia.quincena}<`);
    expect(svg).toContain('<pattern');
  });

  it('la gráfica sale sin animaciones, aunque la opción las pida', () => {
    const svg = dibujarComoSvg({ ...opcionPorDia(metricas), animation: true }, 720, 420);

    expect(svg).not.toContain('@keyframes');
    expect(svg).not.toContain('<animate');
    expect(svg.match(/<path[^>]*ecmeta_series_index/g)?.length).toBeGreaterThanOrEqual(31);
  });

  it('el mapa nombra a Centro Histórico, CDMX en la leyenda y deja fuera los puntos de Monterrey, N.L.', () => {
    const opcion = opcionDelMapa(metricas);
    const posicionDelDestino = metricas.puntosDelMapa.findIndex(
      ({ zona }) => zona === 'Monterrey, N.L.',
    );
    const posicionDeLaCiudad = metricas.puntosDelMapa.findIndex(
      ({ zona }) => zona === 'Centro Histórico, CDMX',
    );

    const svg = dibujarComoSvg(opcion, 720, 420);

    const puntosDe = (serie: number) =>
      svg.match(new RegExp(`ecmeta_series_index="${serie}"[^>]*ecmeta_ssr_type="chart"`, 'g'))
        ?.length ?? 0;
    expect(svg).toContain('>Centro Histórico, CDMX<');
    expect(puntosDe(posicionDeLaCiudad)).toBeGreaterThan(700);
    expect(puntosDe(posicionDelDestino)).toBe(0);
  });

  it('no deja nada montado en el documento y libera la gráfica', () => {
    dibujarComoSvg(opcionPorDia(metricas), 720, 320);

    expect(document.body.innerHTML).toBe('');
    expect(creadas).toHaveLength(1);
    expect(creadas.every((grafica) => grafica.isDisposed())).toBe(true);
  });

  it('libera la gráfica aunque la opción no se pueda aplicar', () => {
    const rota = {
      get series(): never {
        throw new Error('opción rota');
      },
    };

    expect(() => dibujarComoSvg(rota, 720, 320)).toThrow('opción rota');
    expect(creadas.every((grafica) => grafica.isDisposed())).toBe(true);
    expect(creadas).toHaveLength(1);
  });
});
