import { afterEach, describe, expect, it } from 'vitest';

import { esFinDeSemana, tipoDeDia } from '../../src/dominio/calendario';

function dias(mes: string, desde: number, hasta: number): string[] {
  return Array.from({ length: hasta - desde + 1 }, (_, i) => {
    return `${mes}-${String(desde + i).padStart(2, '0')}`;
  });
}

describe('R-13 días de quincena en un mes de 31 días', () => {
  it('en julio de 2026 el 15 y el 31 son quincena', () => {
    expect(tipoDeDia('2026-07-15')).toBe('quincena');
    expect(tipoDeDia('2026-07-31')).toBe('quincena');
  });

  it('el 1 y el 16 son post-quincena', () => {
    expect(tipoDeDia('2026-07-01')).toBe('post-quincena');
    expect(tipoDeDia('2026-07-16')).toBe('post-quincena');
  });

  it('el 12, 13 y 14 y los tres días previos al 31 (28, 29 y 30) son pre-quincena', () => {
    for (const dia of [
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
    ]) {
      expect(tipoDeDia(dia), dia).toBe('pre-quincena');
    }
  });

  it('el resto del mes es normal, con el 11 y el 27 en los bordes de la pre-quincena', () => {
    const normales = [...dias('2026-07', 2, 11), ...dias('2026-07', 17, 27)];

    for (const dia of normales) expect(tipoDeDia(dia), dia).toBe('normal');
  });
});

describe('R-13 el último día de pago cambia con la longitud del mes', () => {
  it('febrero de 2026 tiene 28 días: el 28 es quincena y el 25, 26 y 27 pre-quincena', () => {
    expect(tipoDeDia('2026-02-28')).toBe('quincena');
    for (const dia of dias('2026-02', 25, 27)) expect(tipoDeDia(dia), dia).toBe('pre-quincena');
    expect(tipoDeDia('2026-02-24')).toBe('normal');
  });

  it('febrero de 2028 es bisiesto: el 29 es quincena y el 26, 27 y 28 pre-quincena', () => {
    expect(tipoDeDia('2028-02-29')).toBe('quincena');
    for (const dia of dias('2028-02', 26, 28)) expect(tipoDeDia(dia), dia).toBe('pre-quincena');
    expect(tipoDeDia('2028-02-25')).toBe('normal');
  });

  it('septiembre de 2026 tiene 30 días: el 30 es quincena y el 27, 28 y 29 pre-quincena', () => {
    expect(tipoDeDia('2026-09-30')).toBe('quincena');
    for (const dia of dias('2026-09', 27, 29)) expect(tipoDeDia(dia), dia).toBe('pre-quincena');
    expect(tipoDeDia('2026-09-26')).toBe('normal');
  });

  it('el 15, el 16 y el 1 conservan su tipo en cualquier longitud de mes', () => {
    for (const mes of ['2026-02', '2028-02', '2026-09', '2026-07']) {
      expect(tipoDeDia(`${mes}-15`), mes).toBe('quincena');
      expect(tipoDeDia(`${mes}-16`), mes).toBe('post-quincena');
      expect(tipoDeDia(`${mes}-01`), mes).toBe('post-quincena');
    }
  });
});

describe('R-14 el fin de semana va de viernes a domingo', () => {
  const zonaOriginal = process.env['TZ'];

  afterEach(() => {
    if (zonaOriginal === undefined) delete process.env['TZ'];
    else process.env['TZ'] = zonaOriginal;
  });

  it.each(['America/Mexico_City', 'Asia/Tokyo'])(
    'con TZ=%s, del 1 al 7 de julio de 2026 el 3, 4 y 5 son fin de semana y los demás no',
    (zona) => {
      process.env['TZ'] = zona;
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(zona);

      const esperado = [false, false, true, true, true, false, false];

      expect(dias('2026-07', 1, 7).map(esFinDeSemana)).toEqual(esperado);
    },
  );

  it('el jueves anterior y el lunes siguiente no son fin de semana, en un mes y un año distintos', () => {
    expect(esFinDeSemana('2026-02-26')).toBe(false);
    expect(esFinDeSemana('2026-02-27')).toBe(true);
    expect(esFinDeSemana('2026-03-01')).toBe(true);
    expect(esFinDeSemana('2026-03-02')).toBe(false);
  });
});
