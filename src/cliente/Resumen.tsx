import { useId } from 'react';

import type { ResultadoCarga } from '../dominio/carga';
import { Dato } from './Dato';
import { formatearConteo, formatearMes } from './presentacion';
import { textos } from './textos';

export function Resumen({ resultado }: { resultado: ResultadoCarga }) {
  const id = useId();
  const { mes, transacciones, invalidas } = resultado;
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.resumen.titulo}</h2>
      <div className="datos">
        <Dato etiqueta={textos.resumen.mes} valor={formatearMes(mes)} />
        <Dato etiqueta={textos.resumen.validas} valor={formatearConteo(transacciones.length)} />
        <Dato etiqueta={textos.resumen.invalidas} valor={formatearConteo(invalidas.length)} />
      </div>
      {invalidas.length > 0 && (
        <table>
          <caption>{textos.resumen.tablaDeInvalidas}</caption>
          <thead>
            <tr>
              <th scope="col">{textos.resumen.columnaFila}</th>
              <th scope="col">{textos.resumen.columnaMotivo}</th>
            </tr>
          </thead>
          <tbody>
            {invalidas.map(({ fila, motivo }) => (
              <tr key={fila}>
                <td>{fila}</td>
                <td>{textos.motivos[motivo]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
