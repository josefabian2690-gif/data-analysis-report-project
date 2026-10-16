import type { EChartsOption } from 'echarts';
import { useId, useMemo } from 'react';

import { porCategoria } from '../graficas/por-categoria';
import { formatearMonto, formatearProporcion } from '../dominio/formato';
import type { Metricas } from '../dominio/metricas';
import { Grafica } from './Grafica';
import { textos } from './textos';

function conDescripcion(metricas: Metricas): EChartsOption {
  const detalle = metricas.gastoPorCategoria
    .map(({ categoria, monto, proporcion }) =>
      textos.categorias.detalleDeCategoria(
        categoria,
        formatearMonto(monto),
        formatearProporcion(proporcion),
      ),
    )
    .join('; ');
  const opcion = porCategoria(metricas);
  return {
    ...opcion,
    aria: { ...opcion.aria, label: { description: textos.categorias.descripcionGrafica(detalle) } },
  };
}

export function GastoPorCategoria({ metricas }: { metricas: Metricas }) {
  const id = useId();
  const opcion = useMemo(() => conDescripcion(metricas), [metricas]);
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.categorias.titulo}</h2>
      <div className="categorias">
        <table>
          <caption>{textos.categorias.tabla}</caption>
          <thead>
            <tr>
              <th scope="col">{textos.categorias.columnaCategoria}</th>
              <th scope="col" className="numerico">
                {textos.categorias.columnaMonto}
              </th>
              <th scope="col" className="numerico">
                {textos.categorias.columnaPorcentaje}
              </th>
            </tr>
          </thead>
          <tbody>
            {metricas.gastoPorCategoria.map(({ categoria, monto, proporcion }, posicion) => (
              <tr key={categoria}>
                <td>
                  {categoria}
                  {posicion === 0 && (
                    <mark className="dominante">{textos.categorias.dominante}</mark>
                  )}
                </td>
                <td className="numerico">{formatearMonto(monto)}</td>
                <td className="numerico">{formatearProporcion(proporcion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tarjeta-grafica">
          <Grafica opcion={opcion} />
        </div>
      </div>
    </section>
  );
}
