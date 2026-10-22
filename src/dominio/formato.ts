const MONTO = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const PROPORCION = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `12345.67` → `$12,345.67`; redondea a centavos solo aquí (R-17). */
export function formatearMonto(monto: number): string {
  return MONTO.format(monto);
}

/** `2026-09-15` → `15/09/2026`, partiendo la cadena para no depender de la zona horaria (R-17). */
export function formatearFecha(dia: string): string {
  const [anio = '', mes = '', diaDelMes = ''] = dia.split('-');
  return `${diaDelMes}/${mes}/${anio}`;
}

/** `0.4823` → `48.2%`: un decimal y el `%` pegado. */
export function formatearProporcion(proporcion: number): string {
  return PROPORCION.format(proporcion);
}
