import { BarChart } from 'echarts/charts';
import { AriaComponent, GridComponent } from 'echarts/components';
import { init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

use([BarChart, GridComponent, AriaComponent, SVGRenderer]);

// El renderizador canvas falla en jsdom y los tests de componente montan la gráfica real.
export function montarGrafica(contenedor: HTMLElement) {
  return init(contenedor, undefined, { renderer: 'svg' });
}
