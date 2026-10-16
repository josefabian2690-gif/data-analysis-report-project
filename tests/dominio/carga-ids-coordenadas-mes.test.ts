import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { csv, ENCABEZADO_MINIMO, leerFixtureAMano } from './ayudas';

const ENCABEZADO_CON_ID = `id_transaccion,${ENCABEZADO_MINIMO}`;
const ENCABEZADO_CON_COORDENADAS = `${ENCABEZADO_MINIMO},latitud,longitud`;

function filasDeDatos(cantidad: number, reemplazos: Record<number, string>): string[] {
  return Array.from(
    { length: cantidad },
    (_, i) =>
      reemplazos[i + 1] ?? `TX9${String(i + 1).padStart(5, '0')},2026-07-01,10,Fila ${i + 1}`,
  );
}

describe('R-06 id repetido', () => {
  it('con el mismo id en las filas de datos 2 y 7, la 2 es transacción y la 7 es inválida por id repetido', () => {
    const filas = filasDeDatos(8, {
      2: 'TX000010,2026-07-02,10,Primera aparición',
      7: 'TX000010,2026-07-03,20,Segunda aparición',
    });

    const { transacciones, invalidas } = parsearCsv(csv(ENCABEZADO_CON_ID, ...filas));

    expect(transacciones.filter((t) => t.id === 'TX000010').map((t) => t.concepto)).toEqual([
      'Primera aparición',
    ]);
    expect(transacciones).toHaveLength(7);
    expect(invalidas).toEqual([{ fila: 8, motivo: 'id-repetido' }]);
  });

  it('si la primera aparición era inválida por el monto, la segunda es la transacción', () => {
    const { transacciones, invalidas } = parsearCsv(
      csv(
        ENCABEZADO_CON_ID,
        'TX000010,2026-07-02,0,Primera con monto malo',
        'TX000010,2026-07-03,20,Segunda correcta',
      ),
    );

    expect(transacciones.map((t) => t.concepto)).toEqual(['Segunda correcta']);
    expect(invalidas).toEqual([{ fila: 2, motivo: 'monto' }]);
  });

  it('las filas sin id no son repetidas entre sí', () => {
    const { transacciones, invalidas } = parsearCsv(
      csv(ENCABEZADO_CON_ID, ',2026-07-02,10,Una', ',2026-07-03,20,Otra'),
    );

    expect(transacciones).toHaveLength(2);
    expect(invalidas).toEqual([]);
  });

  it('el id repetido se juzga antes que el mes: la aparición de julio repite el id de una de agosto', () => {
    const { transacciones, invalidas } = parsearCsv(
      csv(
        ENCABEZADO_CON_ID,
        'TX000010,2026-08-02,10,Agosto',
        'TX000011,2026-07-02,10,Julio uno',
        'TX000012,2026-07-03,10,Julio dos',
        'TX000010,2026-07-04,10,Julio con el id de agosto',
      ),
    );

    expect(transacciones).toHaveLength(2);
    expect(invalidas).toEqual([
      { fila: 2, motivo: 'fuera-del-mes' },
      { fila: 5, motivo: 'id-repetido' },
    ]);
  });
});

describe('R-07 coordenadas', () => {
  it.each([
    ['latitud 91', '91,-99.1'],
    ['latitud -90.5', '-90.5,-99.1'],
    ['longitud 181', '19.43,181'],
    ['longitud -180.01', '19.43,-180.01'],
    ['latitud ilegible', 'abc,-99.1'],
    ['longitud ilegible', '19.43,12abc'],
    ['solo la latitud', '19.43,'],
    ['solo la longitud', ',-99.13'],
    ['las dos vacías', ','],
  ])('%s: la transacción es válida y queda sin coordenadas', (_caso, coordenadas) => {
    const { transacciones, invalidas } = parsearCsv(
      csv(ENCABEZADO_CON_COORDENADAS, `2026-07-02,10,Cafe,${coordenadas}`),
    );

    expect(invalidas).toEqual([]);
    expect(transacciones[0]).toMatchObject({ latitud: null, longitud: null });
  });

  it.each([
    ['las del ejemplo', '19.43,-99.13', 19.43, -99.13],
    ['el borde norte y oriente', '90,180', 90, 180],
    ['el borde sur y poniente', '-90,-180', -90, -180],
  ])('%s se conservan', (_caso, coordenadas, latitud, longitud) => {
    const { transacciones } = parsearCsv(
      csv(ENCABEZADO_CON_COORDENADAS, `2026-07-02,10,Cafe,${coordenadas}`),
    );

    expect(transacciones[0]).toMatchObject({ latitud, longitud });
  });

  it('un archivo sin columnas de coordenadas deja todas las transacciones sin ellas', () => {
    const { transacciones } = parsearCsv(leerFixtureAMano('minimo.csv'));

    expect(transacciones.every((t) => t.latitud === null && t.longitud === null)).toBe(true);
  });
});

describe('R-08 un CSV es un mes calendario', () => {
  function filasDelMes(mes: string, cantidad: number): string[] {
    return Array.from(
      { length: cantidad },
      (_, i) => `${mes}-${String(i + 1).padStart(2, '0')},10,Gasto`,
    );
  }

  it('con 20 filas de julio y 2 de agosto, el mes es 2026-07 y las 2 de agosto son inválidas «fuera del mes»', () => {
    const filas = [
      ...filasDelMes('2026-07', 4),
      '2026-08-01,10,Agosto',
      ...filasDelMes('2026-07', 10).slice(4),
      '2026-08-02,10,Agosto',
      ...filasDelMes('2026-07', 20).slice(10),
    ];

    const { mes, transacciones, invalidas } = parsearCsv(csv(ENCABEZADO_MINIMO, ...filas));

    expect(mes).toBe('2026-07');
    expect(transacciones).toHaveLength(20);
    expect(invalidas).toEqual([
      { fila: 6, motivo: 'fuera-del-mes' },
      { fila: 13, motivo: 'fuera-del-mes' },
    ]);
  });

  it('el mes es el de la mayoría aunque no sea el primero del archivo ni el más antiguo', () => {
    const { mes, invalidas } = parsearCsv(
      csv(ENCABEZADO_MINIMO, ...filasDelMes('2026-07', 2), ...filasDelMes('2026-08', 5)),
    );

    expect(mes).toBe('2026-08');
    expect(invalidas.map((i) => i.fila)).toEqual([2, 3]);
  });

  it('con 5 filas de julio y 5 de agosto, el mes es 2026-07', () => {
    const { mes, transacciones } = parsearCsv(
      csv(ENCABEZADO_MINIMO, ...filasDelMes('2026-07', 5), ...filasDelMes('2026-08', 5)),
    );

    expect(mes).toBe('2026-07');
    expect(transacciones).toHaveLength(5);
  });

  it('el empate se resuelve al más antiguo aunque el más reciente aparezca primero en el archivo', () => {
    const { mes } = parsearCsv(
      csv(ENCABEZADO_MINIMO, ...filasDelMes('2026-08', 5), ...filasDelMes('2026-07', 5)),
    );

    expect(mes).toBe('2026-07');
  });

  it('el empate entre diciembre y enero se resuelve al más antiguo, el año anterior', () => {
    const { mes } = parsearCsv(
      csv(ENCABEZADO_MINIMO, ...filasDelMes('2026-01', 3), ...filasDelMes('2025-12', 3)),
    );

    expect(mes).toBe('2025-12');
  });

  it('la mayoría se cuenta entre las filas válidas: las inválidas de otro mes no votan', () => {
    const { mes, invalidas } = parsearCsv(
      csv(
        ENCABEZADO_MINIMO,
        ...filasDelMes('2026-07', 3),
        ...filasDelMes('2026-08', 4).map((fila) => fila.replace(',10,', ',0,')),
      ),
    );

    expect(mes).toBe('2026-07');
    expect(invalidas.map((i) => i.motivo)).toEqual(['monto', 'monto', 'monto', 'monto']);
  });

  it('el archivo con filas de otro mes reporta cada una por su fila', () => {
    const { mes, transacciones, invalidas } = parsearCsv(leerFixtureAMano('otro-mes.csv'));

    expect(mes).toBe('2026-07');
    expect(transacciones).toHaveLength(5);
    expect(invalidas).toEqual([
      { fila: 5, motivo: 'fuera-del-mes' },
      { fila: 8, motivo: 'fuera-del-mes' },
    ]);
  });
});
