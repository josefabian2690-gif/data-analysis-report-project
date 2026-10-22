import type { EChartsOption } from 'echarts';

import type { DiaDeLaSemana } from '../dominio/calendario';
import type { Metricas } from '../dominio/metricas';
import { columnas, serieDeClase } from './columnas';
import { COLOR_BASE, COLOR_DE_ENFASIS, MARCA_DIAGONAL } from './estilo';

/** Nombres visibles de la gráfica: los días de lunes (0) a domingo (6) y las dos clases de día (R-14). */
export interface RotulosDePorDiaDeLaSemana {
  dias: Record<DiaDeLaSemana, string>;
  entreSemana: string;
  finDeSemana: string;
}

export function porDiaDeLaSemana(
  { gastoPorDiaDeLaSemana }: Metricas,
  rotulos: RotulosDePorDiaDeLaSemana,
): EChartsOption {
  const promedioSi = (finDeSemana: boolean) =>
    gastoPorDiaDeLaSemana.map((d) => (d.finDeSemana === finDeSemana ? d.promedio : null));
  return columnas({
    categorias: gastoPorDiaDeLaSemana.map((d) => rotulos.dias[d.diaDeLaSemana]),
    series: [
      serieDeClase({ nombre: rotulos.entreSemana, color: COLOR_BASE }, promedioSi(false)),
      serieDeClase(
        { nombre: rotulos.finDeSemana, color: COLOR_DE_ENFASIS, marca: MARCA_DIAGONAL },
        promedioSi(true),
      ),
    ],
    leyenda: [rotulos.entreSemana, rotulos.finDeSemana],
  });
}
