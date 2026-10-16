import type { BarSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import type { GastoDeHora, Metricas } from '../../src/dominio/metricas';
import { porHora } from '../../src/graficas/por-hora';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const HORAS: GastoDeHora[] = Array.from({ length: 24 }, (_, hora) => ({
  hora,
  monto: hora === 3 ? 0 : hora * 100 + 0.5,
  transacciones: hora === 3 ? 0 : 1,
}));

const METRICAS: Metricas = { ...METRICAS_VACIAS, gastoPorHora: HORAS, transaccionesSinHora: 7 };

function dibujar(metricas: Metricas = METRICAS) {
  const opcion = porHora(metricas);
  const [serie] = opcion.series as BarSeriesOption[];
  return { opcion, serie, datos: (serie?.data ?? []) as number[] };
}

describe('porHora', () => {
  it('dibuja 24 barras, de la hora 0 a la 23 y en ese orden, con su monto', () => {
    const { opcion, datos } = dibujar();

    expect(datos).toHaveLength(24);
    expect(datos).toEqual(HORAS.map((h) => h.monto));
    const horas = (opcion.xAxis as { data: string[] }).data;
    expect(horas).toHaveLength(24);
    expect(horas[0]).toBe('00');
    expect(horas[23]).toBe('23');
  });

  it('no inventa una barra para las transacciones sin hora (R-03)', () => {
    const { opcion, datos } = dibujar();

    expect((opcion.xAxis as { data: string[] }).data).toHaveLength(24);
    expect(datos.reduce((suma, monto) => suma + monto, 0)).toBeCloseTo(
      HORAS.reduce((suma, h) => suma + h.monto, 0),
    );
  });

  it('formatea el eje de montos en MXN (R-17)', () => {
    const { opcion } = dibujar();
    const formatter = (opcion.yAxis as { axisLabel: { formatter: (v: number) => string } })
      .axisLabel.formatter;

    expect(formatter(12345.6)).toBe('$12,345.60');
  });

  it('acota el grosor de las barras', () => {
    expect(dibujar().serie?.barMaxWidth).toBeGreaterThan(0);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(dibujar().opcion.aria).toMatchObject({ enabled: true });
  });
});
