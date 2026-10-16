import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';

const DIRECTORIO = fileURLToPath(new URL('./generador/', import.meta.url));
const FILAS_POR_FIXTURE = 2000;
const UMBRAL_DOMINANTE = 0.35;
const DIAS_MAXIMOS_VIAJE = 4;
const CATEGORIAS_DE_LA_ZONA_FAVORITA = ['Comida', 'Entretenimiento'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

interface Esperado {
  semilla: number;
  mes: string;
  registros: number;
  categoriaDominante: string;
  zonaFavorita: string;
  casa: string;
  trabajo: string;
  viaje: { destino: string; desde: string; hasta: string };
  quincenas: [number, number];
}

interface Fila {
  fecha: string;
  monto: number;
  categoria: string;
  zona: string;
}

const archivos = existsSync(DIRECTORIO) ? readdirSync(DIRECTORIO) : [];
const fixtures = archivos
  .filter((archivo) => archivo.endsWith('.csv'))
  .map((archivo) => archivo.slice(0, -'.csv'.length))
  .sort();

function leerFilas(fixture: string): Fila[] {
  const texto = readFileSync(`${DIRECTORIO}${fixture}.csv`, 'utf-8');
  const { data } = Papa.parse<Record<string, string>>(texto, {
    header: true,
    skipEmptyLines: true,
  });
  return data.map((fila) => ({
    fecha: fila['fecha'] ?? '',
    monto: Number(fila['monto']),
    categoria: fila['categoria'] ?? '',
    zona: fila['zona'] ?? '',
  }));
}

function leerEsperado(fixture: string): Esperado {
  return JSON.parse(readFileSync(`${DIRECTORIO}${fixture}.esperado.json`, 'utf-8')) as Esperado;
}

function mesDe(fila: Fila): string {
  return fila.fecha.slice(0, 7);
}

function diaDe(fila: Fila): string {
  return fila.fecha.slice(0, 10);
}

function gastoPor(filas: Fila[], clave: (fila: Fila) => string): Map<string, number> {
  const gasto = new Map<string, number>();
  for (const fila of filas) {
    gasto.set(clave(fila), (gasto.get(clave(fila)) ?? 0) + fila.monto);
  }
  return gasto;
}

function mayor(gasto: Map<string, number>): [string, number] {
  const ordenado = [...gasto.entries()].sort((a, b) => b[1] - a[1]);
  const primero = ordenado[0];
  if (primero === undefined) throw new Error('no hay gasto que agregar');
  return primero;
}

function ciudadDe(fila: Fila): string {
  return fila.zona.slice(fila.zona.lastIndexOf(',') + 1).trim();
}

function ultimoDiaDelMes(mes: string): number {
  const [anio, numero] = mes.split('-').map(Number);
  return new Date(Date.UTC(anio ?? 0, numero ?? 0, 0)).getUTCDate();
}

function diasEntre(desde: string, hasta: string): number {
  return (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000;
}

describe('fixtures del generador: integridad', () => {
  it('hay exactamente tres CSV, cada uno con su esperado y ninguno huérfano', () => {
    expect(fixtures, 'CSV en tests/fixtures/generador/').toHaveLength(3);
    for (const fixture of fixtures) {
      expect(archivos, `${fixture}: falta su .esperado.json`).toContain(`${fixture}.esperado.json`);
    }
    const esperados = archivos.filter((archivo) => archivo.endsWith('.esperado.json'));
    expect(esperados, '.esperado.json sin su CSV').toHaveLength(fixtures.length);
  });

  it('los tres fixtures son de meses distintos entre sí', () => {
    const meses = fixtures.map((fixture) =>
      mesDe(leerFilas(fixture)[0] ?? ({ fecha: '' } as Fila)),
    );
    expect(new Set(meses).size, `meses de los fixtures: ${meses.join(', ')}`).toBe(3);
  });

  describe.each(fixtures)('%s', (fixture) => {
    it('tiene 2 000 filas de datos de un solo mes y su esperado cuenta lo mismo', () => {
      const filas = leerFilas(fixture);
      const esperado = leerEsperado(fixture);
      expect(filas, `${fixture}: filas de datos`).toHaveLength(FILAS_POR_FIXTURE);
      expect(new Set(filas.map(mesDe)), `${fixture}: meses presentes en las fechas`).toEqual(
        new Set([esperado.mes]),
      );
      expect(esperado.registros, `${fixture}: registros del esperado`).toBe(FILAS_POR_FIXTURE);
    });

    it('su esperado trae la respuesta completa y concuerda con el nombre del archivo', () => {
      const esperado = leerEsperado(fixture);
      expect(esperado).toEqual({
        semilla: expect.any(Number),
        mes: expect.stringMatching(/^\d{4}-\d{2}$/),
        registros: expect.any(Number),
        categoriaDominante: expect.any(String),
        zonaFavorita: expect.any(String),
        casa: expect.any(String),
        trabajo: expect.any(String),
        viaje: {
          destino: expect.any(String),
          desde: expect.stringMatching(FECHA),
          hasta: expect.stringMatching(FECHA),
        },
        quincenas: [15, ultimoDiaDelMes(esperado.mes)],
      });
      expect(fixture, `${fixture}: nombre del archivo`).toBe(
        `${esperado.mes}-semilla-${esperado.semilla}`,
      );
    });

    it('patrón categoría dominante: es la de mayor gasto y concentra al menos el 35 %', () => {
      const filas = leerFilas(fixture);
      const total = filas.reduce((suma, fila) => suma + fila.monto, 0);
      const [categoria, gasto] = mayor(gastoPor(filas, (fila) => fila.categoria));
      expect(categoria, `${fixture}: categoría dominante observada`).toBe(
        leerEsperado(fixture).categoriaDominante,
      );
      expect(
        gasto / total,
        `${fixture}: participación de la categoría dominante`,
      ).toBeGreaterThanOrEqual(UMBRAL_DOMINANTE);
    });

    it('patrón zona favorita: entre las zonas locales, la de mayor gasto en Comida y Entretenimiento', () => {
      const filas = leerFilas(fixture);
      const [ciudadPrincipal] = mayor(gastoPor(filas, ciudadDe));
      const locales = filas.filter((fila) => ciudadDe(fila) === ciudadPrincipal);
      const deDiversion = locales.filter((fila) =>
        CATEGORIAS_DE_LA_ZONA_FAVORITA.includes(fila.categoria),
      );
      const [zona] = mayor(gastoPor(deDiversion, (fila) => fila.zona));
      expect(zona, `${fixture}: zona favorita observada`).toBe(leerEsperado(fixture).zonaFavorita);
    });

    it('patrón viaje: el destino se concentra en 4 días consecutivos o menos, dentro del rango esperado', () => {
      const { viaje } = leerEsperado(fixture);
      const dias = leerFilas(fixture)
        .filter((fila) => fila.zona === viaje.destino)
        .map(diaDe)
        .sort();
      const primero = dias[0];
      const ultimo = dias[dias.length - 1];
      if (primero === undefined || ultimo === undefined) {
        throw new Error(
          `${fixture}: ninguna transacción en el destino del viaje (${viaje.destino})`,
        );
      }
      expect(
        diasEntre(primero, ultimo) + 1,
        `${fixture}: días que abarca el viaje`,
      ).toBeLessThanOrEqual(DIAS_MAXIMOS_VIAJE);
      expect(
        primero >= viaje.desde,
        `${fixture}: el viaje empieza el ${primero}, antes de ${viaje.desde}`,
      ).toBe(true);
      expect(
        ultimo <= viaje.hasta,
        `${fixture}: el viaje termina el ${ultimo}, después de ${viaje.hasta}`,
      ).toBe(true);
    });
  });
});
