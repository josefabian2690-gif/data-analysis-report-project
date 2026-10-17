export interface EleccionDeMeses {
  base?: string;
  comparado?: string;
}

export interface ParDeMeses {
  base: string;
  comparado: string;
}

/**
 * El par de meses a comparar. Lo que el analista no ha elegido (o eligió y ya no está guardado)
 * sigue a los dos meses más recientes de `meses`, que llegan en orden cronológico y son al menos
 * dos; un mes por defecto nunca coincide con el elegido del otro selector.
 */
export function parVigente(meses: readonly string[], eleccion: EleccionDeMeses): ParDeMeses {
  const penultimo = meses.at(-2) ?? '';
  const ultimo = meses.at(-1) ?? '';
  const guardado = (mes: string | undefined) =>
    mes !== undefined && meses.includes(mes) ? mes : undefined;
  const base = guardado(eleccion.base);
  const comparado = guardado(eleccion.comparado);
  if (base !== undefined && comparado !== undefined) return { base, comparado };
  if (base !== undefined) return { base, comparado: base === ultimo ? penultimo : ultimo };
  if (comparado !== undefined) {
    return { base: comparado === penultimo ? ultimo : penultimo, comparado };
  }
  return { base: penultimo, comparado: ultimo };
}
