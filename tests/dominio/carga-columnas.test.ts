import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { csv, ENCABEZADO_MINIMO, leerFixtureAMano, rechazoDe } from './ayudas';

describe('R-01 columnas obligatorias', () => {
  it('sin monto, rechaza la carga y la lista de columnas que faltan trae monto', () => {
    const rechazo = rechazoDe(csv('fecha,concepto', '2026-07-01,Cafe'));

    expect(rechazo.motivo).toEqual({ codigo: 'faltan-columnas', columnas: ['monto'] });
  });

  it('sin fecha ni concepto, la lista trae las dos', () => {
    const rechazo = rechazoDe(csv('monto,categoria', '10.00,Comida'));

    expect(rechazo.motivo).toEqual({
      codigo: 'faltan-columnas',
      columnas: ['fecha', 'concepto'],
    });
  });

  it('una columna desconocida no cambia las transacciones', () => {
    const base = parsearCsv(csv(ENCABEZADO_MINIMO, '2026-07-01 10:00:00,25.50,Cafe'));
    const conNotas = parsearCsv(
      csv(`${ENCABEZADO_MINIMO},notas`, '2026-07-01 10:00:00,25.50,Cafe,hola'),
    );

    expect(conNotas.transacciones).toEqual(base.transacciones);
    expect(conNotas.invalidas).toEqual([]);
  });

  it('los nombres de columna se recortan: un encabezado con espacios sigue siendo válido', () => {
    const { transacciones } = parsearCsv(csv(' fecha , monto ,concepto ', '2026-07-01,10,Cafe'));

    expect(transacciones).toHaveLength(1);
  });

  it('un BOM delante de la primera columna obligatoria no la hace desaparecer', () => {
    const { transacciones } = parsearCsv(`\uFEFF${csv(ENCABEZADO_MINIMO, '2026-07-01,10,Cafe')}`);

    expect(transacciones).toHaveLength(1);
  });
});

describe('R-02 valores por defecto de las columnas opcionales', () => {
  it('sin columnas opcionales, cada transacción trae los valores por defecto y no tiene coordenadas', () => {
    const { transacciones } = parsearCsv(leerFixtureAMano('minimo.csv'));

    expect(transacciones).toHaveLength(3);
    for (const transaccion of transacciones) {
      expect(transaccion).toMatchObject({
        categoria: 'Sin categoría',
        cuenta: 'Sin cuenta',
        zona: 'Sin zona',
        latitud: null,
        longitud: null,
      });
    }
  });

  it('una celda opcional vacía toma su valor por defecto y la fila es válida', () => {
    const encabezado = `${ENCABEZADO_MINIMO},categoria,cuenta,zona`;
    const { transacciones, invalidas } = parsearCsv(csv(encabezado, '2026-07-01,10,Cafe,,,'));

    expect(invalidas).toEqual([]);
    expect(transacciones[0]).toMatchObject({
      categoria: 'Sin categoría',
      cuenta: 'Sin cuenta',
      zona: 'Sin zona',
    });
  });

  it('sin id_transaccion, los ids son TX000001, TX000002… en orden de fecha aunque el archivo venga desordenado', () => {
    const { transacciones } = parsearCsv(leerFixtureAMano('minimo.csv'));

    const idPorConcepto = Object.fromEntries(transacciones.map((t) => [t.concepto, t.id]));
    expect(idPorConcepto).toEqual({
      'Renta parcial': 'TX000001',
      Camion: 'TX000002',
      Cafe: 'TX000003',
    });
  });

  it('una fila sin hora cuenta como el inicio de su día para ordenar los ids', () => {
    const { transacciones } = parsearCsv(
      csv(ENCABEZADO_MINIMO, '2026-07-05 00:00:01,1,Con hora', '2026-07-05,2,Sin hora'),
    );

    const idPorConcepto = Object.fromEntries(transacciones.map((t) => [t.concepto, t.id]));
    expect(idPorConcepto).toEqual({ 'Sin hora': 'TX000001', 'Con hora': 'TX000002' });
  });

  it('una fila a las 00:00:00 y una sin hora del mismo día empatan: manda el orden del archivo', () => {
    const { transacciones } = parsearCsv(
      csv(ENCABEZADO_MINIMO, '2026-07-05 00:00:00,1,Medianoche', '2026-07-05,2,Sin hora'),
    );

    const idPorConcepto = Object.fromEntries(transacciones.map((t) => [t.concepto, t.id]));
    expect(idPorConcepto).toEqual({ Medianoche: 'TX000001', 'Sin hora': 'TX000002' });
  });

  it('con la misma fecha, los ids siguen el orden del archivo', () => {
    const { transacciones } = parsearCsv(
      csv(ENCABEZADO_MINIMO, '2026-07-05 10:00:00,1,Primera', '2026-07-05 10:00:00,2,Segunda'),
    );

    expect(transacciones.map((t) => t.id)).toEqual(['TX000001', 'TX000002']);
  });

  it('los ids generados no chocan con un id que ya está en el archivo, ni siquiera el de una fila inválida', () => {
    const { transacciones } = parsearCsv(
      csv(
        `id_transaccion,${ENCABEZADO_MINIMO}`,
        'TX000001,2026-07-01,10,Con id',
        ',2026-07-02,20,Sin id uno',
        'TX000002,2026-07-03,0,Inválida con id',
        ',2026-07-04,30,Sin id dos',
      ),
    );

    const ids = transacciones.map((t) => t.id);
    expect(ids).toEqual(['TX000001', 'TX000003', 'TX000004']);
  });
});
