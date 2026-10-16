import type { BarSeriesOption, EChartsOption } from 'echarts';

import { formatearMonto, formatearProporcion } from '../dominio/formato';
import type { GastoDeCategoria, Metricas } from '../dominio/metricas';

const COLOR_DE_ENFASIS = '#1d4ed8';
const COLOR_BASE = '#94a3b8';

function barra({ monto, proporcion }: GastoDeCategoria, esDominante: boolean) {
  return {
    value: monto,
    itemStyle: { color: esDominante ? COLOR_DE_ENFASIS : COLOR_BASE },
    label: {
      show: true,
      formatter: `${formatearMonto(monto)} · ${formatearProporcion(proporcion)}`,
    },
  };
}

export function porCategoria({ gastoPorCategoria }: Metricas): EChartsOption {
  const serie: BarSeriesOption = {
    type: 'bar',
    data: gastoPorCategoria.map((categoria, i) => barra(categoria, i === 0)),
  };
  return {
    aria: { enabled: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', inverse: true, data: gastoPorCategoria.map((c) => c.categoria) },
    series: [serie],
  };
}
