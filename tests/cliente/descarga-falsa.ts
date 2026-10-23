import type { Descargar } from '../../src/cliente/descargar';

export interface DescargaFalsa {
  descargar: Descargar;
  /** Cada archivo que se «descargó», en orden. */
  readonly descargas: { nombre: string; html: string }[];
}

/** La frontera de descarga del navegador, sustituida por una que solo anota lo que se exportaría. */
export function crearDescargaFalsa(): DescargaFalsa {
  const descargas: { nombre: string; html: string }[] = [];
  return {
    descargar: (nombre, html) => {
      descargas.push({ nombre, html });
    },
    descargas,
  };
}
