import { describe, expect, it } from 'vitest';

import { formatearConteo, formatearMes } from '../../src/cliente/presentacion';

describe('formatearConteo', () => {
  it('pone la coma de miles de es-MX en el número de transacciones', () => {
    expect(formatearConteo(2000)).toBe('2,000');
    expect(formatearConteo(1234567)).toBe('1,234,567');
  });

  it('deja sin separador lo que no llega a mil', () => {
    expect(formatearConteo(3)).toBe('3');
  });
});

describe('formatearMes', () => {
  it('escribe el mes de AAAA-MM con su nombre en es-MX y el año', () => {
    expect(formatearMes('2026-07')).toBe('julio de 2026');
    expect(formatearMes('2026-01')).toBe('enero de 2026');
    expect(formatearMes('2025-12')).toBe('diciembre de 2025');
  });
});
