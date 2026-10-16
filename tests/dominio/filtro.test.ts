import { describe, expect, it } from 'vitest';

import { filtrar, opcionesDeFiltro, periodoDelFiltro } from '../../src/dominio/filtro';
import { gasto } from './ayudas';

const ids = (tx: { id: string }[]): string[] => tx.map((t) => t.id);

const MES = [
  gasto({
    id: 'TX1',
    monto: 100,
    categoria: 'Comida',
    cuenta: 'Débito ****1',
    zona: 'Roma Norte, CDMX',
  }),
  gasto({
    id: 'TX2',
    monto: 200,
    categoria: 'Transporte',
    cuenta: 'Débito ****1',
    zona: 'Condesa, CDMX',
  }),
  gasto({
    id: 'TX3',
    monto: 300,
    categoria: 'Comida',
    cuenta: 'Crédito ****2',
    zona: 'Roma Norte, CDMX',
  }),
  gasto({
    id: 'TX4',
    monto: 400,
    categoria: 'Compras',
    cuenta: 'Débito ****1',
    zona: 'Roma Norte, CDMX',
  }),
  gasto({
    id: 'TX5',
    monto: 500,
    categoria: 'Transporte',
    cuenta: 'Crédito ****2',
    zona: 'Condesa, CDMX',
  }),
];

describe('R-10 filtros: Y entre dimensiones, O dentro de una', () => {
  it('Comida o Transporte con la cuenta Débito ****1 deja solo lo que cumple ambas dimensiones', () => {
    const resultado = filtrar(MES, {
      categorias: ['Comida', 'Transporte'],
      cuentas: ['Débito ****1'],
    });

    expect(ids(resultado)).toEqual(['TX1', 'TX2']);
  });

  it('una sola categoría con varias cuentas deja las de cualquiera de esas cuentas (O dentro de la dimensión)', () => {
    const resultado = filtrar(MES, {
      categorias: ['Transporte'],
      cuentas: ['Débito ****1', 'Crédito ****2'],
    });

    expect(ids(resultado)).toEqual(['TX2', 'TX5']);
  });

  it('la zona Roma Norte, CDMX deja solo las transacciones de esa zona', () => {
    const resultado = filtrar(MES, { zonas: ['Roma Norte, CDMX'] });

    expect(ids(resultado)).toEqual(['TX1', 'TX3', 'TX4']);
  });

  it('combina las tres listas con el rango de monto (Y entre todas)', () => {
    const resultado = filtrar(MES, {
      categorias: ['Comida', 'Compras'],
      zonas: ['Roma Norte, CDMX'],
      montoMinimo: 300,
    });

    expect(ids(resultado)).toEqual(['TX3', 'TX4']);
  });
});

describe('R-10 una dimensión sin valores elegidos no restringe', () => {
  it('un filtro vacío deja todas las transacciones en el mismo orden', () => {
    expect(ids(filtrar(MES, {}))).toEqual(['TX1', 'TX2', 'TX3', 'TX4', 'TX5']);
  });

  it('las listas vacías de categorías, cuentas y zonas no restringen', () => {
    const resultado = filtrar(MES, { categorias: [], cuentas: [], zonas: [] });

    expect(ids(resultado)).toEqual(['TX1', 'TX2', 'TX3', 'TX4', 'TX5']);
  });

  it('una lista vacía no anula a las otras dimensiones activas', () => {
    const resultado = filtrar(MES, { categorias: [], cuentas: ['Crédito ****2'] });

    expect(ids(resultado)).toEqual(['TX3', 'TX5']);
  });
});

describe('R-10 rangos inclusivos con extremos opcionales', () => {
  const DIAS = [
    gasto({ id: 'D09', monto: 1, dia: '2026-07-09', hora: '23:59:59' }),
    gasto({ id: 'D10', monto: 1, dia: '2026-07-10', hora: '00:00:00' }),
    gasto({ id: 'D11', monto: 1, dia: '2026-07-11', hora: null }),
    gasto({ id: 'D12', monto: 1, dia: '2026-07-12', hora: '23:59:59' }),
    gasto({ id: 'D13', monto: 1, dia: '2026-07-13', hora: '00:00:00' }),
  ];

  it('del 2026-07-10 al 2026-07-12 quedan los días 10, 11 y 12 a cualquier hora, y ninguno del 9 ni del 13', () => {
    const resultado = filtrar(DIAS, { desde: '2026-07-10', hasta: '2026-07-12' });

    expect(ids(resultado)).toEqual(['D10', 'D11', 'D12']);
  });

  it('solo con inicio llega hasta el final del mes y solo con fin parte del principio', () => {
    expect(ids(filtrar(DIAS, { desde: '2026-07-12' }))).toEqual(['D12', 'D13']);
    expect(ids(filtrar(DIAS, { hasta: '2026-07-10' }))).toEqual(['D09', 'D10']);
  });

  it('un rango de un solo día deja ese día', () => {
    expect(ids(filtrar(DIAS, { desde: '2026-07-11', hasta: '2026-07-11' }))).toEqual(['D11']);
  });

  it('monto mínimo 500 deja las de 500 o más, incluida la de exactamente 500', () => {
    const montos = [499.99, 500, 500.01].map((monto, i) => gasto({ id: `M${i}`, monto }));

    expect(ids(filtrar(montos, { montoMinimo: 500 }))).toEqual(['M1', 'M2']);
  });

  it('monto máximo 500 deja las de 500 o menos, incluida la de exactamente 500', () => {
    const montos = [499.99, 500, 500.01].map((monto, i) => gasto({ id: `M${i}`, monto }));

    expect(ids(filtrar(montos, { montoMaximo: 500 }))).toEqual(['M0', 'M1']);
  });

  it('con mínimo y máximo iguales deja las de ese monto exacto', () => {
    const resultado = filtrar(MES, { montoMinimo: 300, montoMaximo: 300 });

    expect(ids(resultado)).toEqual(['TX3']);
  });
});

describe('R-10 un rango imposible deja 0 transacciones sin errores', () => {
  it('monto mínimo 1000 y máximo 10 no deja ninguna', () => {
    expect(filtrar(MES, { montoMinimo: 1000, montoMaximo: 10 })).toEqual([]);
  });

  it('el inicio después del fin no deja ninguna, aunque haya transacciones en ambos días', () => {
    const dias = [
      gasto({ id: 'A', monto: 1, dia: '2026-07-05' }),
      gasto({ id: 'B', monto: 1, dia: '2026-07-20' }),
    ];

    expect(filtrar(dias, { desde: '2026-07-20', hasta: '2026-07-05' })).toEqual([]);
  });
});

describe('R-10 el orden de entrada se conserva', () => {
  it('la salida respeta el orden de entrada aunque no sea por monto ni por día', () => {
    const entrada = [MES[4], MES[0], MES[2], MES[1]].filter((t) => t !== undefined);

    expect(ids(filtrar(entrada, { montoMinimo: 100 }))).toEqual(['TX5', 'TX1', 'TX3', 'TX2']);
  });

  it('no modifica la lista recibida', () => {
    const entrada = [...MES];

    filtrar(entrada, { categorias: ['Comida'] });

    expect(ids(entrada)).toEqual(['TX1', 'TX2', 'TX3', 'TX4', 'TX5']);
  });
});

describe('R-10 opciones del filtro', () => {
  it('categorías, cuentas y zonas salen sin repetidos, ordenadas por nombre en español', () => {
    const tx = [
      gasto({ monto: 1, categoria: 'Salud', cuenta: 'Efectivo', zona: 'Roma Norte, CDMX' }),
      gasto({ monto: 1, categoria: 'Ñoño', cuenta: 'Débito ****1', zona: 'Álvaro Obregón, CDMX' }),
      gasto({ monto: 1, categoria: 'Salud', cuenta: 'Efectivo', zona: 'Roma Norte, CDMX' }),
      gasto({ monto: 1, categoria: 'Comida', cuenta: 'Crédito ****2', zona: 'Zona Z' }),
      gasto({ monto: 1, categoria: 'Ocio', cuenta: 'Efectivo', zona: 'Condesa, CDMX' }),
    ];

    expect(opcionesDeFiltro(tx)).toEqual({
      categorias: ['Comida', 'Ñoño', 'Ocio', 'Salud'],
      cuentas: ['Crédito ****2', 'Débito ****1', 'Efectivo'],
      zonas: ['Álvaro Obregón, CDMX', 'Condesa, CDMX', 'Roma Norte, CDMX', 'Zona Z'],
    });
  });

  it('una lista vacía no tiene opciones', () => {
    expect(opcionesDeFiltro([])).toEqual({ categorias: [], cuentas: [], zonas: [] });
  });
});

describe('R-11 periodo del filtro', () => {
  it('sin fechas es el mes completo', () => {
    expect(periodoDelFiltro('2026-07', {})).toEqual({ desde: '2026-07-01', hasta: '2026-07-31' });
  });

  it('el último día del mes lo marca el calendario: febrero de 2028 llega al 29', () => {
    expect(periodoDelFiltro('2028-02', {})).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' });
  });

  it('solo con inicio va del inicio al último día del mes', () => {
    expect(periodoDelFiltro('2026-07', { desde: '2026-07-20' })).toEqual({
      desde: '2026-07-20',
      hasta: '2026-07-31',
    });
  });

  it('solo con fin va del primer día del mes al fin', () => {
    expect(periodoDelFiltro('2026-07', { hasta: '2026-07-10' })).toEqual({
      desde: '2026-07-01',
      hasta: '2026-07-10',
    });
  });

  it('un rango dentro del mes es ese rango', () => {
    expect(periodoDelFiltro('2026-07', { desde: '2026-07-05', hasta: '2026-07-12' })).toEqual({
      desde: '2026-07-05',
      hasta: '2026-07-12',
    });
  });

  it('un rango que desborda el mes se recorta al mes', () => {
    expect(periodoDelFiltro('2026-07', { desde: '2026-06-20', hasta: '2026-08-10' })).toEqual({
      desde: '2026-07-01',
      hasta: '2026-07-31',
    });
  });

  it('un inicio posterior al mes deja un periodo sin días, sin acotarlo al último día', () => {
    const periodo = periodoDelFiltro('2026-07', { desde: '2026-08-05' });

    expect(periodo.desde > periodo.hasta).toBe(true);
  });

  it('un fin anterior al mes deja un periodo sin días, sin acotarlo al primer día', () => {
    const periodo = periodoDelFiltro('2026-07', { hasta: '2026-06-10' });

    expect(periodo.desde > periodo.hasta).toBe(true);
  });

  it('con el inicio después del fin el periodo queda al revés, que las métricas cuentan como 0 días', () => {
    const periodo = periodoDelFiltro('2026-07', { desde: '2026-07-20', hasta: '2026-07-05' });

    expect(periodo.desde > periodo.hasta).toBe(true);
  });
});
