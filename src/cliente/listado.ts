import { useCallback, useEffect, useRef, useState } from 'react';

import type { Historial, MesListado } from './historial';

export type Listado =
  { tipo: 'cargando' } | { tipo: 'listo'; meses: MesListado[] } | { tipo: 'no-disponible' };

export function useListado(historial: Historial): { listado: Listado; recargar: () => void } {
  const [listado, setListado] = useState<Listado>({ tipo: 'cargando' });
  const ultimaPeticion = useRef(0);

  const recargar = useCallback(() => {
    const peticion = ++ultimaPeticion.current;
    historial
      .listar()
      .then(
        (meses): Listado => ({ tipo: 'listo', meses }),
        (): Listado => ({ tipo: 'no-disponible' }),
      )
      .then((siguiente) => {
        if (peticion === ultimaPeticion.current) setListado(siguiente);
      });
  }, [historial]);

  useEffect(recargar, [recargar]);

  return { listado, recargar };
}
