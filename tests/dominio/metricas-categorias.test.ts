import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { metricas } from '../../src/dominio/metricas';
import { gasto, gastosDe } from './ayudas';

const FIXTURES = fileURLToPath(new URL('../fixtures/generador/', import.meta.url));

describe('R-12 gasto por categoría sobre el monto', () => {
  it('9 gastos de Comida que suman 100 y 1 de Viajes por 900: Viajes va primero con 0.9 y Comida con 0.1', () => {
    const comida = gastosDe(Array(9).fill(100 / 9) as number[], { categoria: 'Comida' });
    const viajes = [gasto({ monto: 900, categoria: 'Viajes', id: 'TX000100' })];

    const { gastoPorCategoria } = metricas([...comida, ...viajes]);

    expect(gastoPorCategoria.map((c) => c.categoria)).toEqual(['Viajes', 'Comida']);
    expect(gastoPorCategoria[0]).toMatchObject({ monto: 900, transacciones: 1, proporcion: 0.9 });
    expect(gastoPorCategoria[1]?.transacciones).toBe(9);
    expect(gastoPorCategoria[1]?.monto).toBeCloseTo(100, 9);
    expect(gastoPorCategoria[1]?.proporcion).toBeCloseTo(0.1, 9);
  });

  it('con montos iguales ordena por nombre', () => {
    const tx = [
      gasto({ monto: 50, categoria: 'Salud' }),
      gasto({ monto: 50, categoria: 'Compras' }),
      gasto({ monto: 50, categoria: 'Ocio' }),
    ];

    expect(metricas(tx).gastoPorCategoria.map((c) => c.categoria)).toEqual([
      'Compras',
      'Ocio',
      'Salud',
    ]);
  });

  it('suma todos los gastos de una categoría y las proporciones suman 1', () => {
    const tx = [
      gasto({ monto: 30, categoria: 'A' }),
      gasto({ monto: 20, categoria: 'A' }),
      gasto({ monto: 50, categoria: 'B' }),
    ];

    const { gastoPorCategoria } = metricas(tx);

    expect(gastoPorCategoria).toEqual([
      { categoria: 'A', monto: 50, transacciones: 2, proporcion: 0.5 },
      { categoria: 'B', monto: 50, transacciones: 1, proporcion: 0.5 },
    ]);
  });

  it('la categoría dominante del fixture 2026-07-semilla-1 va primera', () => {
    const csv = readFileSync(`${FIXTURES}2026-07-semilla-1.csv`, 'utf-8');
    const esperado = JSON.parse(
      readFileSync(`${FIXTURES}2026-07-semilla-1.esperado.json`, 'utf-8'),
    ) as { categoriaDominante: string };

    const { gastoPorCategoria } = metricas(parsearCsv(csv).transacciones);

    expect(esperado.categoriaDominante).toBe('Compras');
    expect(gastoPorCategoria[0]?.categoria).toBe(esperado.categoriaDominante);
  });
});
