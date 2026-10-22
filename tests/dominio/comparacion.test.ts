import { describe, expect, it } from 'vitest';

import { comparar } from '../../src/dominio/comparacion';
import type { Transaccion } from '../../src/dominio/esquema';

import { gasto } from './ayudas';

function en(mes: string, ...gastos: [categoria: string, monto: number][]): Transaccion[] {
  return gastos.map(([categoria, monto], i) =>
    gasto({ id: `TX${String(i + 1).padStart(6, '0')}`, dia: `${mes}-10`, categoria, monto }),
  );
}

const JULIO = en('2026-07', ['Comida', 600], ['Comida', 400], ['Transporte', 500], ['Renta', 2500]);
const AGOSTO = en('2026-08', ['Comida', 1500], ['Transporte', 250], ['Ocio', 250]);

describe('R-15 diferencia por categoría y en el total', () => {
  it('julio contra agosto: montos por mes, diferencia absoluta y proporción, con una categoría nueva (Ocio) y otra que desaparece (Renta)', () => {
    const resultado = comparar({ '2026-07': JULIO, '2026-08': AGOSTO });

    expect(resultado).toEqual({
      meses: ['2026-07', '2026-08'],
      categorias: [
        {
          nombre: 'Comida',
          montos: [1000, 1500],
          diferencias: [{ absoluta: 500, proporcion: 0.5 }],
        },
        {
          nombre: 'Ocio',
          montos: [0, 250],
          diferencias: [{ absoluta: 250, proporcion: null }],
        },
        {
          nombre: 'Transporte',
          montos: [500, 250],
          diferencias: [{ absoluta: -250, proporcion: -0.5 }],
        },
        {
          nombre: 'Renta',
          montos: [2500, 0],
          diferencias: [{ absoluta: -2500, proporcion: -1 }],
        },
      ],
      total: {
        nombre: 'Total',
        montos: [4000, 2000],
        diferencias: [{ absoluta: -2000, proporcion: -0.5 }],
      },
    });
  });

  it('con monto anterior 0 la proporción es null, nunca Infinity ni NaN', () => {
    const { categorias } = comparar({
      '2026-07': en('2026-07', ['Comida', 100]),
      '2026-08': en('2026-08', ['Ocio', 40]),
    });

    for (const fila of categorias) {
      for (const { proporcion } of fila.diferencias) {
        expect(proporcion === null || Number.isFinite(proporcion)).toBe(true);
      }
    }
    expect(
      categorias.find((fila) => fila.nombre === 'Ocio')?.diferencias[0]?.proporcion,
    ).toBeNull();
  });

  it('una categoría ausente en los dos meses consecutivos da diferencia 0 y proporción null', () => {
    const { categorias } = comparar({
      '2026-07': en('2026-07', ['Renta', 100]),
      '2026-08': en('2026-08', ['Comida', 10]),
      '2026-09': en('2026-09', ['Comida', 10]),
    });
    const renta = categorias.find((fila) => fila.nombre === 'Renta');

    expect(renta?.diferencias).toEqual([
      { absoluta: -100, proporcion: -1 },
      { absoluta: 0, proporcion: null },
    ]);
  });
});

describe('R-15 el orden de los meses y de las categorías', () => {
  it('las claves en desorden dan el mismo resultado que en orden cronológico', () => {
    const enOrden = comparar({ '2026-07': JULIO, '2026-08': AGOSTO });
    const enDesorden = comparar({ '2026-08': AGOSTO, '2026-07': JULIO });

    expect(enDesorden).toEqual(enOrden);
    expect(enDesorden.meses).toEqual(['2026-07', '2026-08']);
  });

  it('un cambio de año ordena diciembre antes que enero', () => {
    const resultado = comparar({
      '2026-01': en('2026-01', ['Comida', 200]),
      '2025-12': en('2025-12', ['Comida', 100]),
    });

    expect(resultado.meses).toEqual(['2025-12', '2026-01']);
    expect(resultado.total.montos).toEqual([100, 200]);
  });

  it('las categorías van de mayor a menor monto del último mes y, con empate, por nombre', () => {
    const { categorias } = comparar({ '2026-07': JULIO, '2026-08': AGOSTO });

    expect(categorias.map((fila) => fila.nombre)).toEqual([
      'Comida',
      'Ocio',
      'Transporte',
      'Renta',
    ]);
  });
});

describe('R-15 con más de dos meses', () => {
  const SEPTIEMBRE = en('2026-09', ['Comida', 150], ['Cine', 40]);
  const resultado = comparar({
    '2026-07': en('2026-07', ['Comida', 100], ['Cine', 100]),
    '2026-08': en('2026-08', ['Comida', 250]),
    '2026-09': SEPTIEMBRE,
  });

  it('tres meses dan dos diferencias, cada una contra el mes anterior y no contra el primero', () => {
    expect(resultado.total).toEqual({
      nombre: 'Total',
      montos: [200, 250, 190],
      diferencias: [
        { absoluta: 50, proporcion: 0.25 },
        { absoluta: -60, proporcion: -0.24 },
      ],
    });
  });

  it('una categoría ausente en el mes de en medio vuelve con proporción null', () => {
    const cine = resultado.categorias.find((fila) => fila.nombre === 'Cine');

    expect(cine).toEqual({
      nombre: 'Cine',
      montos: [100, 0, 40],
      diferencias: [
        { absoluta: -100, proporcion: -1 },
        { absoluta: 40, proporcion: null },
      ],
    });
  });

  it('una categoría presente en los tres meses compara cada mes con el anterior', () => {
    const comida = resultado.categorias.find((fila) => fila.nombre === 'Comida');

    expect(comida?.diferencias).toEqual([
      { absoluta: 150, proporcion: 1.5 },
      { absoluta: -100, proporcion: -0.4 },
    ]);
  });
});

describe('R-15 casos de frontera', () => {
  it('con un solo mes hay montos y ninguna diferencia', () => {
    const resultado = comparar({ '2026-07': JULIO });

    expect(resultado.total).toEqual({ nombre: 'Total', montos: [4000], diferencias: [] });
    expect(resultado.categorias.every((fila) => fila.diferencias.length === 0)).toBe(true);
  });

  it('sin meses devuelve una comparación vacía', () => {
    expect(comparar({})).toEqual({
      meses: [],
      categorias: [],
      total: { nombre: 'Total', montos: [], diferencias: [] },
    });
  });

  it('no redondea: los montos y diferencias conservan todos sus decimales', () => {
    const resultado = comparar({
      '2026-07': en('2026-07', ['Comida', 10.126]),
      '2026-08': en('2026-08', ['Comida', 20.252]),
    });

    expect(resultado.total.montos).toEqual([10.126, 20.252]);
    expect(resultado.total.diferencias[0]?.absoluta).toBe(10.126);
  });
});
