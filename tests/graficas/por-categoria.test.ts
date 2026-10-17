import type { BarSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import type { Metricas } from '../../src/dominio/metricas';
import { porCategoria } from '../../src/graficas/por-categoria';

const METRICAS: Metricas = {
  gastoTotal: 1000,
  numeroDeTransacciones: 12,
  ticketPromedio: 1000 / 12,
  mediana: 50,
  gastoPromedioPorDia: 1000 / 31,
  gastoPorCategoria: [
    { categoria: 'Viajes', monto: 12345.67, transacciones: 1, proporcion: 0.4823 },
    { categoria: 'Comida', monto: 900, transacciones: 9, proporcion: 0.3 },
    { categoria: 'Salud', monto: 10.126, transacciones: 2, proporcion: 0.0123 },
  ],
  gastoPorZona: [],
  gastoPorCuenta: [],
  gastoPorDia: [],
  gastoPorHora: [],
  transaccionesSinHora: 0,
  gastoPorDiaDeLaSemana: [],
};

function barras() {
  const opcion = porCategoria(METRICAS);
  const [serie] = opcion.series as BarSeriesOption[];
  const datos = (serie?.data ?? []) as {
    value: number;
    itemStyle?: { color?: string };
    label?: { formatter?: string; position?: string };
  }[];
  return { opcion, serie, datos };
}

describe('porCategoria', () => {
  it('dibuja una barra por categoría, con su monto, en el orden de Metricas', () => {
    const { opcion, datos } = barras();

    expect((opcion.yAxis as { data: string[] }).data).toEqual(['Viajes', 'Comida', 'Salud']);
    expect(datos.map((d) => d.value)).toEqual([12345.67, 900, 10.126]);
  });

  it('es de barras horizontales con la primera categoría arriba', () => {
    const { opcion, serie } = barras();

    expect(serie?.type).toBe('bar');
    expect((opcion.xAxis as { type: string }).type).toBe('value');
    expect(opcion.yAxis as { type: string; inverse: boolean }).toMatchObject({
      type: 'category',
      inverse: true,
    });
  });

  it('la primera barra lleva un color de énfasis distinto al del resto', () => {
    const { datos } = barras();
    const [primera, ...resto] = datos.map((d) => d.itemStyle?.color);

    expect(primera).toBeDefined();
    expect(resto).toHaveLength(2);
    expect(resto[0]).toBeDefined();
    expect(resto[0]).toBe(resto[1]);
    expect(primera).not.toBe(resto[0]);
  });

  it('cada barra se etiqueta con su monto y su proporción en formato R-17', () => {
    const { datos } = barras();

    expect(datos.map((d) => d.label?.formatter)).toEqual([
      '$12,345.67 · 48.2%',
      '$900.00 · 30.0%',
      '$10.13 · 1.2%',
    ]);
  });

  it('pone la etiqueta de cada barra a su derecha, fuera de ella, para que las barras cortas no la tapen', () => {
    const { datos } = barras();

    expect(datos.map((d) => d.label?.position)).toEqual(['right', 'right', 'right']);
  });

  it('deja margen a la derecha para la etiqueta de la dominante', () => {
    const { opcion } = barras();
    const grid = opcion.grid as { right?: number | string };

    expect(grid.right).toBeDefined();
    expect(grid.right).not.toBe(0);
  });

  it('oculta el eje de valores: cada barra ya trae su monto formateado y el eje mostraría números sin formato', () => {
    const { opcion } = barras();

    expect((opcion.xAxis as { show?: boolean }).show).toBe(false);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(barras().opcion.aria).toMatchObject({ enabled: true });
  });

  it('acota el grosor de la barra, para que una sola categoría no llene el alto', () => {
    const unaSola = porCategoria({
      ...METRICAS,
      gastoPorCategoria: [{ categoria: 'Viajes', monto: 100, transacciones: 1, proporcion: 1 }],
    });
    const [serie] = unaSola.series as BarSeriesOption[];

    expect(serie?.barMaxWidth).toBeGreaterThan(0);
  });

  it('sin categorías devuelve una gráfica vacía y no falla', () => {
    const vacia = porCategoria({ ...METRICAS, gastoPorCategoria: [] });
    const [serie] = vacia.series as BarSeriesOption[];

    expect(serie?.data).toEqual([]);
  });
});
