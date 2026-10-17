import type { BarSeriesOption, EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import { porComparacion } from '../../src/graficas/por-comparacion';
import type { Comparacion } from '../../src/dominio/comparacion';
import { COMPARACION_DE_PRUEBA, ROTULOS_DE_MESES } from './comparacion-de-prueba';

interface SerieDeMes extends BarSeriesOption {
  name: string;
  itemStyle: { color: string; decal?: object };
  data: number[];
}

function dibujar() {
  const opcion: EChartsOption = porComparacion(COMPARACION_DE_PRUEBA, ROTULOS_DE_MESES);
  const series = opcion.series as SerieDeMes[];
  return { opcion, series };
}

describe('porComparacion', () => {
  it('dibuja una serie por mes, con el nombre que recibe, en orden cronológico', () => {
    const { series } = dibujar();

    expect(series.map((s) => s.name)).toEqual(['Julio de 2026', 'Agosto de 2026']);
  });

  it('agrupa las columnas de los meses lado a lado: ninguna serie se apila', () => {
    const { series } = dibujar();

    expect(series.every((s) => s.stack === undefined)).toBe(true);
  });

  it('pone una columna por categoría, en el orden de la comparación, y deja fuera el total', () => {
    const { opcion } = dibujar();

    expect((opcion.xAxis as { data: string[] }).data).toEqual(['Compras', 'Servicios', 'Comida']);
  });

  it('da a cada mes el monto de cada categoría, alineado con el eje', () => {
    const { series } = dibujar();

    expect(series[0]?.data).toEqual([814566.3, 0, 9000]);
    expect(series[1]?.data).toEqual([201746.52, 15000.5, 120]);
  });

  it('distingue el segundo mes del primero por un color distinto y por una marca', () => {
    const { series } = dibujar();
    const [primero, segundo] = series;

    expect(segundo?.itemStyle.color).not.toBe(primero?.itemStyle.color);
    expect(segundo?.itemStyle.decal).toBeDefined();
    expect(JSON.stringify(segundo?.itemStyle.decal)).not.toBe(
      JSON.stringify(primero?.itemStyle.decal),
    );
  });

  it('rechaza una comparación sin rótulo de alguno de sus meses y nombra el mes que falta', () => {
    expect(() => porComparacion(COMPARACION_DE_PRUEBA, { '2026-07': 'Julio de 2026' })).toThrow(
      /2026-08/,
    );
  });

  it.each([1, 3])('rechaza una comparación de %i mes(es): la gráfica es de dos', (cuantos) => {
    const meses = ['2026-06', '2026-07', '2026-08'].slice(-cuantos);
    const comparacion: Comparacion = { ...COMPARACION_DE_PRUEBA, meses };
    const rotulos = Object.fromEntries(meses.map((mes) => [mes, mes]));

    expect(() => porComparacion(comparacion, rotulos)).toThrow(/dos meses/);
  });

  it('formatea el eje de montos en MXN (R-17)', () => {
    const { opcion } = dibujar();
    const formatter = (opcion.yAxis as { axisLabel: { formatter: (v: number) => string } })
      .axisLabel.formatter;

    expect(formatter(814566.3)).toBe('$814,566.30');
  });

  it('muestra una leyenda con el nombre de cada mes, para que se lea cuál es cuál', () => {
    const { opcion } = dibujar();
    const leyenda = opcion.legend as { show?: boolean; data: string[] };

    expect(leyenda.show).not.toBe(false);
    expect(leyenda.data).toEqual(['Julio de 2026', 'Agosto de 2026']);
  });

  it('acota el grosor de las barras', () => {
    const { series } = dibujar();

    expect(series.every((s) => (s.barMaxWidth as number) > 0)).toBe(true);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(dibujar().opcion.aria).toMatchObject({ enabled: true });
  });
});
