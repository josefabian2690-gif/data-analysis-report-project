import type { EChartsOption } from 'echarts';

import type { Comparacion } from '../dominio/comparacion';
import { columnas, serieAgrupada, type ClaseDeColumna } from './columnas';
import { COLOR_BASE, COLOR_DE_ENFASIS, MARCA_DIAGONAL } from './estilo';

/** Nombre visible de cada mes, por su `AAAA-MM`: la capa no tiene textos propios. */
export type RotulosDeMeses = Record<string, string>;

const PRIMER_MES: Omit<ClaseDeColumna, 'nombre'> = { color: COLOR_BASE };
const SEGUNDO_MES: Omit<ClaseDeColumna, 'nombre'> = {
  color: COLOR_DE_ENFASIS,
  marca: MARCA_DIAGONAL,
};

/** R-15: el monto de cada categoría en cada mes, en columnas agrupadas por categoría. */
export function porComparacion(
  { meses, categorias }: Comparacion,
  rotulos: RotulosDeMeses,
): EChartsOption {
  const nombres = meses.map((mes) => rotulos[mes] ?? mes);
  const series = meses.map((_mes, i) =>
    serieAgrupada(
      { nombre: nombres[i], ...(i === 0 ? PRIMER_MES : SEGUNDO_MES) },
      categorias.map((fila) => fila.montos[i] ?? 0),
    ),
  );
  return columnas({
    categorias: categorias.map((fila) => fila.nombre),
    series,
    leyenda: nombres,
  });
}
