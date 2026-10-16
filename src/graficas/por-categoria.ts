import type { EChartsOption } from 'echarts';

import type { Metricas } from '../dominio/metricas';
import { barrasHorizontales } from './barras-horizontales';

export function porCategoria({ gastoPorCategoria }: Metricas): EChartsOption {
  return barrasHorizontales(
    gastoPorCategoria.map(({ categoria, ...resto }) => ({ nombre: categoria, ...resto })),
  );
}
