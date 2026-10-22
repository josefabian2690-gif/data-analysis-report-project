import { textos } from './textos';

const CONTEO = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

/** R-17 (docs/DOMINIO.md) fija montos y fechas, no conteos: este es el formato del conteo en el cliente. */
export function formatearConteo(conteo: number): string {
  return CONTEO.format(conteo);
}

export function formatearMes(mes: string): string {
  const [anio = '', numero = ''] = mes.split('-');
  return `${textos.meses[Number(numero) - 1] ?? ''} de ${anio}`;
}

const RAZON = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

/** Cuántas veces es un grupo del otro (`1.73` → `1.7`); un decimal, como las proporciones de R-17. */
export function formatearRazon(razon: number): string {
  return RAZON.format(razon);
}
