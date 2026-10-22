import { describe, expect, it } from 'vitest';

import {
  leerUmbral,
  leerUmbralesGuardados,
  UMBRALES_POR_DEFECTO,
} from '../../src/dominio/hallazgos';

describe('R-16 los umbrales por defecto', () => {
  it('son los de DOMINIO.md', () => {
    expect(UMBRALES_POR_DEFECTO).toEqual({
      categoriaDominante: 0.35,
      quincena: 1.5,
      finDeSemana: 1.2,
      diasDeViaje: 4,
      factorDeAtipicos: 3,
    });
  });
});

describe('R-16 leerUmbral: lo que el analista escribe', () => {
  it('la dominante se escribe en % y se guarda en proporción: 35 es 0.35', () => {
    expect(leerUmbral('categoriaDominante', '35')).toEqual({ valido: true, valor: 0.35 });
  });

  it('los demás umbrales se guardan tal cual: 1.5 en quincena', () => {
    expect(leerUmbral('quincena', '1.5')).toEqual({ valido: true, valor: 1.5 });
  });

  it('acepta 100 en la dominante y espacios a los lados', () => {
    expect(leerUmbral('categoriaDominante', ' 100 ')).toEqual({ valido: true, valor: 1 });
  });

  it.each([
    ['vacío', ''],
    ['solo espacios', '   '],
    ['texto', 'abc'],
    ['cero', '0'],
    ['negativo', '-3'],
  ])('%s es inválido en la quincena', (_caso, texto) => {
    expect(leerUmbral('quincena', texto)).toEqual({ valido: false });
  });

  it('más de 100 en la dominante es inválido, pero 100.1 sí vale en la quincena', () => {
    expect(leerUmbral('categoriaDominante', '100.1')).toEqual({ valido: false });
    expect(leerUmbral('quincena', '100.1')).toEqual({ valido: true, valor: 100.1 });
  });

  it('la dominante también rechaza vacío, 0 y negativo', () => {
    expect(leerUmbral('categoriaDominante', '')).toEqual({ valido: false });
    expect(leerUmbral('categoriaDominante', '0')).toEqual({ valido: false });
    expect(leerUmbral('categoriaDominante', '-1')).toEqual({ valido: false });
  });
});

describe('R-16 leerUmbralesGuardados: lo que el navegador devuelve', () => {
  it.each([
    ['null', null],
    ['un número', 7],
    ['un texto', 'hola'],
    ['una lista', [1, 2]],
    ['un objeto vacío', {}],
  ])('%s da todos los valores por defecto', (_caso, valor) => {
    expect(leerUmbralesGuardados(valor)).toEqual(UMBRALES_POR_DEFECTO);
  });

  it('un campo de otro tipo toma su valor por defecto y no tumba a los demás', () => {
    expect(leerUmbralesGuardados({ quincena: '2', diasDeViaje: 6 })).toEqual({
      ...UMBRALES_POR_DEFECTO,
      diasDeViaje: 6,
    });
  });

  it('finDeSemana -1 vuelve a 1.2 y la quincena 2 se conserva', () => {
    const leidos = leerUmbralesGuardados({ finDeSemana: -1, quincena: 2 });

    expect(leidos.finDeSemana).toBe(1.2);
    expect(leidos.quincena).toBe(2);
  });

  it('la dominante guardada es proporción: 1.5 está fuera de rango y 0.5 vale', () => {
    expect(leerUmbralesGuardados({ categoriaDominante: 1.5 }).categoriaDominante).toBe(0.35);
    expect(leerUmbralesGuardados({ categoriaDominante: 0.5 }).categoriaDominante).toBe(0.5);
  });

  it('NaN o infinito no valen', () => {
    expect(leerUmbralesGuardados({ factorDeAtipicos: Infinity }).factorDeAtipicos).toBe(3);
  });

  it('un objeto completo válido se devuelve tal cual', () => {
    const completo = {
      categoriaDominante: 0.5,
      quincena: 2,
      finDeSemana: 1.4,
      diasDeViaje: 6,
      factorDeAtipicos: 4,
    };

    expect(leerUmbralesGuardados(completo)).toEqual(completo);
  });
});
