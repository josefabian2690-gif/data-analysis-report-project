import { useId, useMemo } from 'react';

import type { Periodo } from '../dominio/calendario';
import type { Transaccion } from '../dominio/esquema';
import {
  hallazgos as calcularHallazgos,
  UMBRALES_POR_DEFECTO,
  type Umbrales,
} from '../dominio/hallazgos';
import { ControlesDeUmbrales } from './ControlesDeUmbrales';
import { describirHallazgo } from './descripcion-de-hallazgos';
import { textos } from './textos';
import type { AjusteDeUmbrales } from './usar-umbrales';

interface Props {
  transacciones: Transaccion[];
  periodo: Periodo;
  umbrales?: Umbrales;
  ajuste?: Pick<AjusteDeUmbrales, 'cambiar' | 'restablecer'>;
}

export function PanelDeHallazgos({
  transacciones,
  periodo,
  umbrales = UMBRALES_POR_DEFECTO,
  ajuste,
}: Props) {
  const id = useId();
  const encontrados = useMemo(
    () => calcularHallazgos(transacciones, umbrales, periodo),
    [transacciones, umbrales, periodo],
  );
  return (
    <section aria-labelledby={id} className="panel-de-hallazgos">
      <h2 id={id}>{textos.hallazgos.titulo}</h2>
      {ajuste && (
        <ControlesDeUmbrales
          umbrales={umbrales}
          alCambiar={ajuste.cambiar}
          alRestablecer={ajuste.restablecer}
        />
      )}
      {encontrados.length === 0 ? (
        <p>{textos.hallazgos.ninguno}</p>
      ) : (
        <ul className="hallazgos">
          {encontrados.map((hallazgo) => (
            <li key={hallazgo.tipo === 'viaje' ? `viaje-${hallazgo.destino}` : hallazgo.tipo}>
              {describirHallazgo(hallazgo)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
