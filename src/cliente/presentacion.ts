import { textos } from './textos';

const CONTEO = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

/** R-17 (docs/DOMINIO.md) fija montos, fechas y porcentajes, no conteos: este es el del cliente. */
export function formatearConteo(conteo: number): string {
  return CONTEO.format(conteo);
}

export function formatearMes(mes: string): string {
  const [anio = '', numero = ''] = mes.split('-');
  return `${textos.meses[Number(numero) - 1] ?? ''} de ${anio}`;
}
