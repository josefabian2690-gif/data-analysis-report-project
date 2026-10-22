import { periodoDelMes, type Periodo } from './calendario';
import type { Transaccion } from './esquema';

/** Todo opcional: un campo ausente, o una lista vacía, no restringe (R-10). */
export interface Filtro {
  /** Día `AAAA-MM-DD`, incluido. */
  desde?: string;
  /** Día `AAAA-MM-DD`, incluido. */
  hasta?: string;
  categorias?: string[];
  cuentas?: string[];
  zonas?: string[];
  montoMinimo?: number;
  montoMaximo?: number;
}

export interface OpcionesDeFiltro {
  categorias: string[];
  cuentas: string[];
  zonas: string[];
}

function incluye(elegidos: string[] | undefined, valor: string): boolean {
  return elegidos === undefined || elegidos.length === 0 || elegidos.includes(valor);
}

function cumple(t: Transaccion, filtro: Filtro): boolean {
  return (
    (filtro.desde === undefined || t.dia >= filtro.desde) &&
    (filtro.hasta === undefined || t.dia <= filtro.hasta) &&
    (filtro.montoMinimo === undefined || t.monto >= filtro.montoMinimo) &&
    (filtro.montoMaximo === undefined || t.monto <= filtro.montoMaximo) &&
    incluye(filtro.categorias, t.categoria) &&
    incluye(filtro.cuentas, t.cuenta) &&
    incluye(filtro.zonas, t.zona)
  );
}

export function filtrar(tx: Transaccion[], filtro: Filtro): Transaccion[] {
  return tx.filter((t) => cumple(t, filtro));
}

function distintosEnOrden(valores: string[]): string[] {
  return [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'es'));
}

export function opcionesDeFiltro(tx: Transaccion[]): OpcionesDeFiltro {
  return {
    categorias: distintosEnOrden(tx.map((t) => t.categoria)),
    cuentas: distintosEnOrden(tx.map((t) => t.cuenta)),
    zonas: distintosEnOrden(tx.map((t) => t.zona)),
  };
}

/** `mes` en `AAAA-MM`. Con el inicio después del fin, el periodo queda al revés y no tiene días. */
export function periodoDelFiltro(mes: string, filtro: Filtro): Periodo {
  const delMes = periodoDelMes(mes);
  const desde =
    filtro.desde === undefined || filtro.desde < delMes.desde ? delMes.desde : filtro.desde;
  const hasta =
    filtro.hasta === undefined || filtro.hasta > delMes.hasta ? delMes.hasta : filtro.hasta;
  return { desde, hasta };
}
