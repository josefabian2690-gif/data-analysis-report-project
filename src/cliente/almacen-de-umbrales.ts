import { leerUmbralesGuardados, UMBRALES_POR_DEFECTO, type Umbrales } from '../dominio/hallazgos';

/** Lo que el tablero usa del almacenamiento del navegador: así un almacén falso lo sustituye. */
export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

export const CLAVE_DE_UMBRALES = 'tablero-gastos:umbrales';

export function leerUmbralesDelAlmacen(almacen: Almacen | undefined): Umbrales {
  try {
    const guardado = almacen?.getItem(CLAVE_DE_UMBRALES);
    if (guardado === null || guardado === undefined) return UMBRALES_POR_DEFECTO;
    return leerUmbralesGuardados(JSON.parse(guardado));
  } catch {
    return UMBRALES_POR_DEFECTO;
  }
}

export function guardarUmbrales(almacen: Almacen | undefined, umbrales: Umbrales): void {
  try {
    almacen?.setItem(CLAVE_DE_UMBRALES, JSON.stringify(umbrales));
  } catch {
    // El almacenamiento puede fallar (modo privado, cuota llena, acceso bloqueado): los umbrales
    // siguen vigentes en memoria durante la sesión y la página no muestra ningún error.
  }
}
