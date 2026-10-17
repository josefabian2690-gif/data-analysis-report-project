import type { BarSeriesOption, EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import type { DiaDeLaSemana } from '../../src/dominio/calendario';
import type { GastoDeDiaDeLaSemana, Metricas } from '../../src/dominio/metricas';
import {
  porDiaDeLaSemana,
  type RotulosDePorDiaDeLaSemana,
} from '../../src/graficas/por-dia-de-la-semana';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const ROTULOS: RotulosDePorDiaDeLaSemana = {
  dias: {
    0: 'L·0',
    1: 'M·1',
    2: 'X·2',
    3: 'J·3',
    4: 'V·4',
    5: 'S·5',
    6: 'D·6',
  },
  entreSemana: 'ES',
  finDeSemana: 'FS',
};

// Julio de 2026 tiene cinco miércoles, jueves y viernes: el total premia a esos días y el promedio no.
const DIAS = [4, 4, 5, 5, 5, 4, 4] as const;
const MONTOS = [400, 400, 1000, 1000, 1000, 800, 800];

const SEMANA: GastoDeDiaDeLaSemana[] = DIAS.map((dias, i) => ({
  diaDeLaSemana: i as DiaDeLaSemana,
  monto: MONTOS[i] ?? 0,
  dias,
  promedio: (MONTOS[i] ?? 0) / dias,
  finDeSemana: i >= 4,
}));

const METRICAS: Metricas = { ...METRICAS_VACIAS, gastoPorDiaDeLaSemana: SEMANA };

interface SerieDeClase extends BarSeriesOption {
  name: string;
  itemStyle: { color: string; decal?: object };
  data: (number | null)[];
}

function dibujar(metricas: Metricas = METRICAS) {
  const opcion: EChartsOption = porDiaDeLaSemana(metricas, ROTULOS);
  const series = opcion.series as SerieDeClase[];
  const serieDe = (nombre: string) => {
    const serie = series.find((s) => s.name === nombre);
    if (serie === undefined) throw new Error(`falta la serie ${nombre}`);
    return serie;
  };
  return { opcion, series, serieDe };
}

describe('porDiaDeLaSemana', () => {
  it('dibuja siete días, de lunes a domingo, con los nombres recibidos', () => {
    const { opcion } = dibujar();

    expect((opcion.xAxis as { data: string[] }).data).toEqual([
      'L·0',
      'M·1',
      'X·2',
      'J·3',
      'V·4',
      'S·5',
      'D·6',
    ]);
  });

  it('mide el promedio por día y no el total, para que los días que caen cinco veces no salgan premiados (R-14)', () => {
    const { serieDe } = dibujar();

    expect(serieDe('ES').data).toEqual([100, 100, 200, 200, null, null, null]);
    expect(serieDe('FS').data).toEqual([null, null, null, null, 200, 200, 200]);
  });

  it('pone viernes, sábado y domingo en la serie de fin de semana, y los demás días fuera (R-14)', () => {
    const { serieDe } = dibujar();
    const enFinDeSemana = serieDe('FS').data.map((valor) => valor !== null);

    expect(enFinDeSemana).toEqual([false, false, false, false, true, true, true]);
  });

  it('distingue el fin de semana por color y por un patrón, no solo por color', () => {
    const { serieDe } = dibujar();
    const finDeSemana = serieDe('FS').itemStyle;
    const entreSemana = serieDe('ES').itemStyle;

    expect(finDeSemana.color).not.toBe(entreSemana.color);
    expect(finDeSemana.decal).toBeDefined();
    expect(entreSemana.decal).toBeUndefined();
  });

  it('muestra una leyenda con los nombres recibidos, para que se lea qué significa la marca', () => {
    const leyenda = dibujar().opcion.legend as { show?: boolean; data: string[] };

    expect(leyenda.show).not.toBe(false);
    expect(leyenda.data).toEqual(['ES', 'FS']);
  });

  it('apila las dos series en la misma pila, para que cada barra ocupe todo su ancho', () => {
    const { series } = dibujar();
    const pilas = new Set(series.map((s) => s.stack));

    expect(pilas.size).toBe(1);
    expect(pilas.has(undefined)).toBe(false);
  });

  it('formatea el eje de montos en MXN (R-17)', () => {
    const formatter = (
      dibujar().opcion.yAxis as { axisLabel: { formatter: (v: number) => string } }
    ).axisLabel.formatter;

    expect(formatter(12345.6)).toBe('$12,345.60');
  });

  it('acota el grosor de todas las barras', () => {
    const { series } = dibujar();

    expect(series).toHaveLength(2);
    expect(series.every((s) => (s.barMaxWidth as number) > 0)).toBe(true);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(dibujar().opcion.aria).toMatchObject({ enabled: true });
  });
});
