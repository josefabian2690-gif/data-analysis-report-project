import { useMemo } from 'react';

import type { ResultadoCarga } from '../dominio/carga';
import { metricas as calcularMetricas } from '../dominio/metricas';
import { GastoPorCategoria } from './GastoPorCategoria';
import { Kpis } from './Kpis';
import { Resumen } from './Resumen';

export function Tablero({ resultado }: { resultado: ResultadoCarga }) {
  const metricas = useMemo(() => calcularMetricas(resultado.transacciones), [resultado]);
  return (
    <>
      <Resumen resultado={resultado} />
      <Kpis metricas={metricas} />
      <GastoPorCategoria metricas={metricas} />
    </>
  );
}
