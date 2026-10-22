import {
  diaDeLaSemana,
  diasDelPeriodo,
  esDiaDeFinDeSemana,
  esFinDeSemana,
  periodoDelMes,
  recorrerPeriodo,
  tipoDeDia,
  type DiaDeLaSemana,
  type Periodo,
  type TipoDeDia,
} from './calendario';
import type { Transaccion } from './esquema';

export interface GastoDeCategoria {
  categoria: string;
  monto: number;
  transacciones: number;
  /** Del gasto total, de 0 a 1 (R-12). */
  proporcion: number;
}

export interface GastoDeZona {
  zona: string;
  monto: number;
  transacciones: number;
  /** Del gasto total, de 0 a 1 (R-12). */
  proporcion: number;
}

export interface GastoDeCuenta {
  cuenta: string;
  monto: number;
  transacciones: number;
  /** Del gasto total, de 0 a 1 (R-12). */
  proporcion: number;
}

export interface GastoDeDia {
  /** `AAAA-MM-DD`. */
  dia: string;
  monto: number;
  transacciones: number;
  tipo: TipoDeDia;
  finDeSemana: boolean;
}

export interface GastoDeHora {
  /** De 0 a 23. */
  hora: number;
  monto: number;
  transacciones: number;
}

export interface GastoDeDiaDeLaSemana {
  /** Lunes es 0 y domingo es 6. */
  diaDeLaSemana: DiaDeLaSemana;
  monto: number;
  /** Cuántos días de esta clase caen en el periodo, hayan tenido gasto o no. */
  dias: number;
  /** `monto` entre `dias`; 0 si ningún día de esta clase cae en el periodo. */
  promedio: number;
  finDeSemana: boolean;
}

export interface Metricas {
  gastoTotal: number;
  numeroDeTransacciones: number;
  ticketPromedio: number;
  mediana: number;
  /**
   * Gasto total entre los días naturales del periodo, contando los que no tuvieron gasto (R-11).
   * Sin periodo, el del mes de las transacciones, que es el mismo para todas por R-08.
   */
  gastoPromedioPorDia: number;
  /** De mayor a menor monto y, con empate, por nombre, para que la dominante vaya primera. */
  gastoPorCategoria: GastoDeCategoria[];
  /** Mismo orden que `gastoPorCategoria`. */
  gastoPorZona: GastoDeZona[];
  /** Mismo orden que `gastoPorCategoria`. */
  gastoPorCuenta: GastoDeCuenta[];
  /** Un elemento por cada día del periodo, en orden; los días sin gasto valen 0. */
  gastoPorDia: GastoDeDia[];
  /** Las 24 horas, de la 0 a la 23. Las transacciones sin hora no entran en ninguna (R-03). */
  gastoPorHora: GastoDeHora[];
  transaccionesSinHora: number;
  /** Siete elementos, de lunes a domingo. */
  gastoPorDiaDeLaSemana: GastoDeDiaDeLaSemana[];
}

const HORAS_DEL_DIA = 24;
const DIAS_DE_LA_SEMANA: DiaDeLaSemana[] = [0, 1, 2, 3, 4, 5, 6];

function medianaDe(montos: number[]): number {
  if (montos.length === 0) return 0;
  const ordenados = [...montos].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) return ordenados[medio] ?? 0;
  return ((ordenados[medio - 1] ?? 0) + (ordenados[medio] ?? 0)) / 2;
}

function periodoDelMesDe(tx: Transaccion[]): Periodo | undefined {
  const primera = tx[0];
  return primera === undefined ? undefined : periodoDelMes(primera.dia.slice(0, 7));
}

function desglosarPor(
  tx: Transaccion[],
  nombreDe: (t: Transaccion) => string,
  gastoTotal: number,
): { nombre: string; monto: number; transacciones: number; proporcion: number }[] {
  const acumulado = new Map<string, { monto: number; transacciones: number }>();
  for (const t of tx) {
    const nombre = nombreDe(t);
    const previo = acumulado.get(nombre) ?? { monto: 0, transacciones: 0 };
    acumulado.set(nombre, {
      monto: previo.monto + t.monto,
      transacciones: previo.transacciones + 1,
    });
  }
  return [...acumulado]
    .map(([nombre, { monto, transacciones }]) => ({
      nombre,
      monto,
      transacciones,
      proporcion: monto / gastoTotal,
    }))
    .sort((a, b) => b.monto - a.monto || a.nombre.localeCompare(b.nombre, 'es'));
}

function gastoPorDia(tx: Transaccion[], periodo: Periodo | undefined): GastoDeDia[] {
  if (periodo === undefined) return [];
  const porDia = new Map<string, { monto: number; transacciones: number }>();
  for (const { dia, monto } of tx) {
    const previo = porDia.get(dia) ?? { monto: 0, transacciones: 0 };
    porDia.set(dia, { monto: previo.monto + monto, transacciones: previo.transacciones + 1 });
  }
  return recorrerPeriodo(periodo).map((dia) => ({
    dia,
    monto: porDia.get(dia)?.monto ?? 0,
    transacciones: porDia.get(dia)?.transacciones ?? 0,
    tipo: tipoDeDia(dia),
    finDeSemana: esFinDeSemana(dia),
  }));
}

function gastoPorHora(tx: Transaccion[]): { horas: GastoDeHora[]; sinHora: number } {
  const horas = Array.from({ length: HORAS_DEL_DIA }, (_, hora) => ({
    hora,
    monto: 0,
    transacciones: 0,
  }));
  let sinHora = 0;
  for (const { hora, monto } of tx) {
    const entrada = hora === null ? undefined : horas[Number(hora.slice(0, 2))];
    if (entrada === undefined) {
      sinHora += 1;
      continue;
    }
    entrada.monto += monto;
    entrada.transacciones += 1;
  }
  return { horas, sinHora };
}

function gastoPorDiaDeLaSemana(porDia: GastoDeDia[]): GastoDeDiaDeLaSemana[] {
  return DIAS_DE_LA_SEMANA.map((dia) => {
    const delDia = porDia.filter((d) => diaDeLaSemana(d.dia) === dia);
    const monto = delDia.reduce((suma, d) => suma + d.monto, 0);
    return {
      diaDeLaSemana: dia,
      monto,
      dias: delDia.length,
      promedio: delDia.length === 0 ? 0 : monto / delDia.length,
      finDeSemana: esDiaDeFinDeSemana(dia),
    };
  });
}

export function metricas(tx: Transaccion[], periodo?: Periodo): Metricas {
  const montos = tx.map((t) => t.monto);
  const gastoTotal = montos.reduce((suma, monto) => suma + monto, 0);
  const delPeriodo = periodo ?? periodoDelMesDe(tx);
  const dias = delPeriodo === undefined ? 0 : diasDelPeriodo(delPeriodo);
  const porDia = gastoPorDia(tx, delPeriodo);
  const { horas, sinHora } = gastoPorHora(tx);
  return {
    gastoTotal,
    numeroDeTransacciones: tx.length,
    ticketPromedio: tx.length === 0 ? 0 : gastoTotal / tx.length,
    mediana: medianaDe(montos),
    gastoPromedioPorDia: dias === 0 ? 0 : gastoTotal / dias,
    gastoPorCategoria: desglosarPor(tx, (t) => t.categoria, gastoTotal).map(
      ({ nombre, ...resto }) => ({ categoria: nombre, ...resto }),
    ),
    gastoPorZona: desglosarPor(tx, (t) => t.zona, gastoTotal).map(({ nombre, ...resto }) => ({
      zona: nombre,
      ...resto,
    })),
    gastoPorCuenta: desglosarPor(tx, (t) => t.cuenta, gastoTotal).map(({ nombre, ...resto }) => ({
      cuenta: nombre,
      ...resto,
    })),
    gastoPorDia: porDia,
    gastoPorHora: horas,
    transaccionesSinHora: sinHora,
    gastoPorDiaDeLaSemana: gastoPorDiaDeLaSemana(porDia),
  };
}
