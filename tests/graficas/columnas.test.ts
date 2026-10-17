import { init, type EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import { porComparacion } from '../../src/graficas/por-comparacion';
import { porDia } from '../../src/graficas/por-dia';
import {
  porDiaDeLaSemana,
  type RotulosDePorDiaDeLaSemana,
} from '../../src/graficas/por-dia-de-la-semana';
import { porHora } from '../../src/graficas/por-hora';
import { COMPARACION_DE_PRUEBA, ROTULOS_DE_MESES } from './comparacion-de-prueba';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const ROTULOS_DE_TIPO = {
  quincena: 'Q',
  'post-quincena': 'P',
  'pre-quincena': 'R',
  normal: 'N',
} as const;

const ROTULOS_DE_SEMANA: RotulosDePorDiaDeLaSemana = {
  dias: { 0: 'L', 1: 'M', 2: 'X', 3: 'J', 4: 'V', 5: 'S', 6: 'D' },
  entreSemana: 'ES',
  finDeSemana: 'FS',
};

interface Leyenda {
  top: number | string | null | undefined;
  bottom: number | string | null | undefined;
  itemHeight: number;
  padding: number;
}

/** La leyenda tal como ECharts la resuelve, ya combinada con sus valores por defecto. */
function leyendaResuelta(opcion: EChartsOption): Leyenda {
  const grafica = init(null, null, { renderer: 'svg', ssr: true, width: 800, height: 400 });
  try {
    grafica.setOption({ ...opcion, animation: false });
    const [leyenda] = grafica.getOption().legend as Leyenda[];
    if (leyenda === undefined) throw new Error('la opción no dibuja leyenda');
    return leyenda;
  } finally {
    grafica.dispose();
  }
}

const GRAFICAS_CON_LEYENDA: [string, EChartsOption][] = [
  ['por día', porDia(METRICAS_VACIAS, ROTULOS_DE_TIPO)],
  ['por día de la semana', porDiaDeLaSemana(METRICAS_VACIAS, ROTULOS_DE_SEMANA)],
  ['de la comparación', porComparacion(COMPARACION_DE_PRUEBA, ROTULOS_DE_MESES)],
];

describe('leyenda de las gráficas de columnas', () => {
  it.each(GRAFICAS_CON_LEYENDA)(
    'la leyenda de la gráfica %s cabe entera en la franja superior que reserva la rejilla: no cae abajo sobre los rótulos del eje ni invade el área de las barras',
    (_nombre, opcion) => {
      const { top, bottom, itemHeight, padding } = leyendaResuelta(opcion);
      const franja = (opcion.grid as { top: number }).top;

      expect(typeof top).toBe('number');
      expect(bottom == null).toBe(true);
      expect(top as number).toBeGreaterThanOrEqual(0);
      expect((top as number) + itemHeight + 2 * padding).toBeLessThanOrEqual(franja);
    },
  );

  it('sin leyenda no la dibuja y la rejilla no reserva la franja de arriba', () => {
    const opcion = porHora(METRICAS_VACIAS);

    expect(opcion.legend).toBeUndefined();
    expect((opcion.grid as { top: number }).top).toBe(16);
  });
});
