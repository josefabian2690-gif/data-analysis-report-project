import type { EChartsOption } from 'echarts';

import type { Metricas } from '../dominio/metricas';
import { columnas, serieDeClase } from './columnas';
import { COLOR_BASE } from './estilo';

export function porHora({ gastoPorHora }: Metricas): EChartsOption {
  return columnas({
    categorias: gastoPorHora.map((h) => String(h.hora).padStart(2, '0')),
    series: [
      serieDeClase(
        { color: COLOR_BASE },
        gastoPorHora.map((h) => h.monto),
      ),
    ],
  });
}
