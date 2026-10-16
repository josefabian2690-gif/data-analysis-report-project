import { useId } from 'react';

import { formatearMonto } from '../dominio/formato';
import type { Metricas } from '../dominio/metricas';
import { Dato } from './Dato';
import { formatearConteo } from './presentacion';
import { textos } from './textos';

export function Kpis({ metricas }: { metricas: Metricas }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.kpis.titulo}</h2>
      <div className="datos">
        <Dato etiqueta={textos.kpis.gastoTotal} valor={formatearMonto(metricas.gastoTotal)} />
        <Dato
          etiqueta={textos.kpis.transacciones}
          valor={formatearConteo(metricas.numeroDeTransacciones)}
        />
        <Dato
          etiqueta={textos.kpis.ticketPromedio}
          valor={formatearMonto(metricas.ticketPromedio)}
        />
        <Dato etiqueta={textos.kpis.mediana} valor={formatearMonto(metricas.mediana)} />
        <Dato
          etiqueta={textos.kpis.gastoPromedioPorDia}
          valor={formatearMonto(metricas.gastoPromedioPorDia)}
        />
      </div>
    </section>
  );
}
