import { describe, expect, it } from 'vitest';

import { leerArchivo } from '../../src/cliente/cargar';
import { archivoCsv, csv } from './ayudas';

describe('leerArchivo', () => {
  it('lee el archivo con File.text() y lo entrega parseado por el dominio', async () => {
    const archivo = archivoCsv(csv('fecha,monto,concepto', ['2026-07-03 10:00:00,120.50,Café']));

    const estado = await leerArchivo(archivo);

    expect(estado.tipo).toBe('cargado');
    if (estado.tipo !== 'cargado') return;
    expect(estado.resultado.mes).toBe('2026-07');
    expect(estado.resultado.transacciones).toHaveLength(1);
    expect(estado.resultado.transacciones[0]?.monto).toBe(120.5);
  });

  it('devuelve el motivo del dominio cuando el archivo se rechaza', async () => {
    const archivo = archivoCsv(csv('fecha,concepto', ['2026-07-03 10:00:00,Café']));

    const estado = await leerArchivo(archivo);

    expect(estado).toEqual({
      tipo: 'rechazado',
      motivo: { codigo: 'faltan-columnas', columnas: ['monto'] },
    });
  });

  it('no disfraza de rechazo un fallo del parseo que no es de la carga', async () => {
    const archivo = Object.assign(archivoCsv('x'), {
      text: () => Promise.resolve(null as unknown as string),
    });

    await expect(leerArchivo(archivo)).rejects.toBeInstanceOf(TypeError);
  });
});
