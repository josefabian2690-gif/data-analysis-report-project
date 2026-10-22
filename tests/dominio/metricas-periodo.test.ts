import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { filtrar, periodoDelFiltro } from '../../src/dominio/filtro';
import { metricas } from '../../src/dominio/metricas';
import { gastosDe } from './ayudas';

const FIXTURE = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);

describe('R-11 gasto promedio por día del periodo filtrado', () => {
  it('del 1 al 10 de julio del fixture el gasto es 458 549.33 y el promedio 45 854.933 (10 días)', () => {
    const { mes, transacciones } = parsearCsv(readFileSync(FIXTURE, 'utf-8'));
    const filtro = { desde: '2026-07-01', hasta: '2026-07-10' };

    const m = metricas(filtrar(transacciones, filtro), periodoDelFiltro(mes, filtro));

    expect(m.numeroDeTransacciones).toBe(590);
    expect(m.gastoTotal).toBeCloseTo(458549.33, 2);
    expect(m.gastoPromedioPorDia).toBeCloseTo(45854.933, 3);
  });

  it('cuenta los días del periodo sin gasto: 2 000 en dos días de un periodo de 10 dan 200 por día', () => {
    const tx = [
      ...gastosDe([1000], { dia: '2026-07-01' }),
      ...gastosDe([1000], { dia: '2026-07-03' }),
    ];

    const m = metricas(tx, { desde: '2026-07-01', hasta: '2026-07-10' });

    expect(m.gastoPromedioPorDia).toBe(200);
  });

  it('un periodo de un solo día divide entre 1', () => {
    const m = metricas(gastosDe([300], { dia: '2026-07-05' }), {
      desde: '2026-07-05',
      hasta: '2026-07-05',
    });

    expect(m.gastoPromedioPorDia).toBe(300);
  });

  it('un periodo de 0 días da promedio 0, sin NaN ni infinito, aunque haya gastos', () => {
    const tx = gastosDe([500, 700], { dia: '2026-07-05' });

    const m = metricas(tx, { desde: '2026-07-20', hasta: '2026-07-05' });

    expect(m.gastoPromedioPorDia).toBe(0);
  });

  it('el periodo de un filtro con el inicio después del fin también da promedio 0', () => {
    const filtro = { desde: '2026-07-20', hasta: '2026-07-05' };
    const tx = gastosDe([500], { dia: '2026-07-05' });

    const m = metricas(tx, periodoDelFiltro('2026-07', filtro));

    expect(m.gastoPromedioPorDia).toBe(0);
  });

  it('sin periodo divide entre los días naturales del mes, y un periodo vacío no se confunde con no darlo', () => {
    const tx = gastosDe([3100], { dia: '2026-07-05' });

    expect(metricas(tx).gastoPromedioPorDia).toBe(100);
    expect(metricas(tx, { desde: '2026-07-20', hasta: '2026-07-05' }).gastoPromedioPorDia).toBe(0);
  });
});
