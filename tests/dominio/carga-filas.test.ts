import { describe, expect, it } from 'vitest';

import { parsearCsv, pideConfirmacion } from '../../src/dominio/carga';
import { csv, ENCABEZADO_MINIMO, leerFixtureAMano } from './ayudas';

const FILA_VALIDA = '2026-07-01 08:00:00,10.00,Cafe';

function cargaConUnaFila(fila: string) {
  return parsearCsv(csv(ENCABEZADO_MINIMO, FILA_VALIDA, fila));
}

function cargaDeCien(invalidas: number) {
  const filas = Array.from({ length: 100 }, (_, i) =>
    i < invalidas ? '2026-07-01,0,Inválida' : `2026-07-01,${i + 1},Válida ${i}`,
  );
  return parsearCsv(csv(ENCABEZADO_MINIMO, ...filas));
}

describe('R-03 formatos de fecha', () => {
  it('una fecha con hora da el día y la hora', () => {
    const { transacciones } = parsearCsv(csv(ENCABEZADO_MINIMO, '2026-07-14 18:05:00,10,Cafe'));

    expect(transacciones[0]).toMatchObject({ dia: '2026-07-14', hora: '18:05:00' });
  });

  it('una fecha sin hora da el día y ninguna hora, para que no cuente en el análisis por hora', () => {
    const { transacciones } = parsearCsv(csv(ENCABEZADO_MINIMO, '2026-07-14,10,Cafe'));

    expect(transacciones[0]).toMatchObject({ dia: '2026-07-14', hora: null });
  });

  it.each([
    ['otro formato', '14/07/2026'],
    ['día que no existe en febrero', '2026-02-30'],
    ['31 en un mes de 30 días', '2026-04-31'],
    ['mes 13', '2026-13-01'],
    ['día 0', '2026-07-00'],
    ['hora 24', '2026-07-14 24:00:00'],
    ['minuto 60', '2026-07-14 18:60:00'],
    ['segundo 60', '2026-07-14 18:05:60'],
    ['mes 0', '2026-00-10'],
    ['hora sin segundos', '2026-07-14 18:05'],
    ['separador T', '2026-07-14T18:05:00'],
    ['29 de febrero fuera de año bisiesto', '2026-02-29'],
    ['29 de febrero de un siglo no bisiesto', '2100-02-29'],
    ['fecha vacía', ''],
  ])('%s hace la fila inválida con motivo de fecha', (_caso, fecha) => {
    const { transacciones, invalidas } = cargaConUnaFila(`${fecha},10,Cafe`);

    expect(transacciones).toHaveLength(1);
    expect(invalidas).toEqual([{ fila: 3, motivo: 'fecha' }]);
  });

  it.each([
    ['año bisiesto', '2028-02-29'],
    ['siglo bisiesto', '2000-02-29'],
    ['último día de un mes de 31 días', '2026-07-31'],
    ['último segundo del día', '2026-07-31 23:59:59'],
  ])('%s es una fecha válida', (_caso, fecha) => {
    const { transacciones, invalidas } = parsearCsv(csv(ENCABEZADO_MINIMO, `${fecha},10,Cafe`));

    expect(invalidas).toEqual([]);
    expect(transacciones).toHaveLength(1);
  });
});

describe('R-03 y R-04 espacios alrededor de los valores', () => {
  it('los espacios alrededor de la fecha, el monto y el concepto no hacen la fila inválida ni quedan en los datos', () => {
    const { transacciones, invalidas } = parsearCsv(
      csv(ENCABEZADO_MINIMO, ' 2026-07-14 18:05:00 , 10.50 , Cafe '),
    );

    expect(invalidas).toEqual([]);
    expect(transacciones[0]).toMatchObject({
      dia: '2026-07-14',
      hora: '18:05:00',
      monto: 10.5,
      concepto: 'Cafe',
    });
  });
});

describe('R-04 monto', () => {
  it.each([
    ['cero', '0'],
    ['cero con decimales', '0.00'],
    ['negativo', '-15.50'],
    ['texto', 'abc'],
    ['separador de miles', '"1,234.50"'],
    ['texto pegado a un número', '12abc'],
    ['notación científica', '1e3'],
    ['sin parte entera', '.5'],
    ['vacío', ''],
    ['más grande de lo que un número puede guardar', '9'.repeat(400)],
  ])('%s hace la fila inválida con motivo de monto', (_caso, monto) => {
    const { transacciones, invalidas } = cargaConUnaFila(`2026-07-02,${monto},Cafe`);

    expect(transacciones).toHaveLength(1);
    expect(invalidas).toEqual([{ fila: 3, motivo: 'monto' }]);
  });

  it('un monto con más de dos decimales es válido y se conserva sin redondear', () => {
    const { transacciones } = parsearCsv(csv(ENCABEZADO_MINIMO, '2026-07-02,10.125,Cafe'));

    expect(transacciones[0]?.monto).toBe(10.125);
  });

  it.each([
    ['0.01', 0.01],
    ['100', 100],
    ['1234.5', 1234.5],
  ])('el monto %s es válido', (texto, monto) => {
    const { transacciones } = parsearCsv(csv(ENCABEZADO_MINIMO, `2026-07-02,${texto},Cafe`));

    expect(transacciones[0]?.monto).toBe(monto);
  });
});

describe('R-05 filas inválidas excluidas y reportadas', () => {
  it('la tercera fila de datos con monto 0 es la fila 4 (el encabezado es la fila 1)', () => {
    const filas = Array.from({ length: 10 }, (_, i) =>
      i === 2 ? '2026-07-01,0,Tercera' : `2026-07-01,${i + 1},Fila ${i}`,
    );

    const { transacciones, invalidas } = parsearCsv(csv(ENCABEZADO_MINIMO, ...filas));

    expect(transacciones).toHaveLength(9);
    expect(invalidas).toEqual([{ fila: 4, motivo: 'monto' }]);
  });

  it('un archivo con varias filas malas las reporta todas, con su fila y su motivo, y deja las buenas', () => {
    const { transacciones, invalidas } = parsearCsv(leerFixtureAMano('invalidas.csv'));

    expect(transacciones.map((t) => t.concepto)).toEqual(['Uno', 'Dos', 'Nueve', 'Diez']);
    expect(invalidas).toEqual([
      { fila: 4, motivo: 'monto' },
      { fila: 5, motivo: 'monto' },
      { fila: 6, motivo: 'fecha' },
      { fila: 7, motivo: 'fecha' },
      { fila: 8, motivo: 'concepto-vacio' },
      { fila: 9, motivo: 'monto' },
    ]);
  });

  it('un concepto vacío hace la fila inválida con un motivo que nombra concepto', () => {
    const { invalidas } = cargaConUnaFila('2026-07-02,10,');

    expect(invalidas).toEqual([{ fila: 3, motivo: 'concepto-vacio' }]);
  });

  it('una fila con fecha y monto malos se reporta una sola vez, por la fecha', () => {
    const { invalidas } = cargaConUnaFila('14/07/2026,0,Cafe');

    expect(invalidas).toEqual([{ fila: 3, motivo: 'fecha' }]);
  });

  it('una celda obligatoria vacía manda sobre el formato de las otras: se reporta por la vacía', () => {
    expect(cargaConUnaFila('14/07/2026,10,').invalidas).toEqual([
      { fila: 3, motivo: 'concepto-vacio' },
    ]);
    expect(cargaConUnaFila('14/07/2026,,Cafe').invalidas).toEqual([{ fila: 3, motivo: 'monto' }]);
  });

  it('una fila con monto vacío y concepto vacío se reporta por el monto', () => {
    const { invalidas } = cargaConUnaFila('2026-07-02,,');

    expect(invalidas).toEqual([{ fila: 3, motivo: 'monto' }]);
  });
});

describe('R-04 y R-05 fila mal formada', () => {
  it('una fila con campos de más (un monto con coma sin comillas) es inválida y no entra con los datos corridos', () => {
    const { transacciones, invalidas } = cargaConUnaFila('2026-07-08,1,234.50,Ocho');

    expect(transacciones).toHaveLength(1);
    expect(invalidas).toEqual([{ fila: 3, motivo: 'fila-mal-formada' }]);
  });

  it('una fila con campos de menos es inválida', () => {
    const { transacciones, invalidas } = cargaConUnaFila('2026-07-08,10');

    expect(transacciones).toHaveLength(1);
    expect(invalidas).toEqual([{ fila: 3, motivo: 'fila-mal-formada' }]);
  });

  it('una fila con la cantidad correcta de campos pero celdas vacías conserva su motivo de siempre', () => {
    expect(cargaConUnaFila(',,').invalidas).toEqual([{ fila: 3, motivo: 'fecha' }]);
    expect(cargaConUnaFila('2026-07-08,,Cafe').invalidas).toEqual([{ fila: 3, motivo: 'monto' }]);
  });

  it('la fila mal formada se reporta como tal aunque además tenga una celda obligatoria vacía', () => {
    expect(cargaConUnaFila(',10,Cafe,sobra').invalidas).toEqual([
      { fila: 3, motivo: 'fila-mal-formada' },
    ]);
  });

  it('una línea en blanco antes de la fila mal formada no corre su número de fila', () => {
    const texto = `${ENCABEZADO_MINIMO}\n${FILA_VALIDA}\n\n2026-07-08,1,234.50,Ocho\n`;

    expect(parsearCsv(texto).invalidas).toEqual([{ fila: 3, motivo: 'fila-mal-formada' }]);
  });

  it('las filas mal formadas cuentan para el 5 % de la confirmación', () => {
    const validas = (cantidad: number) =>
      Array.from({ length: cantidad }, (_, i) => `2026-07-01,${i + 1},Válida ${i}`);
    const malas = (cantidad: number) =>
      Array.from({ length: cantidad }, () => '2026-07-01,1,234.50,x');

    expect(pideConfirmacion(parsearCsv(csv(ENCABEZADO_MINIMO, ...validas(94), ...malas(6))))).toBe(
      true,
    );
    expect(pideConfirmacion(parsearCsv(csv(ENCABEZADO_MINIMO, ...validas(95), ...malas(5))))).toBe(
      false,
    );
  });
});

describe('R-05 confirmación con más del 5 % de inválidas', () => {
  it('con 6 inválidas de 100 filas de datos pide confirmación', () => {
    expect(pideConfirmacion(cargaDeCien(6))).toBe(true);
  });

  it('con 5 inválidas de 100 filas de datos (el 5 % exacto) no la pide', () => {
    expect(pideConfirmacion(cargaDeCien(5))).toBe(false);
  });
});
