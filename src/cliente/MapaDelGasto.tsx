import { useId, useMemo } from 'react';

import type { Metricas } from '../dominio/metricas';
import { Grafica } from './Grafica';
import { opcionDelMapa } from './opciones-de-graficas';
import { textos } from './textos';

const { mapa } = textos.graficas;

export function MapaDelGasto({ metricas }: { metricas: Metricas }) {
  const id = useId();
  const opcion = useMemo(() => opcionDelMapa(metricas), [metricas]);
  const hayCoordenadas = metricas.puntosDelMapa.length > 0;
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{mapa.titulo}</h2>
      {hayCoordenadas ? (
        <div className="tarjeta-grafica grafica-ancha">
          <Grafica opcion={opcion} />
        </div>
      ) : (
        <p>{mapa.sinCoordenadas}</p>
      )}
    </section>
  );
}
