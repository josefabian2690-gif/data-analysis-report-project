import type { EChartsOption } from 'echarts';

import { formatearFecha, formatearMonto, formatearProporcion } from '../dominio/formato';
import type { Metricas } from '../dominio/metricas';
import { porCuenta } from '../graficas/por-cuenta';
import { porDia } from '../graficas/por-dia';
import { porDiaDeLaSemana } from '../graficas/por-dia-de-la-semana';
import { porHora } from '../graficas/por-hora';
import { porZona } from '../graficas/por-zona';
import { textos } from './textos';

const { graficas } = textos;

function conDescripcion(opcion: EChartsOption, nombre: string, entradas: string[]): EChartsOption {
  const descripcion = graficas.descripcion(nombre, entradas.join('; '));
  return { ...opcion, aria: { ...opcion.aria, label: { description: descripcion } } };
}

export function opcionPorDia(metricas: Metricas): EChartsOption {
  const entradas = metricas.gastoPorDia.map(({ dia, tipo, monto }) =>
    graficas.porDia.detalle(formatearFecha(dia), graficas.tiposDeDia[tipo], formatearMonto(monto)),
  );
  return conDescripcion(porDia(metricas, graficas.tiposDeDia), graficas.porDia.nombre, entradas);
}

export function opcionPorDiaDeLaSemana(metricas: Metricas): EChartsOption {
  const { dias, entreSemana, finDeSemana, detalle, nombre } = graficas.porDiaDeLaSemana;
  const entradas = metricas.gastoPorDiaDeLaSemana.map((d) =>
    detalle(
      dias[d.diaDeLaSemana],
      formatearMonto(d.promedio),
      d.finDeSemana ? finDeSemana : entreSemana,
    ),
  );
  return conDescripcion(
    porDiaDeLaSemana(metricas, { dias, entreSemana, finDeSemana }),
    nombre,
    entradas,
  );
}

export function opcionPorHora(metricas: Metricas): EChartsOption {
  const entradas = metricas.gastoPorHora.map(({ hora, monto }) =>
    graficas.porHora.detalle(String(hora).padStart(2, '0'), formatearMonto(monto)),
  );
  return conDescripcion(porHora(metricas), graficas.porHora.nombre, entradas);
}

export function opcionPorZona(metricas: Metricas): EChartsOption {
  const entradas = metricas.gastoPorZona.map(({ zona, monto, proporcion }) =>
    graficas.porZona.detalle(zona, formatearMonto(monto), formatearProporcion(proporcion)),
  );
  return conDescripcion(porZona(metricas), graficas.porZona.nombre, entradas);
}

export function opcionPorCuenta(metricas: Metricas): EChartsOption {
  const entradas = metricas.gastoPorCuenta.map(({ cuenta, monto, proporcion }) =>
    graficas.porCuenta.detalle(cuenta, formatearMonto(monto), formatearProporcion(proporcion)),
  );
  return conDescripcion(porCuenta(metricas), graficas.porCuenta.nombre, entradas);
}
