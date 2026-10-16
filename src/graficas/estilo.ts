import type { BarSeriesOption } from 'echarts';

export const COLOR_DE_ENFASIS = '#1d4ed8';
export const COLOR_BASE = '#64748b';

/** Con una sola entrada filtrada la barra no debe llenar el alto de la gráfica. */
export const GROSOR_MAXIMO_DE_BARRA = 32;

export type Marca = NonNullable<NonNullable<BarSeriesOption['itemStyle']>['decal']>;

const TRAZO_DE_MARCA = 'rgba(255, 255, 255, 0.75)';

/** Rayas diagonales. */
export const MARCA_DIAGONAL: Marca = {
  symbol: 'rect',
  color: TRAZO_DE_MARCA,
  dashArrayX: [1, 0],
  dashArrayY: [2, 4],
  rotation: Math.PI / 4,
};

/** Puntos. */
export const MARCA_DE_PUNTOS: Marca = {
  symbol: 'circle',
  symbolSize: 0.8,
  color: TRAZO_DE_MARCA,
  dashArrayX: [[4, 4], [0]],
  dashArrayY: [3, 3],
};

/** Rayas horizontales. */
export const MARCA_HORIZONTAL: Marca = {
  symbol: 'rect',
  color: TRAZO_DE_MARCA,
  dashArrayX: [1, 0],
  dashArrayY: [2, 4],
  rotation: 0,
};
