import type { EChartsOption } from 'echarts';

import type { TipoDeDia } from '../dominio/calendario';
import { formatearFecha } from '../dominio/formato';
import type { Metricas } from '../dominio/metricas';
import { columnas, serieDeClase, type ClaseDeColumna } from './columnas';
import { COLOR_BASE, MARCA_DE_PUNTOS, MARCA_DIAGONAL, MARCA_HORIZONTAL } from './estilo';

/** Nombres visibles de cada tipo de día (R-13). */
export type RotulosDePorDia = Record<TipoDeDia, string>;

const TIPOS_DE_DIA: readonly TipoDeDia[] = ['quincena', 'post-quincena', 'pre-quincena', 'normal'];

const ESTILO_DE_TIPO: Record<TipoDeDia, Omit<ClaseDeColumna, 'nombre'>> = {
  quincena: { color: '#b45309', marca: MARCA_DIAGONAL },
  'post-quincena': { color: '#0f766e', marca: MARCA_DE_PUNTOS },
  'pre-quincena': { color: '#7e22ce', marca: MARCA_HORIZONTAL },
  normal: { color: COLOR_BASE },
};

export function porDia({ gastoPorDia }: Metricas, rotulos: RotulosDePorDia): EChartsOption {
  const series = TIPOS_DE_DIA.map((tipo) =>
    serieDeClase(
      { nombre: rotulos[tipo], ...ESTILO_DE_TIPO[tipo] },
      gastoPorDia.map((d) => (d.tipo === tipo ? d.monto : null)),
    ),
  );
  return columnas({
    categorias: gastoPorDia.map((d) => formatearFecha(d.dia)),
    series,
    rotulosCompletos: true,
    leyenda: TIPOS_DE_DIA.map((tipo) => rotulos[tipo]),
  });
}
