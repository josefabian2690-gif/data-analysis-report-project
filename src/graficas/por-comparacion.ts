import type { EChartsOption } from 'echarts';

import type { Comparacion } from '../dominio/comparacion';
import { columnas, serieAgrupada, type ClaseDeColumna } from './columnas';
import { COLOR_BASE, COLOR_DE_ENFASIS, MARCA_DIAGONAL } from './estilo';

/** Nombre visible de cada mes, por su `AAAA-MM`: la capa no tiene textos propios. */
export type RotulosDeMeses = Record<string, string>;

const ESTILOS_DE_MES: readonly Omit<ClaseDeColumna, 'nombre'>[] = [
  { color: COLOR_BASE },
  { color: COLOR_DE_ENFASIS, marca: MARCA_DIAGONAL },
];

function rotuloDe(mes: string, rotulos: RotulosDeMeses): string {
  const rotulo = rotulos[mes];
  if (rotulo === undefined) throw new Error(`falta el rótulo del mes ${mes}`);
  return rotulo;
}

/** R-15: el monto de cada categoría en cada mes, en columnas agrupadas por categoría. */
export function porComparacion(
  { meses, categorias }: Comparacion,
  rotulos: RotulosDeMeses,
): EChartsOption {
  if (meses.length !== ESTILOS_DE_MES.length) {
    throw new Error(`porComparacion compara dos meses y recibió ${meses.length}`);
  }
  const nombres = meses.map((mes) => rotuloDe(mes, rotulos));
  const series = ESTILOS_DE_MES.map((estilo, i) =>
    serieAgrupada(
      { nombre: nombres[i], ...estilo },
      categorias.map((fila) => fila.montos[i] ?? 0),
    ),
  );
  return columnas({
    categorias: categorias.map((fila) => fila.nombre),
    series,
    leyenda: nombres,
  });
}
