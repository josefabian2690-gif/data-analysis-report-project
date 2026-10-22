import type { Transaccion } from './esquema';
import { VALORES_POR_DEFECTO } from './esquema';

/**
 * Texto tras la última coma, sin espacios a los lados; la zona entera si no tiene coma.
 * `Sin zona` (R-02) no pertenece a ninguna ciudad.
 */
export function ciudadDeZona(zona: string): string | null {
  if (zona === VALORES_POR_DEFECTO.zona) return null;
  const ciudad = zona.slice(zona.lastIndexOf(',') + 1).trim();
  return ciudad === '' ? null : ciudad;
}

/** La ciudad con mayor gasto (docs/DOMINIO.md, «Glosario»); con empate, la que va primero por nombre. `undefined` si ninguna zona tiene ciudad. */
export function ciudadPrincipal(tx: Transaccion[]): string | undefined {
  const montos = new Map<string, number>();
  for (const { zona, monto } of tx) {
    const ciudad = ciudadDeZona(zona);
    if (ciudad !== null) montos.set(ciudad, (montos.get(ciudad) ?? 0) + monto);
  }
  const [primera] = [...montos].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  return primera?.[0];
}
