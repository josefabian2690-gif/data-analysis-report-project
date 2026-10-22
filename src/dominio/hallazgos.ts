import { diasDelPeriodo, type Periodo } from './calendario';
import type { Transaccion } from './esquema';
import { metricas } from './metricas';
import { ciudadDeZona, ciudadPrincipal } from './zonas';

export interface Umbrales {
  /** Proporción del gasto, de 0 a 1 (R-12). */
  categoriaDominante: number;
  quincena: number;
  finDeSemana: number;
  /** Días máximos del tramo de un viaje. */
  diasDeViaje: number;
  /** Veces el percentil 99 de la categoría. */
  factorDeAtipicos: number;
}

export const UMBRALES_POR_DEFECTO: Umbrales = {
  categoriaDominante: 0.35,
  quincena: 1.5,
  finDeSemana: 1.2,
  diasDeViaje: 4,
  factorDeAtipicos: 3,
};

export type Hallazgo =
  | { tipo: 'categoria-dominante'; categoria: string; monto: number; proporcion: number }
  | { tipo: 'zona-favorita'; zona: string; monto: number; proporcion: number }
  | { tipo: 'quincena'; promedioQuincena: number; promedioResto: number; razon: number }
  | { tipo: 'fin-de-semana'; promedioFinDeSemana: number; promedioResto: number; razon: number }
  | { tipo: 'viaje'; destino: string; desde: string; hasta: string; monto: number }
  | { tipo: 'atipicos'; transacciones: Transaccion[] };

const CATEGORIAS_DE_LA_ZONA_FAVORITA = ['Comida', 'Entretenimiento'];
const PERCENTIL_DE_ATIPICOS = 99;

function sumar(montos: number[]): number {
  return montos.reduce((suma, monto) => suma + monto, 0);
}

function porMontoYNombre(a: [string, number], b: [string, number]): number {
  return b[1] - a[1] || a[0].localeCompare(b[0], 'es');
}

function dominante(tx: Transaccion[], periodo: Periodo | undefined, umbral: number): Hallazgo[] {
  const primera = metricas(tx, periodo).gastoPorCategoria[0];
  if (primera === undefined || primera.proporcion < umbral) return [];
  const { categoria, monto, proporcion } = primera;
  return [{ tipo: 'categoria-dominante', categoria, monto, proporcion }];
}

function zonaFavorita(tx: Transaccion[], ciudad: string | undefined): Hallazgo[] {
  const locales = tx.filter(
    (t) => ciudadDeZona(t.zona) === ciudad && CATEGORIAS_DE_LA_ZONA_FAVORITA.includes(t.categoria),
  );
  const porZona = new Map<string, number>();
  for (const { zona, monto } of locales) porZona.set(zona, (porZona.get(zona) ?? 0) + monto);
  const [mejor] = [...porZona].sort(porMontoYNombre);
  if (mejor === undefined) return [];
  const [zona, monto] = mejor;
  return [
    { tipo: 'zona-favorita', zona, monto, proporcion: monto / sumar(locales.map((t) => t.monto)) },
  ];
}

function promedioDe(dias: { monto: number }[]): number {
  return dias.length === 0 ? 0 : sumar(dias.map((d) => d.monto)) / dias.length;
}

/** Razón entre dos grupos de días; `undefined` si un grupo no tiene días o su promedio es 0. */
function razonEntre(
  grupo: { monto: number }[],
  resto: { monto: number }[],
): { promedioGrupo: number; promedioResto: number; razon: number } | undefined {
  const promedioGrupo = promedioDe(grupo);
  const promedioResto = promedioDe(resto);
  if (promedioGrupo === 0 || promedioResto === 0) return undefined;
  return { promedioGrupo, promedioResto, razon: promedioGrupo / promedioResto };
}

function quincena(tx: Transaccion[], periodo: Periodo | undefined, umbral: number): Hallazgo[] {
  const dias = metricas(tx, periodo).gastoPorDia;
  const esDePago = (d: { tipo: string }) => d.tipo === 'quincena' || d.tipo === 'post-quincena';
  const r = razonEntre(
    dias.filter(esDePago),
    dias.filter((d) => !esDePago(d)),
  );
  if (r === undefined || r.razon < umbral) return [];
  return [
    {
      tipo: 'quincena',
      promedioQuincena: r.promedioGrupo,
      promedioResto: r.promedioResto,
      razon: r.razon,
    },
  ];
}

function finDeSemana(tx: Transaccion[], periodo: Periodo | undefined, umbral: number): Hallazgo[] {
  const dias = metricas(tx, periodo).gastoPorDia;
  const r = razonEntre(
    dias.filter((d) => d.finDeSemana),
    dias.filter((d) => !d.finDeSemana),
  );
  if (r === undefined || r.razon < umbral) return [];
  return [
    {
      tipo: 'fin-de-semana',
      promedioFinDeSemana: r.promedioGrupo,
      promedioResto: r.promedioResto,
      razon: r.razon,
    },
  ];
}

function dentroDe(periodo: Periodo | undefined, dia: string): boolean {
  return periodo === undefined || (dia >= periodo.desde && dia <= periodo.hasta);
}

function viajes(
  tx: Transaccion[],
  periodo: Periodo | undefined,
  ciudad: string | undefined,
  maximoDeDias: number,
): Hallazgo[] {
  const porZona = new Map<string, Transaccion[]>();
  for (const t of tx) {
    const ciudadDeT = ciudadDeZona(t.zona);
    if (ciudadDeT === null || ciudadDeT === ciudad || !dentroDe(periodo, t.dia)) continue;
    porZona.set(t.zona, [...(porZona.get(t.zona) ?? []), t]);
  }
  return [...porZona]
    .map(([destino, delDestino]) => {
      const dias = delDestino.map((t) => t.dia).sort();
      return {
        tipo: 'viaje' as const,
        destino,
        desde: dias[0] ?? '',
        hasta: dias[dias.length - 1] ?? '',
        monto: sumar(delDestino.map((t) => t.monto)),
      };
    })
    .filter((v) => diasDelPeriodo({ desde: v.desde, hasta: v.hasta }) <= maximoDeDias)
    .sort((a, b) => b.monto - a.monto || a.destino.localeCompare(b.destino, 'es'));
}

/** Percentil por rango más cercano: el valor en la posición ⌈p·n/100⌉ de los montos ordenados. */
function percentil99(montos: number[]): number {
  const ordenados = [...montos].sort((a, b) => a - b);
  const posicion = Math.ceil((PERCENTIL_DE_ATIPICOS * ordenados.length) / 100);
  return ordenados[posicion - 1] ?? 0;
}

function atipicos(tx: Transaccion[], factor: number): Hallazgo[] {
  const porCategoria = new Map<string, Transaccion[]>();
  for (const t of tx) porCategoria.set(t.categoria, [...(porCategoria.get(t.categoria) ?? []), t]);
  const fuera = [...porCategoria.values()].flatMap((delGrupo) => {
    const limite = factor * percentil99(delGrupo.map((t) => t.monto));
    return delGrupo.filter((t) => t.monto > limite);
  });
  if (fuera.length === 0) return [];
  fuera.sort((a, b) => b.monto - a.monto || a.id.localeCompare(b.id));
  return [{ tipo: 'atipicos', transacciones: fuera }];
}

function sinIndefinidos(umbrales: Partial<Umbrales>): Partial<Umbrales> {
  return Object.fromEntries(Object.entries(umbrales).filter(([, valor]) => valor !== undefined));
}

/**
 * Los patrones de R-16 que superan su umbral, en el orden de R-16 y, los viajes, de mayor a
 * menor monto. `periodo` es el de las métricas: sin él, el mes de las transacciones.
 */
export function hallazgos(
  tx: Transaccion[],
  umbrales: Partial<Umbrales> = {},
  periodo?: Periodo,
): Hallazgo[] {
  const u = { ...UMBRALES_POR_DEFECTO, ...sinIndefinidos(umbrales) };
  const ciudad = ciudadPrincipal(tx);
  return [
    ...dominante(tx, periodo, u.categoriaDominante),
    ...zonaFavorita(tx, ciudad),
    ...quincena(tx, periodo, u.quincena),
    ...finDeSemana(tx, periodo, u.finDeSemana),
    ...viajes(tx, periodo, ciudad, u.diasDeViaje),
    ...atipicos(tx, u.factorDeAtipicos),
  ];
}

export type ResultadoDeUmbral = { valido: true; valor: number } | { valido: false };

/** Valida lo que el analista escribe; la dominante se escribe en % y se guarda en proporción. */
export function leerUmbral(clave: keyof Umbrales, texto: string): ResultadoDeUmbral {
  const numero = texto.trim() === '' ? NaN : Number(texto);
  if (!Number.isFinite(numero) || numero <= 0) return { valido: false };
  if (clave !== 'categoriaDominante') return { valido: true, valor: numero };
  return numero > 100 ? { valido: false } : { valido: true, valor: numero / 100 };
}

function esUmbralValido(clave: keyof Umbrales, valor: unknown): valor is number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) return false;
  return clave !== 'categoriaDominante' || valor <= 1;
}

/** Resuelve campo por campo un valor guardado ya parseado; lo inválido toma el valor por defecto. */
export function leerUmbralesGuardados(valor: unknown): Umbrales {
  const guardado =
    typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : {};
  const claves = Object.keys(UMBRALES_POR_DEFECTO) as (keyof Umbrales)[];
  const resuelto = { ...UMBRALES_POR_DEFECTO };
  for (const clave of claves) {
    const candidato = guardado[clave];
    if (esUmbralValido(clave, candidato)) resuelto[clave] = candidato;
  }
  return resuelto;
}
