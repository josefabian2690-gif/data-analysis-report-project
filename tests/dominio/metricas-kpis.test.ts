import { describe, expect, it } from 'vitest';

import { metricas } from '../../src/dominio/metricas';
import { gastosDe } from './ayudas';

describe('R-11 KPIs del mes', () => {
  it('tres gastos de 100, 200 y 600 dan total 900, 3 transacciones, ticket 300 y mediana 200', () => {
    const m = metricas(gastosDe([100, 200, 600]));

    expect(m).toMatchObject({
      gastoTotal: 900,
      numeroDeTransacciones: 3,
      ticketPromedio: 300,
      mediana: 200,
    });
  });

  it('con un número par de gastos la mediana es el promedio de los dos centrales', () => {
    expect(metricas(gastosDe([100, 200, 300, 1000])).mediana).toBe(250);
  });

  it('la mediana no depende del orden en que llegan los gastos ni cambia la lista recibida', () => {
    const entrada = gastosDe([600, 100, 200]);

    expect(metricas(entrada).mediana).toBe(200);
    expect(entrada.map((t) => t.monto)).toEqual([600, 100, 200]);
  });

  it('no redondea: el ticket promedio conserva todos los decimales', () => {
    expect(metricas(gastosDe([10, 10, 11])).ticketPromedio).toBeCloseTo(10.333333333, 9);
  });

  it('el gasto promedio por día divide entre los 31 días de julio aunque haya días sin gasto', () => {
    const julio = gastosDe([1000, 2100], { dia: '2026-07-05' });

    expect(metricas(julio).gastoPromedioPorDia).toBe(100);
  });

  it('el gasto promedio por día divide entre los 29 días de un febrero bisiesto', () => {
    const febrero = gastosDe([900, 2000], { dia: '2028-02-10' });

    expect(metricas(febrero).gastoPromedioPorDia).toBe(100);
  });

  it('el gasto promedio por día de febrero no bisiesto divide entre 28', () => {
    expect(metricas(gastosDe([2800], { dia: '2027-02-10' })).gastoPromedioPorDia).toBe(100);
  });

  it('una lista vacía da todos los KPIs en 0, finitos, y ninguna categoría', () => {
    const m = metricas([]);

    expect(m).toMatchObject({
      gastoTotal: 0,
      numeroDeTransacciones: 0,
      ticketPromedio: 0,
      mediana: 0,
      gastoPromedioPorDia: 0,
    });
    expect(m.gastoPorCategoria).toEqual([]);
  });
});
