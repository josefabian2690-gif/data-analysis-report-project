import { BarChart } from 'echarts/charts';
import { AriaComponent, GridComponent } from 'echarts/components';
import { init, registerLocale, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

import localeES from '../../node_modules/echarts/lib/i18n/langES.js';

// ECharts solo trae los idiomas EN y ZH: sin registrar ES, la descripción accesible que activa `aria` saldría en inglés.
registerLocale('ES', localeES);
use([BarChart, GridComponent, AriaComponent, SVGRenderer]);

// El renderizador canvas falla en jsdom y los tests de componente montan la gráfica real.
export function montarGrafica(contenedor: HTMLElement) {
  return init(contenedor, undefined, { renderer: 'svg', locale: 'ES' });
}
