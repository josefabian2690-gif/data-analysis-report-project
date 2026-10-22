import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { InsideDataZoomComponentOption, ScatterSeriesOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import { parsearCsv } from '../../src/dominio/carga';
import { metricas, type Metricas } from '../../src/dominio/metricas';
import { ciudadDeZona } from '../../src/dominio/zonas';
import { PALETA_CATEGORICA } from '../../src/graficas/estilo';
import { mapaDeGasto } from '../../src/graficas/mapa';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const SEMILLA_1 = fileURLToPath(
  new URL('../fixtures/generador/2026-07-semilla-1.csv', import.meta.url),
);

const EJES = { longitud: 'eje-x', latitud: 'eje-y' };

function metricasDeLaSemilla(): Metricas {
  return metricas(parsearCsv(readFileSync(SEMILLA_1, 'utf-8')).transacciones);
}

function metricasConZonas(n: number): Metricas {
  const zonas = Array.from({ length: n }, (_, i) => `Zona ${i}, CDMX`);
  return {
    ...METRICAS_VACIAS,
    gastoPorZona: zonas.map((zona) => ({ zona, monto: 1, transacciones: 1, proporcion: 0 })),
    puntosDelMapa: zonas.map((zona, i) => ({
      zona,
      puntos: [{ longitud: -99 - i / 100, latitud: 19 + i / 100, monto: 1 }],
    })),
    ciudadPrincipal: 'CDMX',
  };
}

function series(m: Metricas): ScatterSeriesOption[] {
  return mapaDeGasto(m, EJES).series as ScatterSeriesOption[];
}

function ventanas(m: Metricas) {
  const zooms = mapaDeGasto(m, EJES).dataZoom as InsideDataZoomComponentOption[];
  const ventana = (eje: 'xAxisIndex' | 'yAxisIndex') => {
    const zoom = zooms.find((z) => z[eje] !== undefined);
    return [Number(zoom?.startValue), Number(zoom?.endValue)] as const;
  };
  return { zooms, x: ventana('xAxisIndex'), y: ventana('yAxisIndex') };
}

describe('mapaDeGasto: puntos por zona', () => {
  it('dibuja una serie scatter por zona, con su nombre y [longitud, latitud] por punto', () => {
    const m: Metricas = {
      ...METRICAS_VACIAS,
      puntosDelMapa: [
        {
          zona: 'Roma, CDMX',
          puntos: [
            { longitud: -99.16, latitud: 19.41, monto: 10 },
            { longitud: -99.17, latitud: 19.42, monto: 5 },
          ],
        },
        { zona: 'Centro, N.L.', puntos: [{ longitud: -100.3, latitud: 25.67, monto: 1 }] },
      ],
    };

    const dibujadas = series(m);

    expect(dibujadas.map((s) => [s.type, s.name])).toEqual([
      ['scatter', 'Roma, CDMX'],
      ['scatter', 'Centro, N.L.'],
    ]);
    expect(dibujadas[0]?.data).toEqual([
      [-99.16, 19.41],
      [-99.17, 19.42],
    ]);
    expect(dibujadas[1]?.data).toEqual([[-100.3, 25.67]]);
  });

  it('la semilla 1 dibuja 2 000 puntos en 7 series', () => {
    const dibujadas = series(metricasDeLaSemilla());

    expect(dibujadas).toHaveLength(7);
    expect(dibujadas.reduce((suma, s) => suma + (s.data?.length ?? 0), 0)).toBe(2000);
  });

  it('la leyenda nombra todas las zonas', () => {
    const m = metricasDeLaSemilla();

    const { legend } = mapaDeGasto(m, EJES);

    expect((legend as { data: string[] }).data).toEqual(m.puntosDelMapa.map((g) => g.zona));
  });

  it('los nombres de ejes recibidos llegan al eje x (longitud) y al eje y (latitud)', () => {
    const { xAxis, yAxis } = mapaDeGasto(METRICAS_VACIAS, { longitud: 'Lon', latitud: 'Lat' }) as {
      xAxis: { name: string };
      yAxis: { name: string };
    };

    expect([xAxis.name, yAxis.name]).toEqual(['Lon', 'Lat']);
  });

  it('activa aria para lectores de pantalla', () => {
    expect(mapaDeGasto(metricasDeLaSemilla(), EJES).aria).toMatchObject({ enabled: true });
  });

  it('sin puntos devuelve una gráfica sin series y no falla', () => {
    expect(series(METRICAS_VACIAS)).toEqual([]);
    expect(ventanas(METRICAS_VACIAS).zooms).toHaveLength(2);
  });
});

describe('mapaDeGasto: color y forma por zona', () => {
  function combinaciones(n: number) {
    return series(metricasConZonas(n)).map((s) => {
      const color = (s.itemStyle as { color?: string } | undefined)?.color;
      return `${color}|${s.symbol as string}`;
    });
  }

  it('7 zonas tienen 7 combinaciones distintas de color y de forma', () => {
    const dibujadas = series(metricasConZonas(7));
    const colores = dibujadas.map((s) => (s.itemStyle as { color?: string }).color);
    const formas = dibujadas.map((s) => s.symbol);

    expect(new Set(colores).size).toBe(7);
    expect(new Set(formas).size).toBe(7);
  });

  it('con más zonas que formas, la forma se repite en orden y cada pareja de color y forma sigue siendo única', () => {
    const dibujadas = series(metricasConZonas(20));
    const formas = dibujadas.map((s) => s.symbol);

    expect(formas[7]).toBe(formas[0]);
    expect(formas.every((f) => f !== undefined)).toBe(true);
    expect(new Set(combinaciones(20)).size).toBe(20);
  });
});

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const canal = parseInt(hex.slice(i, i + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro! + 0.05) / (oscuro! + 0.05);
}

describe('mapaDeGasto: legibilidad de los puntos', () => {
  it.each(['#ffffff', '#f1f5f9'])(
    'cada tono de la paleta tiene al menos 3:1 de contraste contra el fondo %s',
    (fondo) => {
      const flojos = PALETA_CATEGORICA.filter((tono) => contraste(tono, fondo) < 3);

      expect(flojos).toEqual([]);
    },
  );
});

describe('mapaDeGasto: encuadre en la ciudad principal', () => {
  const m = metricasDeLaSemilla();
  const { x, y } = ventanas(m);
  const dentro = ([longitud, latitud]: number[]) =>
    longitud! >= x[0] && longitud! <= x[1] && latitud! >= y[0] && latitud! <= y[1];
  const puntosDe = (enCiudad: boolean) =>
    series(m)
      .filter((s) => (ciudadDeZona(s.name as string) === m.ciudadPrincipal) === enCiudad)
      .flatMap((s) => s.data as number[][]);

  it('la ventana inicial contiene todos los puntos de CDMX', () => {
    const cdmx = puntosDe(true);

    expect(cdmx.length).toBeGreaterThan(1000);
    expect(cdmx.filter((p) => !dentro(p))).toEqual([]);
  });

  it('deja un margen: los puntos extremos de CDMX no tocan el borde de la ventana', () => {
    const cdmx = puntosDe(true);
    const longitudes = cdmx.map((p) => p[0]!);
    const latitudes = cdmx.map((p) => p[1]!);

    expect(Math.min(...longitudes)).toBeGreaterThan(x[0]);
    expect(Math.max(...longitudes)).toBeLessThan(x[1]);
    expect(Math.min(...latitudes)).toBeGreaterThan(y[0]);
    expect(Math.max(...latitudes)).toBeLessThan(y[1]);
  });

  it('la ventana inicial no contiene ningún punto de Monterrey', () => {
    const fuera = puntosDe(false);

    expect(fuera.length).toBeGreaterThan(200);
    expect(fuera.filter(dentro)).toEqual([]);
  });

  it('los ejes no fijan mínimo ni máximo: alejarse alcanza a Monterrey', () => {
    const { xAxis, yAxis } = mapaDeGasto(m, EJES) as {
      xAxis: { min?: number; max?: number };
      yAxis: { min?: number; max?: number };
    };

    expect([xAxis.min, xAxis.max, yAxis.min, yAxis.max]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('declara zoom y desplazamiento por separado en el eje x y en el y', () => {
    const { zooms } = ventanas(m);

    expect(zooms.map((z) => z.type)).toEqual(['inside', 'inside']);
    expect(zooms.filter((z) => z.xAxisIndex !== undefined)).toHaveLength(1);
    expect(zooms.filter((z) => z.yAxisIndex !== undefined)).toHaveLength(1);
    expect(zooms.every((z) => z.disabled !== true && z.zoomLock !== true)).toBe(true);
  });

  it('sin ciudad principal no recorta: la ventana abarca todo', () => {
    const sinCiudad: Metricas = { ...m, ciudadPrincipal: undefined };

    const { zooms } = ventanas(sinCiudad);

    expect(zooms.every((z) => z.startValue === undefined && z.endValue === undefined)).toBe(true);
  });

  it('una ciudad con un solo punto abre con una ventana de ancho positivo', () => {
    const una = metricasConZonas(1);

    const { x: ancho, y: alto } = ventanas(una);

    expect(ancho[1]).toBeGreaterThan(ancho[0]);
    expect(alto[1]).toBeGreaterThan(alto[0]);
  });
});
