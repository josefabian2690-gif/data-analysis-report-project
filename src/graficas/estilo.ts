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

/** Puntos gruesos escalonados: cada fila queda a media separación de la anterior. */
export const MARCA_DE_PUNTOS: Marca = {
  symbol: 'circle',
  color: TRAZO_DE_MARCA,
  dashArrayX: [
    [4, 4],
    [0, 4, 4, 0],
  ],
  dashArrayY: [4, 2],
};

/** Rayas horizontales. */
export const MARCA_HORIZONTAL: Marca = {
  symbol: 'rect',
  color: TRAZO_DE_MARCA,
  dashArrayX: [1, 0],
  dashArrayY: [2, 4],
  rotation: 0,
};

/** Paleta categórica de ocho tonos, en orden fijo; el de cada zona lo da su posición. */
export const PALETA_CATEGORICA = [
  '#2a78d6',
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#6250d6',
  '#e34948',
];

/** Siete formas de punto de ECharts; con ocho colores, la pareja se repite recién a las 56 zonas. */
export const FORMAS_DE_PUNTO = [
  'circle',
  'rect',
  'triangle',
  'diamond',
  'roundRect',
  'pin',
  'arrow',
] as const;

export function estiloDeZona(posicion: number): {
  color: string;
  forma: (typeof FORMAS_DE_PUNTO)[number];
} {
  return {
    color: PALETA_CATEGORICA[posicion % PALETA_CATEGORICA.length] ?? COLOR_BASE,
    forma: FORMAS_DE_PUNTO[posicion % FORMAS_DE_PUNTO.length] ?? 'circle',
  };
}
