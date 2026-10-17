import type { BarSeriesOption, EChartsOption } from 'echarts';

import { formatearMonto } from '../dominio/formato';
import { GROSOR_MAXIMO_DE_BARRA, type Marca } from './estilo';

export interface ClaseDeColumna {
  /** Texto visible de la leyenda: lo recibe quien llama, la capa no tiene textos propios. */
  nombre?: string;
  color: string;
  /** Patrón que distingue la clase aunque no se perciba el color. */
  marca?: Marca;
}

/** Las columnas de una clase, apiladas con las de las demás: cada categoría tiene solo una con valor. */
export function serieDeClase(
  { nombre, color, marca }: ClaseDeColumna,
  valores: (number | null)[],
): BarSeriesOption {
  return {
    type: 'bar',
    name: nombre,
    stack: 'gasto',
    barMaxWidth: GROSOR_MAXIMO_DE_BARRA,
    itemStyle: marca === undefined ? { color } : { color, decal: marca },
    data: valores,
  };
}

interface Columnas {
  categorias: string[];
  series: BarSeriesOption[];
  /** Si hay, la leyenda muestra solo estos nombres y no se puede apagar una clase. */
  leyenda?: string[];
  /** Muestra todos los rótulos del eje, inclinados, en lugar de ocultar los que se solapan. */
  rotulosCompletos?: boolean;
}

/** Columnas verticales con el eje de montos en MXN (R-17). */
export function columnas({
  categorias,
  series,
  leyenda,
  rotulosCompletos,
}: Columnas): EChartsOption {
  return {
    aria: { enabled: true },
    ...(leyenda === undefined
      ? {}
      : { legend: { show: true, data: leyenda, selectedMode: false } }),
    grid: { top: leyenda === undefined ? 16 : 48, left: 88, right: 16, bottom: 72 },
    xAxis: {
      type: 'category',
      data: categorias,
      axisLabel: rotulosCompletos === true ? { interval: 0, rotate: 45 } : {},
    },
    yAxis: { type: 'value', axisLabel: { formatter: (monto: number) => formatearMonto(monto) } },
    series,
  };
}
