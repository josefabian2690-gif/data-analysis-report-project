import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readConfig } from '../../src/servidor/config';
import { StartupFailure } from '../../src/servidor/startup-failure';

const RAIZ = resolve('/proyecto');

describe('configuración del arranque a partir del entorno', () => {
  it('sin variables usa el puerto 4310, abre el navegador y guarda en historial/ de la raíz', () => {
    expect(readConfig({}, RAIZ)).toEqual({
      port: 4310,
      openBrowser: true,
      historyDirectory: join(RAIZ, 'historial'),
    });
  });

  it('TABLERO_PUERTO cambia el puerto', () => {
    expect(readConfig({ TABLERO_PUERTO: '4173' }, RAIZ).port).toBe(4173);
  });

  it('TABLERO_SIN_NAVEGADOR=1 desactiva la apertura del navegador', () => {
    expect(readConfig({ TABLERO_SIN_NAVEGADOR: '1' }, RAIZ).openBrowser).toBe(false);
  });

  it('cualquier otro valor de TABLERO_SIN_NAVEGADOR deja abrir el navegador', () => {
    expect(readConfig({ TABLERO_SIN_NAVEGADOR: '0' }, RAIZ).openBrowser).toBe(true);
  });

  it.each(['abc', '', '-1', '70000', '43.5', '0x10'])(
    'TABLERO_PUERTO=%j no es un puerto: falla nombrando la variable',
    (valor) => {
      expect(() => readConfig({ TABLERO_PUERTO: valor }, RAIZ)).toThrow(StartupFailure);
      expect(() => readConfig({ TABLERO_PUERTO: valor }, RAIZ)).toThrow(/TABLERO_PUERTO/);
    },
  );
});

describe('configuración: carpeta del historial', () => {
  it('TABLERO_HISTORIAL absoluta se usa tal cual, no la de la raíz', () => {
    const carpeta = resolve('/datos/gastos');

    const config = readConfig({ TABLERO_HISTORIAL: carpeta }, RAIZ);

    expect(config.historyDirectory).toBe(carpeta);
  });

  it('TABLERO_HISTORIAL relativa se resuelve a partir de la raíz', () => {
    const config = readConfig({ TABLERO_HISTORIAL: join('mis-datos', 'historial') }, RAIZ);

    expect(config.historyDirectory).toBe(join(RAIZ, 'mis-datos', 'historial'));
  });

  it('TABLERO_HISTORIAL vacía falla nombrando la variable', () => {
    expect(() => readConfig({ TABLERO_HISTORIAL: '' }, RAIZ)).toThrow(StartupFailure);
    expect(() => readConfig({ TABLERO_HISTORIAL: '' }, RAIZ)).toThrow(/TABLERO_HISTORIAL/);
  });
});
