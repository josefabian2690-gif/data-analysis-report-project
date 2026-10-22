import { describe, expect, it } from 'vitest';

import {
  CLAVE_DE_UMBRALES,
  guardarUmbrales,
  leerUmbralesDelAlmacen,
} from '../../src/cliente/almacen-de-umbrales';
import { UMBRALES_POR_DEFECTO, type Umbrales } from '../../src/dominio/hallazgos';
import { crearAlmacenFalso, crearAlmacenQueLanza } from './almacen-falso';

const AJUSTADOS: Umbrales = {
  categoriaDominante: 0.5,
  quincena: 2,
  finDeSemana: 1.8,
  diasDeViaje: 6,
  factorDeAtipicos: 4,
};

describe('lectura de los umbrales guardados', () => {
  it('devuelve lo guardado bajo la clave del tablero', () => {
    const almacen = crearAlmacenFalso({ [CLAVE_DE_UMBRALES]: JSON.stringify(AJUSTADOS) });

    expect(leerUmbralesDelAlmacen(almacen)).toEqual(AJUSTADOS);
  });

  it('da los valores por defecto cuando lo guardado no es JSON', () => {
    const almacen = crearAlmacenFalso({ [CLAVE_DE_UMBRALES]: '{no es json' });

    expect(leerUmbralesDelAlmacen(almacen)).toEqual(UMBRALES_POR_DEFECTO);
  });

  it('da los valores por defecto cuando no hay nada guardado', () => {
    expect(leerUmbralesDelAlmacen(crearAlmacenFalso())).toEqual(UMBRALES_POR_DEFECTO);
  });

  it('resuelve campo por campo: fin de semana -1 vuelve a 1.2 y quincena 2 se conserva', () => {
    const almacen = crearAlmacenFalso({
      [CLAVE_DE_UMBRALES]: JSON.stringify({ finDeSemana: -1, quincena: 2 }),
    });

    const umbrales = leerUmbralesDelAlmacen(almacen);

    expect(umbrales.finDeSemana).toBe(1.2);
    expect(umbrales.quincena).toBe(2);
  });

  it('da los valores por defecto cuando el almacén lanza al leer', () => {
    expect(leerUmbralesDelAlmacen(crearAlmacenQueLanza())).toEqual(UMBRALES_POR_DEFECTO);
  });

  it('da los valores por defecto sin almacén', () => {
    expect(leerUmbralesDelAlmacen(undefined)).toEqual(UMBRALES_POR_DEFECTO);
  });
});

describe('escritura de los umbrales', () => {
  it('escribe el JSON de los umbrales bajo la clave del tablero', () => {
    const almacen = crearAlmacenFalso();

    guardarUmbrales(almacen, AJUSTADOS);

    expect(JSON.parse(almacen.contenido.get(CLAVE_DE_UMBRALES) ?? 'null')).toEqual(AJUSTADOS);
  });

  it('escribe bajo la clave tablero-gastos:umbrales', () => {
    const almacen = crearAlmacenFalso();

    guardarUmbrales(almacen, AJUSTADOS);

    expect([...almacen.contenido.keys()]).toEqual(['tablero-gastos:umbrales']);
  });

  it('no rompe cuando el almacén lanza al escribir', () => {
    expect(() => guardarUmbrales(crearAlmacenQueLanza(), AJUSTADOS)).not.toThrow();
  });

  it('no rompe sin almacén', () => {
    expect(() => guardarUmbrales(undefined, AJUSTADOS)).not.toThrow();
  });
});
