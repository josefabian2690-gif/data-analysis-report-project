import { useState } from 'react';

import { UMBRALES_POR_DEFECTO, type Umbrales } from '../dominio/hallazgos';
import { guardarUmbrales, leerUmbralesDelAlmacen, type Almacen } from './almacen-de-umbrales';

export interface AjusteDeUmbrales {
  umbrales: Umbrales;
  cambiar: (clave: keyof Umbrales, valor: number) => void;
  restablecer: () => void;
}

/** Los umbrales vigentes: arrancan de lo guardado y cada cambio válido se escribe en el almacén. */
export function usarUmbrales(almacen: Almacen | undefined): AjusteDeUmbrales {
  const [umbrales, setUmbrales] = useState(() => leerUmbralesDelAlmacen(almacen));

  function aplicar(siguiente: Umbrales) {
    setUmbrales(siguiente);
    guardarUmbrales(almacen, siguiente);
  }

  return {
    umbrales,
    cambiar: (clave, valor) => aplicar({ ...umbrales, [clave]: valor }),
    restablecer: () => aplicar(UMBRALES_POR_DEFECTO),
  };
}
