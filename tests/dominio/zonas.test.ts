import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { ciudadDeZona, ciudadPrincipal } from '../../src/dominio/zonas';
import { gasto } from './ayudas';

const SEMILLA_1 = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);

describe('ciudad de una zona', () => {
  it('es el texto tras la última coma: «Roma Norte, CDMX» es CDMX', () => {
    expect(ciudadDeZona('Roma Norte, CDMX')).toBe('CDMX');
  });

  it('con varias comas toma lo que sigue a la última, sin espacios a los lados', () => {
    expect(ciudadDeZona('Centro, Histórico ,  CDMX ')).toBe('CDMX');
  });

  it('una zona sin coma es su propia ciudad', () => {
    expect(ciudadDeZona('Condesa')).toBe('Condesa');
  });

  it('«Sin zona» (R-02) no pertenece a ninguna ciudad', () => {
    expect(ciudadDeZona('Sin zona')).toBeNull();
  });
});

describe('ciudad principal', () => {
  it('es la ciudad de mayor monto, sumando todas sus zonas', () => {
    const tx = [
      gasto({ monto: 60, zona: 'Roma, CDMX' }),
      gasto({ monto: 60, zona: 'Condesa, CDMX' }),
      gasto({ monto: 100, zona: 'Centro, N.L.' }),
    ];

    expect(ciudadPrincipal(tx)).toBe('CDMX');
  });

  it('con empate de monto gana el nombre que va primero', () => {
    const tx = [gasto({ monto: 50, zona: 'Zeta' }), gasto({ monto: 50, zona: 'Alfa' })];

    expect(ciudadPrincipal(tx)).toBe('Alfa');
  });

  it('«Sin zona» no compite aunque tenga el mayor monto', () => {
    const tx = [gasto({ monto: 1000 }), gasto({ monto: 1, zona: 'Roma, CDMX' })];

    expect(ciudadPrincipal(tx)).toBe('CDMX');
  });

  it('sin zonas con ciudad no hay ciudad principal', () => {
    expect(ciudadPrincipal([])).toBeUndefined();
    expect(ciudadPrincipal([gasto({ monto: 5 })])).toBeUndefined();
  });

  it('en la semilla 1 es CDMX y Monterrey, N.L. queda fuera', () => {
    const { transacciones } = parsearCsv(readFileSync(SEMILLA_1, 'utf-8'));

    expect(ciudadPrincipal(transacciones)).toBe('CDMX');
    expect(ciudadDeZona('Monterrey, N.L.')).not.toBe('CDMX');
  });
});
