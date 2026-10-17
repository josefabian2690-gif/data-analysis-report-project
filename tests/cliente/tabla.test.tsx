import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import { elegir } from './ayudas';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';
import {
  celdasDe,
  conceptosDe,
  csvDeGastos,
  filasDeDatos,
  ordenAnunciado,
  ordenarPor,
  tablaDeTransacciones,
} from './ayudas-tabla';

const { columnas } = textos.tabla;

/** Una transacción sin hora entre otras del mismo día; el orden del archivo no es el cronológico. */
function gastosConUnoSinHora() {
  return csvDeGastos([
    '2026-07-10 08:00:00,500,Almuerzo,Comida,Débito,Centro',
    '2026-07-10,200,Sin hora,Comida,Débito,Centro',
    '2026-07-09 23:00:00,900,Cena,Comida,Débito,Centro',
    '2026-07-10 00:00:01,100,Madrugada,Comida,Débito,Centro',
  ]);
}

async function conElArchivoCargado(archivo: File) {
  render(<App />);
  const usuario = await elegir(archivo);
  const tabla = await tablaDeTransacciones();
  return { usuario, tabla };
}

describe('tabla de transacciones', () => {
  it('lista una fila por transacción con su fecha en dd/mm/aaaa y su monto en MXN', async () => {
    const { tabla } = await conElArchivoCargado(
      csvDeGastos([
        '2026-07-03 09:05:00,100,Café,Comida,Débito,Centro',
        '2026-07-10 18:30:00,1234.56,Cine,Ocio,Crédito,Roma',
        '2026-07-17 10:30:15,300.5,Súper,Comida,Crédito,Centro',
      ]),
    );

    expect(filasDeDatos(tabla).map(celdasDe)).toEqual([
      ['03/07/2026 09:05:00', 'Café', 'Comida', 'Débito', 'Centro', '$100.00'],
      ['10/07/2026 18:30:00', 'Cine', 'Ocio', 'Crédito', 'Roma', '$1,234.56'],
      ['17/07/2026 10:30:15', 'Súper', 'Comida', 'Crédito', 'Centro', '$300.50'],
    ]);
  });

  it('muestra las columnas Fecha, Concepto, Categoría, Cuenta, Zona y Monto en ese orden', async () => {
    const { tabla } = await conElArchivoCargado(gastosDeJulioConDimensiones());

    const encabezados = within(tabla)
      .getAllByRole('columnheader')
      .map((encabezado) => (encabezado.textContent ?? '').replace(/[▲▼]/g, ''));

    expect(encabezados).toEqual([
      columnas.fecha,
      columnas.concepto,
      columnas.categoria,
      columnas.cuenta,
      columnas.zona,
      columnas.monto,
    ]);
  });

  it('una transacción sin hora muestra solo su fecha, sin inventar una hora', async () => {
    const { tabla } = await conElArchivoCargado(
      csvDeGastos(['2026-07-10,200,Sin hora,Comida,Débito,Centro']),
    );

    const [fecha] = celdasDe(filasDeDatos(tabla)[0]!);

    expect(fecha).toBe('10/07/2026');
  });

  it('sin orden elegido lista de la fecha y hora más antigua a la más reciente aunque el archivo venga desordenado', async () => {
    const { tabla } = await conElArchivoCargado(
      csvDeGastos([
        '2026-07-17 10:00:00,300,Súper,Comida,Crédito,Centro',
        '2026-07-03 10:00:00,100,Café,Comida,Débito,Centro',
        '2026-07-03 09:00:00,200,Desayuno,Comida,Débito,Centro',
      ]),
    );

    expect(conceptosDe(tabla)).toEqual(['Desayuno', 'Café', 'Súper']);
    expect(ordenAnunciado(tabla, columnas.fecha)).toBe('ascending');
  });

  it('una transacción sin hora va al inicio de su día en el orden inicial', async () => {
    const { tabla } = await conElArchivoCargado(gastosConUnoSinHora());

    expect(conceptosDe(tabla)).toEqual(['Cena', 'Sin hora', 'Madrugada', 'Almuerzo']);
  });

  it('sigue al filtro: solo lista las transacciones de la categoría marcada y vuelve a todas al desmarcarla', async () => {
    const { usuario, tabla } = await conElArchivoCargado(gastosDeJulioConDimensiones());
    expect(conceptosDe(tabla)).toEqual(['Café', 'Cine', 'Súper', 'Renta']);

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    expect(conceptosDe(tabla)).toEqual(['Café', 'Súper']);

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    expect(conceptosDe(tabla)).toEqual(['Café', 'Cine', 'Súper', 'Renta']);
  });

  it('con un filtro que deja 0 filas no hay tabla y vuelve al quitar los filtros', async () => {
    const { usuario } = await conElArchivoCargado(gastosDeJulioConDimensiones());

    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }), '500');
    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo }), '400');
    expect(screen.queryByRole('table', { name: textos.tabla.nombre })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: textos.filtros.quitar }));
    expect(await tablaDeTransacciones()).toBeInTheDocument();
  });
});

describe('orden por columna', () => {
  it('al cargar, Fecha anuncia el orden ascendente y las demás columnas, ninguno', async () => {
    const { tabla } = await conElArchivoCargado(gastosDeJulioConDimensiones());

    expect(ordenAnunciado(tabla, columnas.fecha)).toBe('ascending');
    for (const columna of [
      columnas.concepto,
      columnas.categoria,
      columnas.cuenta,
      columnas.zona,
      columnas.monto,
    ]) {
      expect(ordenAnunciado(tabla, columna)).toBe('none');
    }
  });

  it('ordenar por monto de mayor a menor pone primero el mayor y el encabezado lo anuncia', async () => {
    const { usuario, tabla } = await conElArchivoCargado(gastosDeJulioConDimensiones());

    await ordenarPor(usuario, tabla, columnas.monto);

    expect(conceptosDe(tabla)).toEqual(['Renta', 'Súper', 'Cine', 'Café']);
    expect(ordenAnunciado(tabla, columnas.monto)).toBe('descending');
    expect(ordenAnunciado(tabla, columnas.fecha)).toBe('none');
  });

  it('un segundo clic en monto lo ordena de menor a mayor y lo anuncia', async () => {
    const { usuario, tabla } = await conElArchivoCargado(gastosDeJulioConDimensiones());

    await ordenarPor(usuario, tabla, columnas.monto);
    await ordenarPor(usuario, tabla, columnas.monto);

    expect(conceptosDe(tabla)).toEqual(['Café', 'Cine', 'Súper', 'Renta']);
    expect(ordenAnunciado(tabla, columnas.monto)).toBe('ascending');
  });

  it('nunca se llega a un estado sin orden: el tercer clic vuelve a descendente y el anuncio coincide con las filas', async () => {
    const { usuario, tabla } = await conElArchivoCargado(
      csvDeGastos([
        '2026-07-03 10:00:00,200,Cine,Ocio,Crédito,Roma',
        '2026-07-10 10:00:00,100,Café,Comida,Débito,Centro',
        '2026-07-17 10:00:00,300,Súper,Comida,Crédito,Centro',
      ]),
    );

    await ordenarPor(usuario, tabla, columnas.monto);
    await ordenarPor(usuario, tabla, columnas.monto);
    await ordenarPor(usuario, tabla, columnas.monto);

    expect(ordenAnunciado(tabla, columnas.monto)).toBe('descending');
    expect(conceptosDe(tabla)).toEqual(['Súper', 'Cine', 'Café']);
  });

  it('Fecha, que ya viene ascendente, pasa a descendente con un clic', async () => {
    const { usuario, tabla } = await conElArchivoCargado(gastosConUnoSinHora());

    await ordenarPor(usuario, tabla, columnas.fecha);

    expect(ordenAnunciado(tabla, columnas.fecha)).toBe('descending');
    expect(conceptosDe(tabla)).toEqual(['Almuerzo', 'Madrugada', 'Sin hora', 'Cena']);
  });

  it('ordenar por fecha ascendente pone la transacción sin hora antes que las de su mismo día', async () => {
    const { usuario, tabla } = await conElArchivoCargado(gastosConUnoSinHora());
    await ordenarPor(usuario, tabla, columnas.monto);
    expect(conceptosDe(tabla)).toEqual(['Cena', 'Almuerzo', 'Sin hora', 'Madrugada']);

    await ordenarPor(usuario, tabla, columnas.fecha);

    expect(ordenAnunciado(tabla, columnas.fecha)).toBe('ascending');
    expect(conceptosDe(tabla)).toEqual(['Cena', 'Sin hora', 'Madrugada', 'Almuerzo']);
  });

  it('una columna de texto se ordena según el español: Álamo va antes que Banco', async () => {
    const { usuario, tabla } = await conElArchivoCargado(
      csvDeGastos([
        '2026-07-03 10:00:00,100,Zapatos,Ropa,Débito,Centro',
        '2026-07-04 10:00:00,200,Banco,Ropa,Débito,Centro',
        '2026-07-05 10:00:00,300,Álamo,Ropa,Débito,Centro',
      ]),
    );

    await ordenarPor(usuario, tabla, columnas.concepto);

    expect(ordenAnunciado(tabla, columnas.concepto)).toBe('ascending');
    expect(conceptosDe(tabla)).toEqual(['Álamo', 'Banco', 'Zapatos']);
  });

  it('el orden elegido se conserva al cambiar el filtro', async () => {
    const { usuario, tabla } = await conElArchivoCargado(gastosDeJulioConDimensiones());
    await ordenarPor(usuario, tabla, columnas.monto);

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    expect(conceptosDe(tabla)).toEqual(['Súper', 'Café']);
    expect(ordenAnunciado(tabla, columnas.monto)).toBe('descending');
  });
});
