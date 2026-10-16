import type { Metricas } from '../../src/dominio/metricas';

/** Un `Metricas` sin datos: cada prueba sobrescribe solo la serie que le importa. */
export const METRICAS_VACIAS: Metricas = {
  gastoTotal: 0,
  numeroDeTransacciones: 0,
  ticketPromedio: 0,
  mediana: 0,
  gastoPromedioPorDia: 0,
  gastoPorCategoria: [],
  gastoPorZona: [],
  gastoPorCuenta: [],
  gastoPorDia: [],
  gastoPorHora: [],
  transaccionesSinHora: 0,
  gastoPorDiaDeLaSemana: [],
};
