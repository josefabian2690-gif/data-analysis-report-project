import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { esMes, leerMesGuardado, type Transaccion } from '../../src/dominio/esquema';

import { gasto } from './ayudas';

const FIXTURE_DE_JULIO = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);

const JULIO = '2026-07';

function listaDeJulio(): Transaccion[] {
  return [
    gasto({ id: 'TX000001', dia: '2026-07-01', hora: '08:30:00', monto: 120.5 }),
    gasto({
      id: 'TX000002',
      dia: '2026-07-31',
      hora: null,
      monto: 10.126,
      concepto: 'Taxi',
      categoria: 'Transporte',
      cuenta: 'Débito',
      zona: 'Roma Norte, CDMX',
      latitud: 19.4194,
      longitud: -99.1627,
    }),
  ];
}

function conCambio(cambio: Record<string, unknown>): unknown[] {
  const [primera, ...resto] = listaDeJulio();
  return [{ ...primera, ...cambio }, ...resto];
}

function sinCampo(campo: keyof Transaccion): unknown[] {
  const [primera, ...resto] = listaDeJulio();
  const incompleta: Record<string, unknown> = { ...primera };
  delete incompleta[campo];
  return [incompleta, ...resto];
}

function motivoDeRechazo(valor: unknown): string {
  const resultado = leerMesGuardado(JULIO, valor);
  if (resultado.ok) throw new Error('la lista se aceptó y debía rechazarse');
  return resultado.motivo;
}

describe('esMes: el mes de la ruta nunca sale de la carpeta del historial', () => {
  it.each(['2026-07', '2026-01', '2026-12', '1999-09'])('acepta %s', (texto) => {
    expect(esMes(texto)).toBe(true);
  });

  it.each([
    '2026-13',
    '2026-00',
    '2026-7',
    '26-07',
    '2026-07-01',
    '../x',
    '../2026-07',
    '2026-07/..',
    ' 2026-07',
    '2026-07\n',
    '',
  ])('rechaza %j', (texto) => {
    expect(esMes(texto)).toBe(false);
  });
});

describe('leerMesGuardado: lo que se acepta', () => {
  it('devuelve tal cual la lista válida de julio', () => {
    const lista = listaDeJulio();

    expect(leerMesGuardado(JULIO, lista)).toEqual({ ok: true, transacciones: listaDeJulio() });
  });

  it('acepta los límites: hora 23:59:59, latitud 90 y longitud -180', () => {
    const lista = conCambio({ hora: '23:59:59', latitud: 90, longitud: -180 });

    expect(leerMesGuardado(JULIO, lista).ok).toBe(true);
  });

  it('acepta tal cual lo que la carga produce de un CSV real del generador', () => {
    const { mes, transacciones } = parsearCsv(readFileSync(FIXTURE_DE_JULIO, 'utf-8'));

    expect(leerMesGuardado(mes, transacciones)).toEqual({ ok: true, transacciones });
  });

  it('acepta latitud 0 con longitud 0: el cero es una coordenada', () => {
    expect(leerMesGuardado(JULIO, conCambio({ latitud: 0, longitud: 0 })).ok).toBe(true);
  });

  it('acepta un monto positivo mínimo con decimales', () => {
    expect(leerMesGuardado(JULIO, conCambio({ monto: 0.01 })).ok).toBe(true);
  });
});

describe('leerMesGuardado: lo que se rechaza, con motivo legible', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['un objeto', { transacciones: [] }],
    ['una cadena', 'TX000001'],
    ['un número', 42],
  ])('rechaza un valor que no es una lista (%s)', (_nombre, valor) => {
    expect(motivoDeRechazo(valor)).toMatch(/\S/);
  });

  it('rechaza la lista vacía', () => {
    expect(motivoDeRechazo([])).toMatch(/\S/);
  });

  it.each([
    ['null', null],
    ['una cadena', 'TX000001'],
    ['una lista', []],
    ['un número', 5],
  ])('rechaza un elemento que no es un objeto (%s)', (_nombre, elemento) => {
    expect(motivoDeRechazo([...listaDeJulio(), elemento])).toMatch(/\S/);
  });

  it.each([
    'id',
    'dia',
    'hora',
    'monto',
    'concepto',
    'categoria',
    'cuenta',
    'zona',
    'latitud',
    'longitud',
  ] as const)('rechaza una transacción a la que le falta %s', (campo) => {
    expect(motivoDeRechazo(sinCampo(campo))).toMatch(/\S/);
  });

  it('rechaza una transacción con un campo de más', () => {
    expect(motivoDeRechazo(conCambio({ nota: 'extra' }))).toMatch(/\S/);
  });

  it.each([
    ['id numérico', { id: 7 }],
    ['concepto numérico', { concepto: 5 }],
    ['categoria nula', { categoria: null }],
    ['cuenta numérica', { cuenta: 1 }],
    ['zona nula', { zona: null }],
    ['dia numérico', { dia: 20260701 }],
    ['hora numérica', { hora: 83000 }],
    ['monto como cadena numérica', { monto: '12.5' }],
    ['latitud como cadena', { latitud: '19.4', longitud: -99.1 }],
    ['longitud como cadena', { latitud: 19.4, longitud: '-99.1' }],
  ])('rechaza el tipo equivocado: %s', (_nombre, cambio) => {
    expect(motivoDeRechazo(conCambio(cambio))).toMatch(/\S/);
  });

  it.each([
    ['cero', 0],
    ['negativo', -50],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('rechaza un monto %s (R-04)', (_nombre, monto) => {
    expect(motivoDeRechazo(conCambio({ monto }))).toMatch(/\S/);
  });

  it.each([
    ['id vacío', { id: '' }],
    ['concepto vacío', { concepto: '' }],
  ])('rechaza %s', (_nombre, cambio) => {
    expect(motivoDeRechazo(conCambio(cambio))).toMatch(/\S/);
  });

  it.each([
    ['otro mes', '2026-08-01'],
    ['el mismo mes de otro año', '2025-07-01'],
    ['un día que el mes no tiene', '2026-07-32'],
    ['un 30 de febrero', '2026-02-30'],
    ['otro formato', '01/07/2026'],
    ['con la hora pegada', '2026-07-01 10:00:00'],
    ['vacío', ''],
  ])('rechaza un dia con %s (R-08)', (_nombre, dia) => {
    expect(motivoDeRechazo(conCambio({ dia, hora: null }))).toMatch(/\S/);
  });

  it.each(['25:00:00', '24:00:00', '12:60:00', '12:00:60', '9:00:00', '10:00', '10:00:00 ', ''])(
    'rechaza la hora %j (R-03)',
    (hora) => {
      expect(motivoDeRechazo(conCambio({ hora }))).toMatch(/\S/);
    },
  );

  it.each([
    ['latitud 0 con longitud null', { latitud: 0, longitud: null }],
    ['latitud null con longitud 0', { latitud: null, longitud: 0 }],
    ['solo latitud', { latitud: 19.4, longitud: null }],
    ['solo longitud', { latitud: null, longitud: -99.1 }],
  ])('rechaza una sola coordenada: %s (R-07)', (_nombre, cambio) => {
    expect(motivoDeRechazo(conCambio(cambio))).toMatch(/\S/);
  });

  it.each([
    ['latitud 90.1', { latitud: 90.1, longitud: 0 }],
    ['latitud -91', { latitud: -91, longitud: 0 }],
    ['longitud 180.1', { latitud: 0, longitud: 180.1 }],
    ['longitud -181', { latitud: 0, longitud: -181 }],
    ['latitud NaN', { latitud: Number.NaN, longitud: 0 }],
    ['longitud Infinity', { latitud: 0, longitud: Number.POSITIVE_INFINITY }],
  ])('rechaza una coordenada fuera de rango: %s (R-07)', (_nombre, cambio) => {
    expect(motivoDeRechazo(conCambio(cambio))).toMatch(/\S/);
  });

  it('rechaza un id repetido dentro del mes (R-06)', () => {
    const [primera, segunda] = listaDeJulio() as [Transaccion, Transaccion];

    expect(motivoDeRechazo([primera, { ...segunda, id: primera.id }])).toMatch(/\S/);
  });

  it('rechaza una lista con una sola transacción de otro mes entre las de julio (R-08)', () => {
    const lista = [...listaDeJulio(), gasto({ id: 'TX000003', dia: '2026-08-01', monto: 5 })];

    expect(motivoDeRechazo(lista)).toMatch(/\S/);
  });
});

describe('leerMesGuardado: el mes de la ruta manda (R-09, los meses nunca se mezclan)', () => {
  const listaDeAgosto = [
    gasto({ id: 'TX000001', dia: '2026-08-01', monto: 10 }),
    gasto({ id: 'TX000002', dia: '2026-08-15', monto: 20 }),
  ];

  it('rechaza una lista entera de agosto validada contra 2026-07', () => {
    expect(leerMesGuardado('2026-07', listaDeAgosto).ok).toBe(false);
  });

  it('rechaza una lista de julio validada contra 2026-08', () => {
    expect(leerMesGuardado('2026-08', listaDeJulio()).ok).toBe(false);
  });

  it('acepta la lista de agosto validada contra 2026-08', () => {
    expect(leerMesGuardado('2026-08', listaDeAgosto)).toEqual({
      ok: true,
      transacciones: listaDeAgosto,
    });
  });

  it.each(['2026', '2026-0', '2026-7', ''])(
    'rechaza una lista de julio validada contra el mes mal formado %j',
    (mes) => {
      expect(leerMesGuardado(mes, listaDeJulio()).ok).toBe(false);
    },
  );
});
