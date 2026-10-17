import { init, type EChartsOption } from 'echarts';
import { describe, expect, it } from 'vitest';

import { porDia } from '../../src/graficas/por-dia';
import { porDiaDeLaSemana } from '../../src/graficas/por-dia-de-la-semana';
import { porHora } from '../../src/graficas/por-hora';
import { METRICAS_VACIAS } from './metricas-de-prueba';

const ROTULOS_DE_TIPO = {
  quincena: 'Q',
  'post-quincena': 'P',
  'pre-quincena': 'R',
  normal: 'N',
} as const;

const ROTULOS_DE_SEMANA = {
  dias: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  entreSemana: 'ES',
  finDeSemana: 'FS',
} as unknown as Parameters<typeof porDiaDeLaSemana>[1];

interface PosicionDeLeyenda {
  top: number | string | null | undefined;
  bottom: number | string | null | undefined;
}

/** La posición con la que ECharts coloca la leyenda, ya combinada con sus valores por defecto. */
function posicionDeLeyenda(opcion: EChartsOption): PosicionDeLeyenda {
  const grafica = init(null, null, { renderer: 'svg', ssr: true, width: 800, height: 400 });
  try {
    grafica.setOption({ ...opcion, animation: false });
    const [leyenda] = grafica.getOption().legend as PosicionDeLeyenda[];
    if (leyenda === undefined) throw new Error('la opción no dibuja leyenda');
    return leyenda;
  } finally {
    grafica.dispose();
  }
}

const GRAFICAS_CON_LEYENDA: [string, EChartsOption][] = [
  ['por día', porDia(METRICAS_VACIAS, ROTULOS_DE_TIPO)],
  ['por día de la semana', porDiaDeLaSemana(METRICAS_VACIAS, ROTULOS_DE_SEMANA)],
];

describe('leyenda de las gráficas de columnas', () => {
  it.each(GRAFICAS_CON_LEYENDA)(
    'la leyenda de la gráfica %s queda en la franja superior que reserva la rejilla, no sobre los rótulos del eje',
    (_nombre, opcion) => {
      const { top, bottom } = posicionDeLeyenda(opcion);
      const franja = (opcion.grid as { top: number }).top;

      expect(typeof top).toBe('number');
      expect(top as number).toBeGreaterThanOrEqual(0);
      expect(top as number).toBeLessThan(franja);
      expect(bottom == null).toBe(true);
    },
  );

  it('sin leyenda no la dibuja y la rejilla no reserva la franja de arriba', () => {
    const opcion = porHora(METRICAS_VACIAS);

    expect(opcion.legend).toBeUndefined();
    expect((opcion.grid as { top: number }).top).toBe(16);
  });
});
