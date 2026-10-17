import type { EChartsOption } from 'echarts';
import { useId, useMemo } from 'react';

import type { Metricas } from '../dominio/metricas';
import { Grafica } from './Grafica';
import {
  opcionPorCuenta,
  opcionPorDia,
  opcionPorDiaDeLaSemana,
  opcionPorHora,
  opcionPorZona,
} from './opciones-de-graficas';
import { textos } from './textos';

interface SeccionDeGraficaProps {
  titulo: string;
  opcion: EChartsOption;
  ancha?: boolean;
}

function SeccionDeGrafica({ titulo, opcion, ancha = false }: SeccionDeGraficaProps) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      <div className={ancha ? 'tarjeta-grafica grafica-ancha' : 'tarjeta-grafica'}>
        <Grafica opcion={opcion} />
      </div>
    </section>
  );
}

export function GraficasDelPeriodo({ metricas }: { metricas: Metricas }) {
  const porDia = useMemo(() => opcionPorDia(metricas), [metricas]);
  const porDiaDeLaSemana = useMemo(() => opcionPorDiaDeLaSemana(metricas), [metricas]);
  const porHora = useMemo(() => opcionPorHora(metricas), [metricas]);
  const porZona = useMemo(() => opcionPorZona(metricas), [metricas]);
  const porCuenta = useMemo(() => opcionPorCuenta(metricas), [metricas]);
  const { graficas } = textos;
  return (
    <>
      <SeccionDeGrafica titulo={graficas.porDia.titulo} opcion={porDia} ancha />
      <SeccionDeGrafica titulo={graficas.porDiaDeLaSemana.titulo} opcion={porDiaDeLaSemana} />
      <SeccionDeGrafica titulo={graficas.porHora.titulo} opcion={porHora} />
      <SeccionDeGrafica titulo={graficas.porZona.titulo} opcion={porZona} />
      <SeccionDeGrafica titulo={graficas.porCuenta.titulo} opcion={porCuenta} />
    </>
  );
}
