import { describe, expect, it } from 'vitest';
import { readConfig } from '../../src/servidor/config';
import { StartupFailure } from '../../src/servidor/startup-failure';

describe('configuración del arranque a partir del entorno', () => {
  it('sin variables usa el puerto 4310 y abre el navegador', () => {
    expect(readConfig({})).toEqual({ port: 4310, openBrowser: true });
  });

  it('TABLERO_PUERTO cambia el puerto', () => {
    expect(readConfig({ TABLERO_PUERTO: '4173' }).port).toBe(4173);
  });

  it('TABLERO_SIN_NAVEGADOR=1 desactiva la apertura del navegador', () => {
    expect(readConfig({ TABLERO_SIN_NAVEGADOR: '1' }).openBrowser).toBe(false);
  });

  it('cualquier otro valor de TABLERO_SIN_NAVEGADOR deja abrir el navegador', () => {
    expect(readConfig({ TABLERO_SIN_NAVEGADOR: '0' }).openBrowser).toBe(true);
  });

  it.each(['abc', '', '-1', '70000', '43.5', '0x10'])(
    'TABLERO_PUERTO=%j no es un puerto: falla nombrando la variable',
    (valor) => {
      expect(() => readConfig({ TABLERO_PUERTO: valor })).toThrow(StartupFailure);
      expect(() => readConfig({ TABLERO_PUERTO: valor })).toThrow(/TABLERO_PUERTO/);
    },
  );
});
