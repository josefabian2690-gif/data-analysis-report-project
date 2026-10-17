import type { Transaccion } from './esquema';

export interface Diferencia {
  absoluta: number;
  /** Fracción del monto anterior (−0.0857, no −8.57); `null` cuando ese monto es 0. */
  proporcion: number | null;
}

export interface FilaDeComparacion {
  nombre: string;
  /** Un monto por mes de `Comparacion.meses`, en el mismo orden. */
  montos: number[];
  /** Una por cada mes a partir del segundo, contra el mes anterior. */
  diferencias: Diferencia[];
}

export interface Comparacion {
  /** `AAAA-MM` en orden cronológico, sin importar el orden de las claves de entrada. */
  meses: string[];
  /** De mayor a menor monto del último mes y, con empate, por nombre. */
  categorias: FilaDeComparacion[];
  total: FilaDeComparacion;
}

const NOMBRE_DEL_TOTAL = 'Total';

function diferenciaEntre(anterior: number, actual: number): Diferencia {
  const absoluta = actual - anterior;
  return { absoluta, proporcion: anterior === 0 ? null : absoluta / anterior };
}

function diferenciasDe(montos: number[]): Diferencia[] {
  return montos.slice(1).map((monto, i) => diferenciaEntre(montos[i] ?? 0, monto));
}

function filaDe(nombre: string, montos: number[]): FilaDeComparacion {
  return { nombre, montos, diferencias: diferenciasDe(montos) };
}

function gastoPorCategoria(tx: Transaccion[]): Map<string, number> {
  const porCategoria = new Map<string, number>();
  for (const t of tx) porCategoria.set(t.categoria, (porCategoria.get(t.categoria) ?? 0) + t.monto);
  return porCategoria;
}

function sumar(montos: Iterable<number>): number {
  let suma = 0;
  for (const monto of montos) suma += monto;
  return suma;
}

/**
 * R-15: diferencia absoluta y proporcional por categoría y en el total; una categoría que no
 * aparece en un mes cuenta como 0. Con tres o más meses cada diferencia es contra el mes anterior,
 * lectura de mes a mes que elige este módulo. Los montos no se redondean (docs/DOMINIO.md,
 * «Casos borde»).
 */
export function comparar(meses: { [mes: string]: Transaccion[] }): Comparacion {
  const cronologicos = Object.keys(meses).sort();
  const porMes = cronologicos.map((mes) => gastoPorCategoria(meses[mes] ?? []));
  const nombres = new Set(porMes.flatMap((gasto) => [...gasto.keys()]));
  const categorias = [...nombres].map((nombre) =>
    filaDe(
      nombre,
      porMes.map((gasto) => gasto.get(nombre) ?? 0),
    ),
  );
  const ultimo = (fila: FilaDeComparacion): number => fila.montos.at(-1) ?? 0;
  categorias.sort((a, b) => ultimo(b) - ultimo(a) || a.nombre.localeCompare(b.nombre, 'es'));
  return {
    meses: cronologicos,
    categorias,
    total: filaDe(
      NOMBRE_DEL_TOTAL,
      porMes.map((gasto) => sumar(gasto.values())),
    ),
  };
}
