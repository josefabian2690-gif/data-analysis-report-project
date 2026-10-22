import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { metricas } from '../../src/dominio/metricas';
import { gasto } from './ayudas';

const FIXTURE = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);

function metricasDelFixture() {
  return metricas(parsearCsv(readFileSync(FIXTURE, 'utf-8')).transacciones);
}

describe('puntos del mapa (R-02, R-07)', () => {
  it('julio de la semilla 1 da 2 000 puntos en 7 zonas: 755 en Centro Histórico y 247 en Monterrey', () => {
    const { puntosDelMapa } = metricasDelFixture();

    const cuenta = (zona: string) => puntosDelMapa.find((g) => g.zona === zona)?.puntos.length;
    expect(puntosDelMapa).toHaveLength(7);
    expect(puntosDelMapa.reduce((suma, g) => suma + g.puntos.length, 0)).toBe(2000);
    expect(cuenta('Centro Histórico, CDMX')).toBe(755);
    expect(cuenta('Monterrey, N.L.')).toBe(247);
  });

  it('las zonas van en el orden de gastoPorZona', () => {
    const m = metricasDelFixture();

    expect(m.puntosDelMapa.map((g) => g.zona)).toEqual(m.gastoPorZona.map((z) => z.zona));
  });

  it('cada punto lleva longitud, latitud y monto de su transacción', () => {
    const tx = [
      gasto({ id: 'A', monto: 10, zona: 'Roma, CDMX', latitud: 19.41, longitud: -99.16 }),
      gasto({ id: 'B', monto: 5, zona: 'Roma, CDMX', latitud: 19.42, longitud: -99.17 }),
    ];

    expect(metricas(tx).puntosDelMapa).toEqual([
      {
        zona: 'Roma, CDMX',
        puntos: [
          { longitud: -99.16, latitud: 19.41, monto: 10 },
          { longitud: -99.17, latitud: 19.42, monto: 5 },
        ],
      },
    ]);
  });

  it('una transacción sin coordenadas no es punto y se cuenta aparte', () => {
    const tx = [
      gasto({ id: 'A', monto: 10, zona: 'Roma, CDMX', latitud: 19.41, longitud: -99.16 }),
      gasto({ id: 'B', monto: 20, zona: 'Roma, CDMX', latitud: 19.42, longitud: -99.17 }),
      gasto({ id: 'C', monto: 30, zona: 'Roma, CDMX' }),
    ];

    const m = metricas(tx);

    expect(m.puntosDelMapa.flatMap((g) => g.puntos)).toHaveLength(2);
    expect(m.transaccionesSinCoordenadas).toBe(1);
  });

  it('con una sola de las dos coordenadas la transacción cuenta como sin coordenadas', () => {
    const tx = [gasto({ id: 'A', monto: 10, zona: 'Roma, CDMX', latitud: 19.41, longitud: null })];

    const m = metricas(tx);

    expect(m.puntosDelMapa).toEqual([]);
    expect(m.transaccionesSinCoordenadas).toBe(1);
  });

  it('una zona cuyas transacciones no tienen coordenadas no es un grupo', () => {
    const tx = [
      gasto({ id: 'A', monto: 99, zona: 'Polanco, CDMX' }),
      gasto({ id: 'B', monto: 1, zona: 'Roma, CDMX', latitud: 19.41, longitud: -99.16 }),
    ];

    expect(metricas(tx).puntosDelMapa.map((g) => g.zona)).toEqual(['Roma, CDMX']);
  });

  it('«Sin zona» con coordenadas es un grupo del mapa', () => {
    const tx = [gasto({ id: 'A', monto: 1, latitud: 19.4, longitud: -99.1 })];

    expect(metricas(tx).puntosDelMapa.map((g) => g.zona)).toEqual(['Sin zona']);
  });

  it('un conjunto vacío no tiene puntos, ni cuenta, ni ciudad principal', () => {
    const m = metricas([]);

    expect(m.puntosDelMapa).toEqual([]);
    expect(m.transaccionesSinCoordenadas).toBe(0);
    expect(m.ciudadPrincipal).toBeUndefined();
  });
});

describe('ciudad principal en las métricas', () => {
  it('la semilla 1 tiene a CDMX como ciudad principal', () => {
    expect(metricasDelFixture().ciudadPrincipal).toBe('CDMX');
  });

  it('es la de mayor gasto del conjunto que se mide', () => {
    const tx = [
      gasto({ id: 'A', monto: 10, zona: 'Roma, CDMX' }),
      gasto({ id: 'B', monto: 50, zona: 'Centro, N.L.' }),
    ];

    expect(metricas(tx).ciudadPrincipal).toBe('N.L.');
  });
});
