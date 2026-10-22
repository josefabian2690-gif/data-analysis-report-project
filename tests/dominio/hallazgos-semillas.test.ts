import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { hallazgos, type Hallazgo } from '../../src/dominio/hallazgos';

interface Esperado {
  categoriaDominante: string;
  zonaFavorita: string;
  viaje: { destino: string; desde: string; hasta: string };
}

function leer(nombre: string): {
  tx: ReturnType<typeof parsearCsv>['transacciones'];
  esperado: Esperado;
} {
  const base = (extension: string) =>
    fileURLToPath(new URL(`../fixtures/generador/${nombre}${extension}`, import.meta.url));
  return {
    tx: parsearCsv(readFileSync(base('.csv'), 'utf-8')).transacciones,
    esperado: JSON.parse(readFileSync(base('.esperado.json'), 'utf-8')) as Esperado,
  };
}

function de<T extends Hallazgo['tipo']>(
  lista: Hallazgo[],
  tipo: T,
): Extract<Hallazgo, { tipo: T }> {
  const h = lista.find((x): x is Extract<Hallazgo, { tipo: T }> => x.tipo === tipo);
  if (h === undefined) throw new Error(`falta el hallazgo ${tipo}`);
  return h;
}

// Cifras calculadas aparte sobre los CSV del generador; son literales, no se recalculan aquí.
const CIFRAS = [
  {
    fixture: '2026-07-semilla-1',
    dominante: { monto: 814566.3, proporcion: 0.482 },
    zona: { proporcion: 0.728 },
    quincena: 2.83,
    finDeSemana: 1.67,
    viaje: 276744.96,
  },
  {
    fixture: '2026-08-semilla-2',
    dominante: { monto: 847205.02, proporcion: 0.548 },
    zona: { proporcion: 0.455 },
    quincena: 3.27,
    finDeSemana: 2.67,
    viaje: 312186.16,
  },
  {
    fixture: '2026-09-semilla-3',
    dominante: { monto: 693983.87, proporcion: 0.543 },
    zona: { proporcion: 0.531 },
    quincena: 2.4,
    finDeSemana: 1.25,
    viaje: 231365.0,
  },
];

describe.each(CIFRAS)('R-16 test de semillas: $fixture', (cifras) => {
  const { tx, esperado } = leer(cifras.fixture);
  const lista = hallazgos(tx);

  it('encuentra la categoría dominante, la zona favorita y el viaje que inyectó el generador', () => {
    expect(de(lista, 'categoria-dominante').categoria).toBe(esperado.categoriaDominante);
    expect(de(lista, 'zona-favorita').zona).toBe(esperado.zonaFavorita);
    const viaje = de(lista, 'viaje');
    expect({ destino: viaje.destino, desde: viaje.desde, hasta: viaje.hasta }).toEqual(
      esperado.viaje,
    );
  });

  it('sus cifras coinciden con las calculadas aparte', () => {
    const dominante = de(lista, 'categoria-dominante');
    expect(dominante.monto).toBeCloseTo(cifras.dominante.monto, 2);
    expect(dominante.proporcion).toBeCloseTo(cifras.dominante.proporcion, 3);
    expect(de(lista, 'zona-favorita').proporcion).toBeCloseTo(cifras.zona.proporcion, 3);
    expect(de(lista, 'quincena').razon).toBeCloseTo(cifras.quincena, 2);
    expect(de(lista, 'fin-de-semana').razon).toBeCloseTo(cifras.finDeSemana, 2);
    expect(de(lista, 'viaje').monto).toBeCloseTo(cifras.viaje, 2);
  });
});

describe('R-16 semilla 1', () => {
  const { tx } = leer('2026-07-semilla-1');
  const lista = hallazgos(tx);

  it('la zona favorita suma $269,450.15 de $369,882.65 de Comida y Entretenimiento local', () => {
    expect(de(lista, 'zona-favorita').monto).toBeCloseTo(269450.15, 2);
  });

  it('hay 2 atípicos: TX001575 ($10,795.88) y después TX000039 ($5,818.78)', () => {
    const atipicos = de(lista, 'atipicos').transacciones;

    expect(atipicos.map((t) => t.id)).toEqual(['TX001575', 'TX000039']);
    expect(atipicos[0]?.monto).toBeCloseTo(10795.88, 2);
    expect(atipicos[1]?.monto).toBeCloseTo(5818.78, 2);
  });

  it('los seis hallazgos van en el orden de R-16 y las otras semillas no tienen atípicos', () => {
    expect(lista.map((h) => h.tipo)).toEqual([
      'categoria-dominante',
      'zona-favorita',
      'quincena',
      'fin-de-semana',
      'viaje',
      'atipicos',
    ]);
    expect(hallazgos(leer('2026-08-semilla-2').tx).map((h) => h.tipo)).not.toContain('atipicos');
    expect(hallazgos(leer('2026-09-semilla-3').tx).map((h) => h.tipo)).not.toContain('atipicos');
  });

  it('en la semilla 3 el fin de semana de 1.25 desaparece con umbral 1.3', () => {
    const { tx: tx3 } = leer('2026-09-semilla-3');

    expect(hallazgos(tx3, { finDeSemana: 1.3 }).map((h) => h.tipo)).not.toContain('fin-de-semana');
  });
});
