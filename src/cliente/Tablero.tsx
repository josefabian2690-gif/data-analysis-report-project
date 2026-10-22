import { useMemo, useState } from 'react';

import type { ResultadoCarga } from '../dominio/carga';
import { filtrar, opcionesDeFiltro, periodoDelFiltro, type Filtro } from '../dominio/filtro';
import { metricas as calcularMetricas } from '../dominio/metricas';
import { GastoPorCategoria } from './GastoPorCategoria';
import { GraficasDelPeriodo } from './GraficasDelPeriodo';
import { Kpis } from './Kpis';
import { PanelDeFiltros } from './PanelDeFiltros';
import { PanelDeHallazgos } from './PanelDeHallazgos';
import { Resumen } from './Resumen';
import { TablaDeTransacciones } from './TablaDeTransacciones';
import { textos } from './textos';
import type { AjusteDeUmbrales } from './usar-umbrales';

const SIN_FILTRO: Filtro = {};

export function Tablero({
  resultado,
  ajuste,
}: {
  resultado: ResultadoCarga;
  ajuste: AjusteDeUmbrales;
}) {
  const [filtro, setFiltro] = useState<Filtro>(SIN_FILTRO);
  const opciones = useMemo(() => opcionesDeFiltro(resultado.transacciones), [resultado]);
  const filtradas = useMemo(() => filtrar(resultado.transacciones, filtro), [resultado, filtro]);
  const periodo = useMemo(() => periodoDelFiltro(resultado.mes, filtro), [resultado.mes, filtro]);
  const metricas = useMemo(() => calcularMetricas(filtradas, periodo), [filtradas, periodo]);
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
          <PanelDeHallazgos
            transacciones={filtradas}
            periodo={periodo}
            umbrales={ajuste.umbrales}
            ajuste={ajuste}
          />
          <GastoPorCategoria metricas={metricas} />
          <GraficasDelPeriodo metricas={metricas} />
          <TablaDeTransacciones transacciones={filtradas} />
        </>
      )}
    </>
  );
}
