import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { csv, ENCABEZADO_MINIMO, leerFixtureAMano, rechazoDe } from './ayudas';

const FIXTURE_DEL_GENERADOR = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);

describe('casos borde de la carga: archivos que no se pueden usar', () => {
  it.each([
    ['texto vacío', ''],
    ['solo saltos de línea', '\r\n\r\n'],
    ['solo el BOM', '﻿'],
  ])('%s se rechaza con el motivo de archivo vacío', (_caso, texto) => {
    expect(rechazoDe(texto).motivo).toEqual({ codigo: 'vacio' });
  });

  it.each([
    ['con \\n', csv(ENCABEZADO_MINIMO)],
    ['con \\r\\n y líneas en blanco al final', `${ENCABEZADO_MINIMO}\r\n\r\n\r\n`],
    ['sin salto de línea final', ENCABEZADO_MINIMO],
  ])('solo el encabezado (%s) se rechaza con el motivo de archivo sin filas', (_caso, texto) => {
    expect(rechazoDe(texto).motivo).toEqual({ codigo: 'sin-filas' });
  });

  it('con todas las filas de monto 0 se rechaza con el motivo de mes sin filas válidas', () => {
    const texto = csv(ENCABEZADO_MINIMO, '2026-07-01,0,Uno', '2026-07-02,0,Dos');

    expect(rechazoDe(texto).motivo).toEqual({ codigo: 'sin-filas-validas' });
  });
});

describe('casos borde de la carga: el CSV tal como lo escribe una hoja de cálculo', () => {
  it('un archivo con BOM, \\r\\n y acentos conserva los textos y reconoce el encabezado', () => {
    const { transacciones, invalidas } = parsearCsv(leerFixtureAMano('bom-crlf.csv'));

    expect(invalidas).toEqual([]);
    expect(transacciones[0]).toEqual({
      id: 'TX000107',
      dia: '2026-07-03',
      hora: '09:15:00',
      monto: 120.5,
      concepto: 'Panadería Ñuñoa',
      categoria: 'Comida',
      cuenta: 'Tarjeta de Crédito ****8072',
      zona: 'Roma Norte, CDMX',
      latitud: 19.4195,
      longitud: -99.1627,
    });
  });

  it('el mismo contenido con \\n y sin BOM da exactamente el mismo resultado', () => {
    const conBomYCrlf = leerFixtureAMano('bom-crlf.csv');
    const conLf = conBomYCrlf.replace('﻿', '').replaceAll('\r\n', '\n');

    expect(parsearCsv(conLf)).toEqual(parsearCsv(conBomYCrlf));
  });

  it('un valor entrecomillado con coma conserva la coma y no corre las columnas', () => {
    const { transacciones } = parsearCsv(leerFixtureAMano('comas-entre-comillas.csv'));

    expect(transacciones.map((t) => [t.concepto, t.zona, t.monto])).toEqual([
      ['Tacos, salsas y más', 'Roma Norte, CDMX', 189.9],
      ['Jugo', 'Coyoacán, CDMX', 95],
    ]);
  });

  it('un punto y coma dentro de un valor no cambia el delimitador', () => {
    const { transacciones } = parsearCsv(csv(ENCABEZADO_MINIMO, '2026-07-01,10,"Pan; leche"'));

    expect(transacciones[0]?.concepto).toBe('Pan; leche');
  });
});

describe('fixture del generador (2026-07-semilla-1)', () => {
  const resultado = parsearCsv(readFileSync(FIXTURE_DEL_GENERADOR, 'utf-8'));

  it('da 2 000 transacciones del mes 2026-07 y ninguna fila inválida', () => {
    expect(resultado.mes).toBe('2026-07');
    expect(resultado.transacciones).toHaveLength(2000);
    expect(resultado.invalidas).toEqual([]);
  });

  it('conserva los ids del archivo, todos distintos, y el gasto total del archivo', () => {
    const ids = new Set(resultado.transacciones.map((t) => t.id));
    const total = resultado.transacciones.reduce((suma, t) => suma + t.monto, 0);

    expect(ids.size).toBe(2000);
    expect(total).toBeCloseTo(1689470.67, 2);
  });

  it('lee la primera fila del archivo completa, con su zona entrecomillada y sus coordenadas', () => {
    expect(resultado.transacciones[0]).toEqual({
      id: 'TX000001',
      dia: '2026-07-01',
      hora: '00:12:32',
      monto: 2679.41,
      concepto: 'Tienda de ropa Montañez',
      categoria: 'Compras',
      cuenta: 'Tarjeta de Crédito ****6361',
      zona: 'Centro Histórico, CDMX',
      latitud: 19.430083,
      longitud: -99.13719,
    });
  });
});
