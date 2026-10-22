import { useId, useMemo } from 'react';

import type { Periodo } from '../dominio/calendario';
import type { Transaccion } from '../dominio/esquema';
import { formatearFecha, formatearMonto, formatearProporcion } from '../dominio/formato';
import {
  hallazgos as calcularHallazgos,
  UMBRALES_POR_DEFECTO,
  type Hallazgo,
  type Umbrales,
} from '../dominio/hallazgos';
import { formatearConteo, formatearRazon } from './presentacion';
import { textos } from './textos';

function descripcion(hallazgo: Hallazgo): string {
  const t = textos.hallazgos;
  switch (hallazgo.tipo) {
    case 'categoria-dominante':
      return t.categoriaDominante(
        hallazgo.categoria,
        formatearProporcion(hallazgo.proporcion),
        formatearMonto(hallazgo.monto),
      );
    case 'zona-favorita':
      return t.zonaFavorita(
        hallazgo.zona,
        formatearProporcion(hallazgo.proporcion),
        formatearMonto(hallazgo.monto),
      );
    case 'quincena':
      return t.quincena(
        formatearRazon(hallazgo.razon),
        formatearMonto(hallazgo.promedioQuincena),
        formatearMonto(hallazgo.promedioResto),
      );
    case 'fin-de-semana':
      return t.finDeSemana(
        formatearRazon(hallazgo.razon),
        formatearMonto(hallazgo.promedioFinDeSemana),
        formatearMonto(hallazgo.promedioResto),
      );
    case 'viaje':
      return t.viaje(
        hallazgo.destino,
        formatearFecha(hallazgo.desde),
        formatearFecha(hallazgo.hasta),
        formatearMonto(hallazgo.monto),
      );
    case 'atipicos':
      return t.atipicos(
        formatearConteo(hallazgo.transacciones.length),
        formatearMonto(hallazgo.transacciones[0]?.monto ?? 0),
      );
  }
}

interface Props {
  transacciones: Transaccion[];
  periodo: Periodo;
  umbrales?: Umbrales;
}

export function PanelDeHallazgos({
  transacciones,
  periodo,
  umbrales = UMBRALES_POR_DEFECTO,
}: Props) {
  const id = useId();
  const encontrados = useMemo(
    () => calcularHallazgos(transacciones, umbrales, periodo),
    [transacciones, umbrales, periodo],
  );
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.hallazgos.titulo}</h2>
      {encontrados.length === 0 ? (
        <p>{textos.hallazgos.ninguno}</p>
      ) : (
        <ul>
          {encontrados.map((hallazgo) => (
            <li key={hallazgo.tipo === 'viaje' ? `viaje-${hallazgo.destino}` : hallazgo.tipo}>
              {descripcion(hallazgo)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
