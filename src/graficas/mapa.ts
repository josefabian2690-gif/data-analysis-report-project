import type { EChartsOption, InsideDataZoomComponentOption, ScatterSeriesOption } from 'echarts';

import type { Metricas, PuntosDeZona } from '../dominio/metricas';
import { ciudadDeZona } from '../dominio/zonas';
import { estiloDeZona } from './estilo';

const MARGEN_PROPORCIONAL = 0.1;
const MARGEN_MINIMO_EN_GRADOS = 0.005;
const TAMANO_DE_PUNTO = 8;

function serieDeZona({ zona, puntos }: PuntosDeZona, posicion: number): ScatterSeriesOption {
  const { color, forma } = estiloDeZona(posicion);
  return {
    type: 'scatter',
    name: zona,
    symbol: forma,
    symbolSize: TAMANO_DE_PUNTO,
    itemStyle: { color },
    data: puntos.map(({ longitud, latitud }) => [longitud, latitud]),
  };
}

function rangoConMargen(valores: number[]): { startValue: number; endValue: number } {
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const margen = Math.max((maximo - minimo) * MARGEN_PROPORCIONAL, MARGEN_MINIMO_EN_GRADOS);
  return { startValue: minimo - margen, endValue: maximo + margen };
}

/** Los puntos de la ciudad principal; sin ellos no hay encuadre y el mapa abre con todo. */
function ventanaInicial(
  { puntosDelMapa, ciudadPrincipal }: Metricas,
  coordenada: 'longitud' | 'latitud',
): { startValue?: number; endValue?: number } {
  const valores = puntosDelMapa
    .filter(({ zona }) => ciudadPrincipal !== undefined && ciudadDeZona(zona) === ciudadPrincipal)
    .flatMap(({ puntos }) => puntos.map((p) => p[coordenada]));
  return valores.length === 0 ? {} : rangoConMargen(valores);
}

export interface NombresDeEjes {
  longitud: string;
  latitud: string;
}

export function mapaDeGasto(metricas: Metricas, ejes: NombresDeEjes): EChartsOption {
  const zoom = (eje: 'xAxisIndex' | 'yAxisIndex', coordenada: 'longitud' | 'latitud') =>
    ({
      type: 'inside',
      [eje]: 0,
      filterMode: 'none',
      ...ventanaInicial(metricas, coordenada),
    }) satisfies InsideDataZoomComponentOption;
  return {
    aria: { enabled: true },
    legend: { data: metricas.puntosDelMapa.map(({ zona }) => zona) },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: ejes.longitud, scale: true },
    yAxis: { type: 'value', name: ejes.latitud, scale: true },
    dataZoom: [zoom('xAxisIndex', 'longitud'), zoom('yAxisIndex', 'latitud')],
    series: metricas.puntosDelMapa.map(serieDeZona),
  };
}
