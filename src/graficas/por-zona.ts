import type { EChartsOption } from 'echarts';

import type { Metricas } from '../dominio/metricas';
import { barrasHorizontales } from './barras-horizontales';

export function porZona({ gastoPorZona }: Metricas): EChartsOption {
  return barrasHorizontales(gastoPorZona.map(({ zona, ...resto }) => ({ nombre: zona, ...resto })));
}
