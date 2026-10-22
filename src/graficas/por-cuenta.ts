import type { EChartsOption } from 'echarts';

import type { Metricas } from '../dominio/metricas';
import { barrasHorizontales } from './barras-horizontales';

export function porCuenta({ gastoPorCuenta }: Metricas): EChartsOption {
  return barrasHorizontales(
    gastoPorCuenta.map(({ cuenta, ...resto }) => ({ nombre: cuenta, ...resto })),
  );
}
