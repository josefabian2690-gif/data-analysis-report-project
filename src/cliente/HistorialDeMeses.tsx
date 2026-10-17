import { useId } from 'react';

import { formatearMonto } from '../dominio/formato';
import type { Listado } from './listado';
import { formatearConteo, formatearMes } from './presentacion';
import { textos } from './textos';

export function HistorialDeMeses({ listado }: { listado: Listado }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.historial.titulo}</h2>
      {listado.tipo === 'no-disponible' && <p>{textos.historial.noDisponible}</p>}
      {listado.tipo === 'listo' && listado.meses.length === 0 && <p>{textos.historial.vacio}</p>}
      {listado.tipo === 'listo' && listado.meses.length > 0 && (
        <table>
          <caption>{textos.historial.tabla}</caption>
          <thead>
            <tr>
              <th scope="col">{textos.historial.columnas.mes}</th>
              <th scope="col" className="numerico">
                {textos.historial.columnas.transacciones}
              </th>
              <th scope="col" className="numerico">
                {textos.historial.columnas.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {listado.meses.map(({ mes, filas, total }) => (
              <tr key={mes}>
                <td>{formatearMes(mes)}</td>
                <td className="numerico">{formatearConteo(filas)}</td>
                <td className="numerico">{formatearMonto(total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
