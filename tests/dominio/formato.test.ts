import { afterEach, describe, expect, it } from 'vitest';

import {
  formatearDiferenciaDeMonto,
  formatearDiferenciaDeProporcion,
  formatearFecha,
  formatearMonto,
  formatearProporcion,
} from '../../src/dominio/formato';

describe('R-17 montos en MXN', () => {
  it.each([
    [12345.67, '$12,345.67'],
    [900, '$900.00'],
    [10.126, '$10.13'],
    [0, '$0.00'],
  ])('el monto %s se muestra como %s', (monto, texto) => {
    expect(formatearMonto(monto)).toBe(texto);
  });
});

describe('R-17 fechas dd/mm/aaaa', () => {
  it.each([
    ['2026-09-15', '15/09/2026'],
    ['2026-07-01', '01/07/2026'],
  ])('el día %s se muestra como %s', (dia, texto) => {
    expect(formatearFecha(dia)).toBe(texto);
  });
});

describe('R-17 porcentajes con un decimal', () => {
  it.each([
    [0.4823, '48.2%'],
    [0.9, '90.0%'],
    [1, '100.0%'],
    [0, '0.0%'],
  ])('la proporción %s se muestra como %s', (proporcion, texto) => {
    expect(formatearProporcion(proporcion)).toBe(texto);
  });
});

describe('R-17 diferencias de monto con signo', () => {
  it.each([
    [588512.93, '+$588,512.93'],
    [-612819.78, '-$612,819.78'],
    [0, '$0.00'],
    [0.5, '+$0.50'],
  ])('la diferencia %s se muestra como %s', (diferencia, texto) => {
    expect(formatearDiferenciaDeMonto(diferencia)).toBe(texto);
  });
});

describe('R-17 diferencias de proporción con signo', () => {
  it.each([
    [2.275, '+227.5%'],
    [-0.0857, '-8.6%'],
    [0, '0.0%'],
    [-1, '-100.0%'],
  ])('la diferencia %s se muestra como %s', (diferencia, texto) => {
    expect(formatearDiferenciaDeProporcion(diferencia)).toBe(texto);
  });
});

describe('R-17 no depende de la zona horaria de la máquina', () => {
  const zonaOriginal = process.env['TZ'];

  afterEach(() => {
    if (zonaOriginal === undefined) delete process.env['TZ'];
    else process.env['TZ'] = zonaOriginal;
  });

  it.each(['America/Mexico_City', 'Pacific/Kiritimati', 'Pacific/Pago_Pago'])(
    'con TZ=%s las fechas, montos y porcentajes salen igual',
    (zona) => {
      process.env['TZ'] = zona;
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(zona);

      expect(formatearFecha('2026-07-01')).toBe('01/07/2026');
      expect(formatearFecha('2026-09-15')).toBe('15/09/2026');
      expect(formatearMonto(12345.67)).toBe('$12,345.67');
      expect(formatearProporcion(0.4823)).toBe('48.2%');
    },
  );
});
