import type { BarSeriesOption, EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import type { TipoDeDia } from '../../src/dominio/calendario';
import type { GastoDeDia, Metricas } from '../../src/dominio/metricas';
import { porDia } from '../../src/graficas/por-dia';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const ROTULOS: Record<TipoDeDia, string> = {
  quincena: 'Q·q',
  'post-quincena': 'P·p',
  'pre-quincena': 'R·r',
  normal: 'N·n',
};

function dia(dia: string, monto: number, tipo: TipoDeDia): GastoDeDia {
  return { dia, monto, transacciones: monto > 0 ? 1 : 0, tipo, finDeSemana: false };
}

const METRICAS: Metricas = {
  ...METRICAS_VACIAS,
  gastoPorDia: [
    dia('2026-07-14', 140.5, 'pre-quincena'),
    dia('2026-07-15', 1500, 'quincena'),
    dia('2026-07-16', 0, 'post-quincena'),
    dia('2026-07-17', 12345.67, 'normal'),
  ],
};

interface SerieDeTipo extends BarSeriesOption {
  name: string;
  itemStyle: { color: string; decal?: object };
  data: (number | null)[];
}

function dibujar(metricas: Metricas = METRICAS) {
  const opcion: EChartsOption = porDia(metricas, ROTULOS);
  const series = opcion.series as SerieDeTipo[];
  const serieDe = (tipo: TipoDeDia) => {
    const serie = series.find((s) => s.name === ROTULOS[tipo]);
    if (serie === undefined) throw new Error(`falta la serie de ${tipo}`);
    return serie;
  };
  return { opcion, series, serieDe };
}

describe('porDia', () => {
  it('rotula el eje con cada día del periodo en formato dd/mm/aaaa (R-17), en orden', () => {
    const { opcion } = dibujar();

    expect((opcion.xAxis as { data: string[] }).data).toEqual([
      '14/07/2026',
      '15/07/2026',
      '16/07/2026',
      '17/07/2026',
    ]);
  });

  it('dibuja una barra por día con su monto, dentro de la serie de su tipo de día', () => {
    const { serieDe } = dibujar();

    expect(serieDe('pre-quincena').data).toEqual([140.5, null, null, null]);
    expect(serieDe('quincena').data).toEqual([null, 1500, null, null]);
    expect(serieDe('post-quincena').data).toEqual([null, null, 0, null]);
    expect(serieDe('normal').data).toEqual([null, null, null, 12345.67]);
  });

  it('pinta la quincena de un color distinto al de los días normales y al de sus vecinos (R-13)', () => {
    const { serieDe } = dibujar();
    const colores = (['quincena', 'post-quincena', 'pre-quincena', 'normal'] as const).map(
      (tipo) => serieDe(tipo).itemStyle.color,
    );

    expect(new Set(colores).size).toBe(4);
  });

  it('marca la quincena con un patrón además del color, y no marca los días normales', () => {
    const { serieDe } = dibujar();
    const marcas = (['quincena', 'post-quincena', 'pre-quincena'] as const).map((tipo) =>
      JSON.stringify(serieDe(tipo).itemStyle.decal),
    );

    expect(marcas.every((marca) => marca !== undefined)).toBe(true);
    expect(new Set(marcas).size).toBe(3);
    expect(serieDe('normal').itemStyle.decal).toBeUndefined();
  });

  it('muestra una leyenda con el nombre de cada tipo de día, para que se lea qué significa la marca', () => {
    const { opcion } = dibujar();
    const leyenda = opcion.legend as { show?: boolean; data: string[] };

    expect(leyenda.show).not.toBe(false);
    expect(leyenda.data).toEqual(['Q·q', 'P·p', 'R·r', 'N·n']);
  });

  it('muestra todas las fechas del eje, inclinadas, para que no se oculten las de quincena', () => {
    const { opcion } = dibujar();
    const rotulos = (opcion.xAxis as { axisLabel: { interval: number; rotate: number } }).axisLabel;

    expect(rotulos.interval).toBe(0);
    expect(rotulos.rotate).toBeGreaterThan(0);
  });

  it('apila todas las series en la misma pila, para que cada barra ocupe todo su ancho', () => {
    const { series } = dibujar();
    const pilas = new Set(series.map((s) => s.stack));

    expect(pilas.size).toBe(1);
    expect(pilas.has(undefined)).toBe(false);
  });

  it('formatea el eje de montos en MXN (R-17)', () => {
    const { opcion } = dibujar();
    const formatter = (opcion.yAxis as { axisLabel: { formatter: (v: number) => string } })
      .axisLabel.formatter;

    expect(formatter(12345.6)).toBe('$12,345.60');
  });

  it('acota el grosor de todas las barras', () => {
    const { series } = dibujar();

    expect(series).toHaveLength(4);
    expect(series.every((s) => (s.barMaxWidth as number) > 0)).toBe(true);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(dibujar().opcion.aria).toMatchObject({ enabled: true });
  });

  it('sin días devuelve una gráfica vacía y no falla', () => {
    const { opcion, series } = dibujar({ ...METRICAS, gastoPorDia: [] });

    expect((opcion.xAxis as { data: string[] }).data).toEqual([]);
    expect(series.every((s) => s.data.length === 0)).toBe(true);
  });
});
