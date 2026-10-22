import { describe, expect, it } from 'vitest';

import type { Transaccion } from '../../src/dominio/esquema';
import { hallazgos, type Hallazgo, type Umbrales } from '../../src/dominio/hallazgos';
import { gasto } from './ayudas';

type Tipo = Hallazgo['tipo'];

function numerar(tx: Transaccion[]): Transaccion[] {
  return tx.map((t, i) => ({ ...t, id: `TX${String(i + 1).padStart(6, '0')}` }));
}

function dia(numero: number): string {
  return `2026-07-${String(numero).padStart(2, '0')}`;
}

function de<T extends Tipo>(
  lista: Hallazgo[],
  tipo: T,
): Extract<Hallazgo, { tipo: T }> | undefined {
  return lista.find((h): h is Extract<Hallazgo, { tipo: T }> => h.tipo === tipo);
}

function todos<T extends Tipo>(lista: Hallazgo[], tipo: T): Extract<Hallazgo, { tipo: T }>[] {
  return lista.filter((h): h is Extract<Hallazgo, { tipo: T }> => h.tipo === tipo);
}

function porCategoria(montos: Record<string, number>): Transaccion[] {
  return numerar(Object.entries(montos).map(([categoria, monto]) => gasto({ monto, categoria })));
}

describe('R-16 categoría dominante', () => {
  it('con exactamente el 35 % del monto es hallazgo, con su categoría, monto y proporción', () => {
    const lista = hallazgos(porCategoria({ Comida: 350, Compras: 330, Salud: 320 }));

    expect(de(lista, 'categoria-dominante')).toEqual({
      tipo: 'categoria-dominante',
      categoria: 'Comida',
      monto: 350,
      proporcion: 0.35,
    });
  });

  it('con 34.9 % no es hallazgo', () => {
    const lista = hallazgos(porCategoria({ Comida: 349, Compras: 348, Salud: 303 }));

    expect(de(lista, 'categoria-dominante')).toBeUndefined();
  });

  it('se mide sobre el monto (R-12), no sobre el número de transacciones', () => {
    const tx = numerar([
      gasto({ monto: 600, categoria: 'Compras' }),
      ...Array.from({ length: 4 }, () => gasto({ monto: 100, categoria: 'Comida' })),
    ]);

    expect(de(hallazgos(tx), 'categoria-dominante')?.categoria).toBe('Compras');
  });
});

describe('R-16 zona favorita', () => {
  const ciudad = gasto({ monto: 20000, categoria: 'Compras', zona: 'Roma, CDMX' });

  it('es la zona local con más Comida y Entretenimiento, sobre ese gasto local', () => {
    const tx = numerar([
      ciudad,
      gasto({ monto: 100, categoria: 'Comida', zona: 'Roma, CDMX' }),
      gasto({ monto: 200, categoria: 'Entretenimiento', zona: 'Condesa, CDMX' }),
      gasto({ monto: 100, categoria: 'Comida', zona: 'Condesa, CDMX' }),
      gasto({ monto: 9000, categoria: 'Comida', zona: 'Monterrey, N.L.' }),
    ]);

    expect(de(hallazgos(tx), 'zona-favorita')).toEqual({
      tipo: 'zona-favorita',
      zona: 'Condesa, CDMX',
      monto: 300,
      proporcion: 0.75,
    });
  });

  it('el destino del viaje no compite aunque gaste más en Comida', () => {
    const tx = numerar([
      ciudad,
      gasto({ monto: 10, categoria: 'Comida', zona: 'Roma, CDMX' }),
      gasto({ monto: 9000, categoria: 'Comida', zona: 'Monterrey, N.L.' }),
    ]);

    expect(de(hallazgos(tx), 'zona-favorita')?.zona).toBe('Roma, CDMX');
  });

  it('sin Comida ni Entretenimiento en zonas locales no hay hallazgo', () => {
    const tx = numerar([
      ciudad,
      gasto({ monto: 500, categoria: 'Comida', zona: 'Monterrey, N.L.' }),
      gasto({ monto: 5, categoria: 'Comida' }),
    ]);

    expect(de(hallazgos(tx), 'zona-favorita')).toBeUndefined();
  });

  it('otras categorías locales no cuentan', () => {
    const tx = numerar([
      ciudad,
      gasto({ monto: 100, categoria: 'Comida', zona: 'Roma, CDMX' }),
      gasto({ monto: 5000, categoria: 'Transporte', zona: 'Condesa, CDMX' }),
    ]);

    expect(de(hallazgos(tx), 'zona-favorita')?.zona).toBe('Roma, CDMX');
  });
});

describe('R-16 quincena (R-13)', () => {
  it('cuenta los días sin gasto: 400 en los 4 días de quincena contra 270 en los otros 27 da 10', () => {
    const tx = numerar([
      gasto({ monto: 200, dia: dia(15) }),
      gasto({ monto: 200, dia: dia(16) }),
      gasto({ monto: 270, dia: dia(10) }),
    ]);

    const h = de(hallazgos(tx), 'quincena');

    expect(h?.promedioQuincena).toBeCloseTo(100, 6);
    expect(h?.promedioResto).toBeCloseTo(10, 6);
    expect(h?.razon).toBeCloseTo(10, 6);
  });

  it('con una razón menor que el umbral no hay hallazgo, y con umbral igual a la razón sí', () => {
    const tx = numerar([gasto({ monto: 400, dia: dia(15) }), gasto({ monto: 5400, dia: dia(10) })]);

    expect(de(hallazgos(tx), 'quincena')).toBeUndefined();
    expect(de(hallazgos(tx, { quincena: 0.5 }), 'quincena')?.razon).toBeCloseTo(0.5, 6);
  });

  it('un periodo sin días de quincena (2 al 10 de julio) no da hallazgo ni división entre cero', () => {
    const tx = numerar([gasto({ monto: 500, dia: dia(5) })]);
    const lista = hallazgos(tx, undefined, { desde: dia(2), hasta: dia(10) });

    expect(de(lista, 'quincena')).toBeUndefined();
    expect(JSON.stringify(lista)).not.toContain('null');
  });

  it('si el resto de los días no tiene gasto, no hay hallazgo', () => {
    const tx = numerar([gasto({ monto: 500, dia: dia(15) })]);

    expect(de(hallazgos(tx), 'quincena')).toBeUndefined();
  });
});

describe('R-16 fin de semana (R-14)', () => {
  it('compara viernes a domingo contra lunes a jueves sobre los días naturales: 260 / 13 días contra 180 / 18 días da 2', () => {
    const tx = numerar([gasto({ monto: 260, dia: dia(4) }), gasto({ monto: 180, dia: dia(6) })]);

    const h = de(hallazgos(tx), 'fin-de-semana');

    expect(h?.promedioFinDeSemana).toBeCloseTo(20, 6);
    expect(h?.promedioResto).toBeCloseTo(10, 6);
    expect(h?.razon).toBeCloseTo(2, 6);
  });

  it('un solo viernes con gasto cuenta como fin de semana (R-14)', () => {
    const tx = numerar([gasto({ monto: 260, dia: dia(3) }), gasto({ monto: 180, dia: dia(1) })]);

    expect(de(hallazgos(tx), 'fin-de-semana')).toBeDefined();
  });

  it('sin gasto de lunes a jueves no hay hallazgo ni división entre cero', () => {
    const tx = numerar([gasto({ monto: 260, dia: dia(4) })]);

    expect(de(hallazgos(tx), 'fin-de-semana')).toBeUndefined();
  });

  it('un periodo de solo fin de semana (4 al 5 de julio) no tiene lunes a jueves: no hay hallazgo', () => {
    const tx = numerar([gasto({ monto: 260, dia: dia(4) })]);
    const lista = hallazgos(tx, undefined, { desde: dia(4), hasta: dia(5) });

    expect(de(lista, 'fin-de-semana')).toBeUndefined();
  });
});

describe('R-16 viaje', () => {
  const casa = gasto({ monto: 100000, zona: 'Roma, CDMX', dia: dia(1) });
  const viajeA = (dias: number[], monto = 100, zona = 'Monterrey, N.L.') =>
    dias.map((d) => gasto({ monto, zona, dia: dia(d) }));

  it('un tramo de 4 días es viaje, con destino, primer y último día y monto', () => {
    const tx = numerar([casa, ...viajeA([10, 13])]);

    expect(todos(hallazgos(tx), 'viaje')).toEqual([
      { tipo: 'viaje', destino: 'Monterrey, N.L.', desde: dia(10), hasta: dia(13), monto: 200 },
    ]);
  });

  it('un tramo de 5 días no es viaje con el umbral por defecto, y sí con umbral 5', () => {
    const tx = numerar([casa, ...viajeA([10, 14])]);

    expect(todos(hallazgos(tx), 'viaje')).toHaveLength(0);
    expect(todos(hallazgos(tx, { diasDeViaje: 5 }), 'viaje')).toHaveLength(1);
  });

  it('mide el tramo del primero al último día con gasto, no cuántos días tuvieron gasto', () => {
    const tx = numerar([casa, ...viajeA([2, 20])]);

    expect(todos(hallazgos(tx), 'viaje')).toHaveLength(0);
  });

  it('dos destinos dan dos viajes, de mayor a menor monto', () => {
    const tx = numerar([
      casa,
      ...viajeA([10, 11], 250, 'Monterrey, N.L.'),
      ...viajeA([20, 21], 450, 'Puerto Vallarta, Jal.'),
    ]);

    expect(todos(hallazgos(tx), 'viaje').map((v) => v.destino)).toEqual([
      'Puerto Vallarta, Jal.',
      'Monterrey, N.L.',
    ]);
  });

  it('solo cuentan los días del periodo: el gasto de fuera no alarga el tramo ni suma al monto', () => {
    const tx = numerar([casa, ...viajeA([10, 11]), ...viajeA([25])]);

    const lista = hallazgos(tx, undefined, { desde: dia(1), hasta: dia(20) });

    expect(todos(lista, 'viaje')).toEqual([
      { tipo: 'viaje', destino: 'Monterrey, N.L.', desde: dia(10), hasta: dia(11), monto: 200 },
    ]);
  });

  it('las zonas de la ciudad principal y «Sin zona» nunca son viaje', () => {
    const tx = numerar([
      casa,
      gasto({ monto: 10, zona: 'Condesa, CDMX', dia: dia(5) }),
      gasto({ monto: 10, dia: dia(5) }),
    ]);

    expect(todos(hallazgos(tx), 'viaje')).toHaveLength(0);
  });
});

describe('R-16 atípicos', () => {
  const categoria = (nombre: string, base: number, extra: number): Transaccion[] => [
    ...Array.from({ length: 99 }, () => gasto({ monto: base, categoria: nombre })),
    gasto({ monto: extra, categoria: nombre }),
  ];

  it('un monto mayor que 3 veces el percentil 99 de su categoría es atípico', () => {
    const lista = hallazgos(numerar(categoria('Comida', 100, 300.01)));

    expect(de(lista, 'atipicos')?.transacciones.map((t) => t.monto)).toEqual([300.01]);
  });

  it('un monto igual al límite no es atípico', () => {
    const lista = hallazgos(numerar(categoria('Comida', 100, 300)));

    expect(de(lista, 'atipicos')).toBeUndefined();
  });

  it('el percentil es de su propia categoría y salen de mayor a menor monto', () => {
    const tx = numerar([...categoria('Comida', 100, 301), ...categoria('Compras', 10, 31)]);

    const atipicos = de(hallazgos(tx), 'atipicos');

    expect(atipicos?.transacciones.map((t) => t.monto)).toEqual([301, 31]);
  });

  it('el factor ajustable cambia el límite', () => {
    const tx = numerar(categoria('Comida', 100, 250));

    expect(de(hallazgos(tx), 'atipicos')).toBeUndefined();
    expect(de(hallazgos(tx, { factorDeAtipicos: 2 }), 'atipicos')).toBeDefined();
  });

  it('con menos de 100 transacciones en la categoría el percentil es el máximo y no hay atípicos', () => {
    const tx = numerar([
      ...Array.from({ length: 9 }, () => gasto({ monto: 10 })),
      gasto({ monto: 100000 }),
    ]);

    expect(de(hallazgos(tx), 'atipicos')).toBeUndefined();
  });
});

describe('R-16 la lista de hallazgos', () => {
  it('una lista vacía no da hallazgos ni error', () => {
    expect(hallazgos([])).toEqual([]);
  });

  it('los umbrales parciales se mezclan con los de por defecto', () => {
    const tx = numerar([
      gasto({ monto: 260, dia: dia(4), categoria: 'A' }),
      gasto({ monto: 180, dia: dia(6), categoria: 'B' }),
    ]);
    const parcial: Partial<Umbrales> = { categoriaDominante: 0.99 };

    const tipos = hallazgos(tx, parcial).map((h) => h.tipo);

    expect(tipos).not.toContain('categoria-dominante');
    expect(tipos).toContain('fin-de-semana');
    expect(hallazgos(tx).map((h) => h.tipo)).toContain('categoria-dominante');
  });
});
