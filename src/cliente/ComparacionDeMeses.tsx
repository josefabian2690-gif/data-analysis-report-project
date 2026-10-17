import { useEffect, useId, useMemo, useState } from 'react';

import { comparar, type Comparacion, type FilaDeComparacion } from '../dominio/comparacion';
import {
  formatearDiferenciaDeMonto,
  formatearDiferenciaDeProporcion,
  formatearMonto,
} from '../dominio/formato';
import { Grafica } from './Grafica';
import type { MesListado } from './historial';
import type { MesesPedidos } from './meses-pedidos';
import { opcionPorComparacion } from './opciones-de-graficas';
import { formatearMes } from './presentacion';
import { parVigente, type EleccionDeMeses } from './seleccion-de-meses';
import { textos } from './textos';

const { comparacion: catalogo } = textos;

type Carga = { tipo: 'listo'; comparacion: Comparacion } | { tipo: 'fallido' };

interface CargaDe {
  clave: string;
  carga: Carga;
}

interface ComparacionDeMesesProps {
  meses: MesListado[];
  pedidos: MesesPedidos;
  visible: boolean;
}

function SelectorDeMes(props: {
  nombre: string;
  meses: string[];
  valor: string;
  alElegir: (mes: string) => void;
}) {
  return (
    <label className="selector">
      {props.nombre}
      <select value={props.valor} onChange={(evento) => props.alElegir(evento.currentTarget.value)}>
        {props.meses.map((mes) => (
          <option key={mes} value={mes}>
            {formatearMes(mes)}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilaDeLaTabla({ fila, nombre }: { fila: FilaDeComparacion; nombre: string }) {
  const [antes = 0, despues = 0] = fila.montos;
  const { absoluta, proporcion } = fila.diferencias[0] ?? { absoluta: 0, proporcion: null };
  return (
    <tr>
      <th scope="row">{nombre}</th>
      <td className="numerico">{formatearMonto(antes)}</td>
      <td className="numerico">{formatearMonto(despues)}</td>
      <td className="numerico">{formatearDiferenciaDeMonto(absoluta)}</td>
      <td className="numerico">
        {proporcion === null ? catalogo.sinProporcion : formatearDiferenciaDeProporcion(proporcion)}
      </td>
    </tr>
  );
}

function TablaDeLaComparacion({ resultado }: { resultado: Comparacion }) {
  const [anterior = '', posterior = ''] = resultado.meses.map(formatearMes);
  return (
    <table>
      <caption>{catalogo.tabla(anterior, posterior)}</caption>
      <thead>
        <tr>
          <th scope="col">{catalogo.columnas.categoria}</th>
          <th scope="col" className="numerico">
            {anterior}
          </th>
          <th scope="col" className="numerico">
            {posterior}
          </th>
          <th scope="col" className="numerico">
            {catalogo.columnas.diferencia}
          </th>
          <th scope="col" className="numerico">
            {catalogo.columnas.proporcion}
          </th>
        </tr>
      </thead>
      <tbody>
        {resultado.categorias.map((fila) => (
          <FilaDeLaTabla key={fila.nombre} fila={fila} nombre={fila.nombre} />
        ))}
        <FilaDeLaTabla fila={resultado.total} nombre={catalogo.total} />
      </tbody>
    </table>
  );
}

function GraficaDeLaComparacion({ resultado }: { resultado: Comparacion }) {
  const id = useId();
  const opcion = useMemo(() => opcionPorComparacion(resultado), [resultado]);
  return (
    <section aria-labelledby={id}>
      <h3 id={id}>{catalogo.grafica.titulo}</h3>
      <div className="tarjeta-grafica">
        <Grafica opcion={opcion} />
      </div>
    </section>
  );
}

function useComparacion(
  meses: MesListado[],
  pedidos: MesesPedidos,
  base: string,
  comparado: string,
  visible: boolean,
): Carga | undefined {
  const clave = `${base}|${comparado}`;
  const [cargaDe, setCargaDe] = useState<CargaDe>();

  useEffect(() => {
    if (!visible || base === comparado) return;
    let vigente = true;
    const terminar = (carga: Carga) => {
      if (vigente) setCargaDe({ clave, carga });
    };
    Promise.all([pedidos.obtener(base), pedidos.obtener(comparado)]).then(
      ([deBase, deComparado]) =>
        terminar(
          deBase === undefined || deComparado === undefined
            ? { tipo: 'fallido' }
            : {
                tipo: 'listo',
                comparacion: comparar({ [base]: deBase, [comparado]: deComparado }),
              },
        ),
      () => terminar({ tipo: 'fallido' }),
    );
    return () => {
      vigente = false;
    };
  }, [meses, pedidos, base, comparado, clave, visible]);

  return cargaDe?.clave === clave ? cargaDe.carga : undefined;
}

export function ComparacionDeMeses({ meses, pedidos, visible }: ComparacionDeMesesProps) {
  const id = useId();
  const [eleccion, setEleccion] = useState<EleccionDeMeses>({});
  const cronologicos = useMemo(() => meses.map(({ mes }) => mes).sort(), [meses]);
  const hayDos = cronologicos.length >= 2;
  const { base, comparado } = hayDos
    ? parVigente(cronologicos, eleccion)
    : { base: '', comparado: '' };
  const carga = useComparacion(meses, pedidos, base, comparado, visible);

  function elegir(campo: keyof EleccionDeMeses, mes: string) {
    setEleccion({ base, comparado, [campo]: mes });
  }

  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{catalogo.titulo}</h2>
      {!hayDos && <p>{catalogo.faltanMeses}</p>}
      {hayDos && (
        <>
          <div className="selectores-de-mes">
            <SelectorDeMes
              nombre={catalogo.mesBase}
              meses={cronologicos}
              valor={base}
              alElegir={(mes) => elegir('base', mes)}
            />
            <SelectorDeMes
              nombre={catalogo.mesAComparar}
              meses={cronologicos}
              valor={comparado}
              alElegir={(mes) => elegir('comparado', mes)}
            />
          </div>
          {base === comparado && <p>{catalogo.mismoMes}</p>}
          {base !== comparado && carga === undefined && <p>{catalogo.cargando}</p>}
          {carga?.tipo === 'fallido' && <p role="alert">{catalogo.fallo}</p>}
          {carga?.tipo === 'listo' && (
            <>
              <TablaDeLaComparacion resultado={carga.comparacion} />
              {visible && <GraficaDeLaComparacion resultado={carga.comparacion} />}
            </>
          )}
        </>
      )}
    </section>
  );
}
