import type { Transaccion } from './esquema';
import { diasDelMes } from './fecha';

export interface GastoDeCategoria {
  categoria: string;
  monto: number;
  transacciones: number;
  /** Del gasto total del mes, de 0 a 1 (R-12). */
  proporcion: number;
}

export interface Metricas {
  gastoTotal: number;
  numeroDeTransacciones: number;
  ticketPromedio: number;
  mediana: number;
  /**
   * Gasto total entre los días naturales del mes de las transacciones. R-11 pide el periodo
   * filtrado; mientras no haya filtros, el periodo es ese mes, que es el mismo para todas por R-08.
   */
  gastoPromedioPorDia: number;
  /** De mayor a menor monto y, con empate, por nombre, para que la dominante vaya primera. */
  gastoPorCategoria: GastoDeCategoria[];
}

function medianaDe(montos: number[]): number {
  const ordenados = [...montos].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) return ordenados[medio] ?? 0;
  return ((ordenados[medio - 1] ?? 0) + (ordenados[medio] ?? 0)) / 2;
}

function diasNaturalesDelMes(dia: string): number {
  const [anio = '', mes = ''] = dia.split('-');
  return diasDelMes(Number(anio), Number(mes));
}

function gastoPorCategoria(tx: Transaccion[], gastoTotal: number): GastoDeCategoria[] {
  const acumulado = new Map<string, { monto: number; transacciones: number }>();
  for (const { categoria, monto } of tx) {
    const previo = acumulado.get(categoria) ?? { monto: 0, transacciones: 0 };
    acumulado.set(categoria, {
      monto: previo.monto + monto,
      transacciones: previo.transacciones + 1,
    });
  }
  return [...acumulado]
    .map(([categoria, { monto, transacciones }]) => ({
      categoria,
      monto,
      transacciones,
      proporcion: monto / gastoTotal,
    }))
    .sort((a, b) => b.monto - a.monto || a.categoria.localeCompare(b.categoria, 'es'));
}

export function metricas(tx: Transaccion[]): Metricas {
  const primera = tx[0];
  if (primera === undefined) {
    return {
      gastoTotal: 0,
      numeroDeTransacciones: 0,
      ticketPromedio: 0,
      mediana: 0,
      gastoPromedioPorDia: 0,
      gastoPorCategoria: [],
    };
  }
  const montos = tx.map((t) => t.monto);
  const gastoTotal = montos.reduce((suma, monto) => suma + monto, 0);
  return {
    gastoTotal,
    numeroDeTransacciones: tx.length,
    ticketPromedio: gastoTotal / tx.length,
    mediana: medianaDe(montos),
    gastoPromedioPorDia: gastoTotal / diasNaturalesDelMes(primera.dia),
    gastoPorCategoria: gastoPorCategoria(tx, gastoTotal),
  };
}
