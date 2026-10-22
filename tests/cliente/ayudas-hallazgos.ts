import { textos } from '../../src/cliente/textos';

export const TIPOS_DE_HALLAZGO = [
  'categoriaDominante',
  'zonaFavorita',
  'quincena',
  'finDeSemana',
  'viaje',
  'atipicos',
] as const;

export type TipoDeHallazgo = (typeof TIPOS_DE_HALLAZGO)[number];

const SENTINELA = '§';

/** El trozo fijo más largo de la frase del catálogo de ese hallazgo: lo que lo distingue de los demás. */
export function marcaDeHallazgo(tipo: TipoDeHallazgo): string {
  const frase = textos.hallazgos[tipo] as (...argumentos: string[]) => string;
  return frase(SENTINELA, SENTINELA, SENTINELA, SENTINELA)
    .split(SENTINELA)
    .reduce((mayor, trozo) => (trozo.length > mayor.length ? trozo : mayor));
}
