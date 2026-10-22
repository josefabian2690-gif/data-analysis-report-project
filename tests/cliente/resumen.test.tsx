import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import type { MotivoInvalido } from '../../src/dominio/carga';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, csv, elegir, gastosDeJulio, hayTablero, valorDe } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

function filasDeLaTabla(tabla: HTMLElement): string[][] {
  return within(tabla)
    .getAllByRole('row')
    .slice(1)
    .map((fila) =>
      within(fila)
        .getAllByRole('cell')
        .map((celda) => celda.textContent ?? ''),
    );
}

describe('resumen de validación', () => {
  it('con el fixture de semilla 1 dice julio de 2026, 2,000 válidas, 0 inválidas y muestra el tablero', async () => {
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(semilla1));

    await screen.findByRole('group', { name: textos.resumen.mes });
    expect(valorDe(textos.resumen.mes)).toBe('julio de 2026');
    expect(valorDe(textos.resumen.validas)).toBe('2,000');
    expect(valorDe(textos.resumen.invalidas)).toBe('0');
    expect(screen.queryByRole('table', { name: textos.resumen.tablaDeInvalidas })).toBeNull();
    expect(hayTablero()).toBe(true);
  });

  it('lista la fila 4 inválida por monto y la 9 fuera del mes, y solo esas dos', async () => {
    const filas = gastosDeJulio(40);
    filas[2] = '2026-07-01 08:00:00,abc,Gasto 3';
    filas[7] = '2026-08-05 08:00:00,10.00,Gasto 8';
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(csv('fecha,monto,concepto', filas)));

    const tabla = await screen.findByRole('table', { name: textos.resumen.tablaDeInvalidas });
    expect(valorDe(textos.resumen.invalidas)).toBe('2');
    expect(valorDe(textos.resumen.validas)).toBe('38');
    expect(filasDeLaTabla(tabla)).toEqual([
      ['4', textos.motivos.monto],
      ['9', textos.motivos['fuera-del-mes']],
    ]);
  });

  const lineaPorMotivo: Record<MotivoInvalido, string> = {
    'fila-mal-formada': 'T901,2026-07-01 08:00:00,1,234.50,Café',
    fecha: 'T902,2026-02-30,10.00,Café',
    monto: 'T903,2026-07-01 08:00:00,abc,Café',
    'concepto-vacio': 'T904,2026-07-01 08:00:00,10.00,',
    'id-repetido': 'T1,2026-07-01 08:00:00,10.00,Repetido',
    'fuera-del-mes': 'T906,2026-08-01 08:00:00,10.00,Café',
  };

  it('cada uno de los seis motivos de fila inválida se lista con su texto en es-MX', async () => {
    const motivos = Object.keys(lineaPorMotivo) as MotivoInvalido[];
    const filas = Array.from(
      { length: 150 },
      (_, i) => `T${i + 1},2026-07-01 08:00:00,10.00,Gasto ${i + 1}`,
    );
    motivos.forEach((motivo, i) => {
      filas[20 + i] = lineaPorMotivo[motivo];
    });
    render(<App historial={crearHistorialFalso()} />);

    await elegir(archivoCsv(csv('id_transaccion,fecha,monto,concepto', filas)));

    const tabla = await screen.findByRole('table', { name: textos.resumen.tablaDeInvalidas });
    expect(filasDeLaTabla(tabla)).toEqual(
      motivos.map((motivo, i) => [String(22 + i), textos.motivos[motivo]]),
    );
  });

  it('los seis motivos tienen textos distintos entre sí', () => {
    const redactados = Object.values(textos.motivos);

    expect(new Set(redactados).size).toBe(redactados.length);
  });
});
