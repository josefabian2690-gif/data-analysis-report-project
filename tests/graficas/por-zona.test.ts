import type { BarSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import type { Metricas } from '../../src/dominio/metricas';
import { porZona } from '../../src/graficas/por-zona';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const METRICAS: Metricas = {
  ...METRICAS_VACIAS,
  gastoPorZona: [
    { zona: 'Centro Histórico, CDMX', monto: 12345.67, transacciones: 5, proporcion: 0.4823 },
    { zona: 'Polanco, CDMX', monto: 900, transacciones: 9, proporcion: 0.3 },
    { zona: 'Coyoacán, CDMX', monto: 10.126, transacciones: 2, proporcion: 0.0123 },
  ],
};

function barras(metricas: Metricas = METRICAS) {
  const opcion = porZona(metricas);
  const [serie] = opcion.series as BarSeriesOption[];
  const datos = (serie?.data ?? []) as {
    value: number;
    label?: { formatter?: string };
  }[];
  return { opcion, serie, datos };
}

describe('porZona', () => {
  it('dibuja una barra por zona, con su monto, en el orden de Metricas', () => {
    const { opcion, datos } = barras();

    expect((opcion.yAxis as { data: string[] }).data).toEqual([
      'Centro Histórico, CDMX',
      'Polanco, CDMX',
      'Coyoacán, CDMX',
    ]);
    expect(datos.map((d) => d.value)).toEqual([12345.67, 900, 10.126]);
  });

  it('etiqueta cada barra con su monto y su proporción en formato R-17', () => {
    expect(barras().datos.map((d) => d.label?.formatter)).toEqual([
      '$12,345.67 · 48.2%',
      '$900.00 · 30.0%',
      '$10.13 · 1.2%',
    ]);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(barras().opcion.aria).toMatchObject({ enabled: true });
  });

  it('acota el grosor de la barra, para que una sola zona no llene el alto', () => {
    const { serie } = barras({ ...METRICAS, gastoPorZona: METRICAS.gastoPorZona.slice(0, 1) });

    expect(serie?.barMaxWidth).toBeGreaterThan(0);
  });

  it('sin zonas devuelve una gráfica vacía y no falla', () => {
    const { serie } = barras({ ...METRICAS, gastoPorZona: [] });

    expect(serie?.data).toEqual([]);
  });
});
