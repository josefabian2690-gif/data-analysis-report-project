/** Fechas de modificación, en milisegundos, del bundle del navegador y de las fuentes que lo producen. */
export interface BundleTimes {
  /** `undefined` si el bundle no está construido. */
  bundle: number | undefined;
  sources: readonly number[];
}

/**
 * Hay que construir si el bundle falta o está viejo (docs/STACK.md, «Empaquetado y arranque»): una
 * fuente estrictamente más reciente. Con la misma fecha se trata como al día, porque construir de
 * más solo cuesta tiempo.
 */
export function needsBuild({ bundle, sources }: BundleTimes): boolean {
  return bundle === undefined || sources.some((source) => source > bundle);
}
