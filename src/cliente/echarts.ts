import { BarChart, ScatterChart } from 'echarts/charts';
import {
  AriaComponent,
  DataZoomInsideComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components';
import { init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

use([
  BarChart,
  ScatterChart,
  GridComponent,
  AriaComponent,
  LegendComponent,
  DataZoomInsideComponent,
  TooltipComponent,
  SVGRenderer,
]);

// El renderizador canvas falla en jsdom y los tests de componente montan la gráfica real.
export function montarGrafica(contenedor: HTMLElement) {
  return init(contenedor, undefined, { renderer: 'svg' });
}
