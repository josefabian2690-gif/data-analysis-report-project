import { useMemo, useState } from 'react';

import type { ResultadoCarga } from '../dominio/carga';
import { filtrar, opcionesDeFiltro, periodoDelFiltro, type Filtro } from '../dominio/filtro';
import { metricas as calcularMetricas } from '../dominio/metricas';
import { GastoPorCategoria } from './GastoPorCategoria';
import { Kpis } from './Kpis';
import { PanelDeFiltros } from './PanelDeFiltros';
import { Resumen } from './Resumen';
import { TablaDeTransacciones } from './TablaDeTransacciones';
import { textos } from './textos';

const SIN_FILTRO: Filtro = {};

export function Tablero({ resultado }: { resultado: ResultadoCarga }) {
  const [filtro, setFiltro] = useState<Filtro>(SIN_FILTRO);
  const opciones = useMemo(() => opcionesDeFiltro(resultado.transacciones), [resultado]);
  const filtradas = useMemo(() => filtrar(resultado.transacciones, filtro), [resultado, filtro]);
  const metricas = useMemo(
    () => calcularMetricas(filtradas, periodoDelFiltro(resultado.mes, filtro)),
    [filtradas, resultado.mes, filtro],
  );
  const sinResultados = filtradas.length === 0;
  return (
    <>
      <Resumen resultado={resultado} />
      <PanelDeFiltros
        mes={resultado.mes}
        opciones={opciones}
        filtro={filtro}
        alCambiar={setFiltro}
      />
      <p role="status" className="sin-resultados">
        {sinResultados ? textos.filtros.sinResultados : null}
      </p>
      {!sinResultados && (
        <>
          <Kpis metricas={metricas} />
          <GastoPorCategoria metricas={metricas} />
          <TablaDeTransacciones transacciones={filtradas} />
        </>
      )}
    </>
  );
}
