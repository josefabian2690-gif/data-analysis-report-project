import type { BarSeriesOption, EChartsOption } from 'echarts';

import { formatearMonto, formatearProporcion } from '../dominio/formato';
import { COLOR_BASE, COLOR_DE_ENFASIS, GROSOR_MAXIMO_DE_BARRA } from './estilo';

export interface EntradaDeBarra {
  nombre: string;
  monto: number;
  /** Del gasto total, de 0 a 1 (R-12). */
  proporcion: number;
}

function barra({ monto, proporcion }: EntradaDeBarra, esDominante: boolean) {
  return {
    value: monto,
    itemStyle: { color: esDominante ? COLOR_DE_ENFASIS : COLOR_BASE },
    label: {
      show: true,
      position: 'right' as const,
      formatter: `${formatearMonto(monto)} · ${formatearProporcion(proporcion)}`,
    },
  };
}

/** Barras horizontales, la primera entrada arriba y resaltada, cada una con su monto y proporción (R-17). */
export function barrasHorizontales(entradas: EntradaDeBarra[]): EChartsOption {
  const serie: BarSeriesOption = {
    type: 'bar',
    barMaxWidth: GROSOR_MAXIMO_DE_BARRA,
    data: entradas.map((entrada, i) => barra(entrada, i === 0)),
  };
  return {
    aria: { enabled: true },
    grid: { right: '25%' },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: entradas.map((e) => e.nombre) },
    series: [serie],
  };
}
