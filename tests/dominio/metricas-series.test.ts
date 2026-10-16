import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { metricas } from '../../src/dominio/metricas';
import { gasto, gastosDe } from './ayudas';

const FIXTURE = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);
const JULIO = { desde: '2026-07-01', hasta: '2026-07-31' };

function metricasDelFixture() {
  return metricas(parsearCsv(readFileSync(FIXTURE, 'utf-8')).transacciones);
}

function numerosDe(valor: unknown): number[] {
  if (typeof valor === 'number') return [valor];
  if (Array.isArray(valor)) return valor.flatMap(numerosDe);
  if (valor !== null && typeof valor === 'object') return Object.values(valor).flatMap(numerosDe);
  return [];
}

describe('R-13 y R-14 gasto por día del periodo', () => {
  it('el 15 de julio del fixture es de quincena, con 125 transacciones y 107 565.60', () => {
    const dias = metricasDelFixture().gastoPorDia;

    const quince = dias.find((d) => d.dia === '2026-07-15');

    expect(quince).toMatchObject({ tipo: 'quincena', transacciones: 125, finDeSemana: false });
    expect(quince?.monto).toBeCloseTo(107565.6, 2);
  });

  it('sin periodo recorre el mes de las transacciones, del 1 al 31 de julio y en orden', () => {
    const dias = metricasDelFixture().gastoPorDia.map((d) => d.dia);

    expect(dias).toHaveLength(31);
    expect(dias[0]).toBe('2026-07-01');
    expect(dias[30]).toBe('2026-07-31');
    expect(dias).toEqual([...dias].sort());
  });

  it('del 1 al 3 de julio con gasto solo el 1 y el 3 hay tres entradas y la del 2 vale 0', () => {
    const tx = [
      gasto({ id: 'A', monto: 100, dia: '2026-07-01' }),
      gasto({ id: 'B', monto: 40, dia: '2026-07-03' }),
      gasto({ id: 'C', monto: 60, dia: '2026-07-03' }),
    ];

    const { gastoPorDia } = metricas(tx, { desde: '2026-07-01', hasta: '2026-07-03' });

    expect(gastoPorDia).toEqual([
      {
        dia: '2026-07-01',
        monto: 100,
        transacciones: 1,
        tipo: 'post-quincena',
        finDeSemana: false,
      },
      { dia: '2026-07-02', monto: 0, transacciones: 0, tipo: 'normal', finDeSemana: false },
      { dia: '2026-07-03', monto: 100, transacciones: 2, tipo: 'normal', finDeSemana: true },
    ]);
  });

  it('un periodo de 0 días no tiene entradas aunque haya gastos', () => {
    const tx = gastosDe([10], { dia: '2026-07-05' });

    expect(metricas(tx, { desde: '2026-07-20', hasta: '2026-07-05' }).gastoPorDia).toEqual([]);
  });

  it('sin transacciones ni periodo no inventa un mes', () => {
    expect(metricas([]).gastoPorDia).toEqual([]);
  });
});

describe('R-03 gasto por hora', () => {
  it('una transacción a las 08:30:00 y otra sin hora: la hora 8 tiene 1, ninguna otra tiene gasto y hay 1 sin hora', () => {
    const tx = [
      gasto({ id: 'A', monto: 50, hora: '08:30:00' }),
      gasto({ id: 'B', monto: 70, hora: null }),
    ];

    const m = metricas(tx);

    expect(m.gastoPorHora).toHaveLength(24);
    expect(m.gastoPorHora.map((h) => h.hora)).toEqual(Array.from({ length: 24 }, (_, i) => i));
    expect(m.gastoPorHora[8]).toEqual({ hora: 8, monto: 50, transacciones: 1 });
    expect(m.gastoPorHora.filter((h) => h.transacciones > 0)).toHaveLength(1);
    expect(m.transaccionesSinHora).toBe(1);
  });

  it('00:00:00 cae en la hora 0 y 23:59:59 en la hora 23', () => {
    const tx = [
      gasto({ id: 'A', monto: 1, hora: '00:00:00' }),
      gasto({ id: 'B', monto: 2, hora: '23:59:59' }),
    ];

    const { gastoPorHora } = metricas(tx);

    expect(gastoPorHora[0]).toMatchObject({ transacciones: 1, monto: 1 });
    expect(gastoPorHora[23]).toMatchObject({ transacciones: 1, monto: 2 });
  });

  it('en el fixture, a las 20 horas hay 197 transacciones por 177 904.41 y ninguna queda sin hora', () => {
    const m = metricasDelFixture();

    expect(m.gastoPorHora[20]?.transacciones).toBe(197);
    expect(m.gastoPorHora[20]?.monto).toBeCloseTo(177904.41, 2);
    expect(m.transaccionesSinHora).toBe(0);
  });
});

describe('R-14 gasto por día de la semana', () => {
  it('son 7 entradas de lunes a domingo y el viernes, sábado y domingo son de fin de semana', () => {
    const { gastoPorDiaDeLaSemana } = metricas([], JULIO);

    expect(gastoPorDiaDeLaSemana.map((d) => d.diaDeLaSemana)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(gastoPorDiaDeLaSemana.map((d) => d.finDeSemana)).toEqual([
      false,
      false,
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it('julio de 2026 cuenta 5 viernes y 4 lunes, y el promedio del viernes es su monto entre 5', () => {
    const viernes = metricasDelFixture().gastoPorDiaDeLaSemana[4];
    const lunes = metricasDelFixture().gastoPorDiaDeLaSemana[0];

    expect(viernes?.dias).toBe(5);
    expect(viernes?.monto).toBeCloseTo(440942.7, 2);
    expect(viernes?.promedio).toBeCloseTo(88188.54, 2);
    expect(lunes?.dias).toBe(4);
    expect(lunes?.promedio).toBeCloseTo(27174.6, 2);
  });

  it('el promedio divide entre los días del periodo, no entre los días con gasto', () => {
    const tx = gastosDe([1000], { dia: '2026-07-03' });

    const viernes = metricas(tx, JULIO).gastoPorDiaDeLaSemana[4];

    expect(viernes).toMatchObject({ monto: 1000, dias: 5, promedio: 200 });
  });

  it('con un periodo corto cuenta solo los días que caen en él y un día ausente promedia 0', () => {
    const tx = gastosDe([90], { dia: '2026-07-01' });

    const semana = metricas(tx, { desde: '2026-07-01', hasta: '2026-07-03' }).gastoPorDiaDeLaSemana;

    expect(semana.map((d) => d.dias)).toEqual([0, 0, 1, 1, 1, 0, 0]);
    expect(semana[2]).toMatchObject({ monto: 90, promedio: 90 });
    expect(semana[0]).toMatchObject({ monto: 0, promedio: 0 });
  });
});

describe('R-12 gasto por zona y por cuenta', () => {
  it('la primera zona del fixture es Centro Histórico, CDMX, con 755 transacciones y su parte del monto', () => {
    const primera = metricasDelFixture().gastoPorZona[0];

    expect(primera?.zona).toBe('Centro Histórico, CDMX');
    expect(primera?.transacciones).toBe(755);
    expect(primera?.monto).toBeCloseTo(700525.14, 2);
    expect(primera?.proporcion).toBeCloseTo(0.414642, 5);
  });

  it('la primera cuenta del fixture es la tarjeta de crédito ****6361', () => {
    const primera = metricasDelFixture().gastoPorCuenta[0];

    expect(primera?.cuenta).toBe('Tarjeta de Crédito ****6361');
    expect(primera?.monto).toBeCloseTo(1081126.06, 2);
    expect(primera?.proporcion).toBeCloseTo(0.63992, 5);
  });

  it('ordena de mayor a menor monto, desempata por nombre y sus proporciones suman 1', () => {
    const tx = [
      gasto({ id: 'A', monto: 50, zona: 'Roma', cuenta: 'Efectivo' }),
      gasto({ id: 'B', monto: 50, zona: 'Condesa', cuenta: 'Débito' }),
      gasto({ id: 'C', monto: 100, zona: 'Polanco', cuenta: 'Efectivo' }),
    ];

    const m = metricas(tx);

    expect(m.gastoPorZona.map((z) => z.zona)).toEqual(['Polanco', 'Condesa', 'Roma']);
    expect(m.gastoPorZona.map((z) => z.proporcion)).toEqual([0.5, 0.25, 0.25]);
    expect(m.gastoPorCuenta).toEqual([
      { cuenta: 'Efectivo', monto: 150, transacciones: 2, proporcion: 0.75 },
      { cuenta: 'Débito', monto: 50, transacciones: 1, proporcion: 0.25 },
    ]);
  });
});

describe('R-11 y R-12 conjunto vacío con periodo', () => {
  it('con el periodo de julio los KPIs valen 0, zona y cuenta están vacías y ninguna serie tiene NaN ni infinito', () => {
    const m = metricas([], JULIO);

    expect(m).toMatchObject({
      gastoTotal: 0,
      numeroDeTransacciones: 0,
      ticketPromedio: 0,
      mediana: 0,
      gastoPromedioPorDia: 0,
    });
    expect(m.gastoPorZona).toEqual([]);
    expect(m.gastoPorCuenta).toEqual([]);
    expect(m.gastoPorDia).toHaveLength(31);
    expect(m.transaccionesSinHora).toBe(0);
    const numeros = numerosDe(m);
    expect(numeros.length).toBeGreaterThan(0);
    expect(numeros.every(Number.isFinite)).toBe(true);
  });
});
