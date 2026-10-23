import type { EChartsOption } from 'echarts';

import type { Periodo } from '../dominio/calendario';
import type { ResultadoCarga } from '../dominio/carga';
import type { Transaccion } from '../dominio/esquema';
import type { Filtro } from '../dominio/filtro';
import { formatearFecha, formatearMonto, formatearProporcion } from '../dominio/formato';
import { hallazgos, type Umbrales } from '../dominio/hallazgos';
import type { Metricas } from '../dominio/metricas';
import type { ContenidoDelReporte, SeccionDeGrafica } from '../reporte';
import { describirHallazgo } from './descripcion-de-hallazgos';
import { dibujarComoSvg } from './echarts';
import {
  opcionDeCategorias,
  opcionDelMapa,
  opcionPorCuenta,
  opcionPorDia,
  opcionPorDiaDeLaSemana,
  opcionPorHora,
  opcionPorZona,
} from './opciones-de-graficas';
import { formatearConteo, formatearMes } from './presentacion';
import { textos } from './textos';

const ANCHO = 720;
const ALTO = 320;
const ALTO_ALTO = 420;

export interface EntradaDelReporte {
  resultado: ResultadoCarga;
  filtro: Filtro;
  filtradas: Transaccion[];
  periodo: Periodo;
  metricas: Metricas;
  umbrales: Umbrales;
}

function lineasDelFiltro(filtro: Filtro): string[] {
  const { filtros } = textos;
  const { filtro: linea } = textos.reporte;
  const lista = (nombre: string, valores: string[] = []) =>
    valores.length === 0 ? [] : [linea(nombre, valores.join(', '))];
  const dato = (nombre: string, valor: string | undefined) =>
    valor === undefined ? [] : [linea(nombre, valor)];
  const lineas = [
    ...dato(filtros.desde, filtro.desde === undefined ? undefined : formatearFecha(filtro.desde)),
    ...dato(filtros.hasta, filtro.hasta === undefined ? undefined : formatearFecha(filtro.hasta)),
    ...lista(filtros.categorias, filtro.categorias),
    ...lista(filtros.cuentas, filtro.cuentas),
    ...lista(filtros.zonas, filtro.zonas),
    ...dato(
      filtros.montoMinimo,
      filtro.montoMinimo === undefined ? undefined : formatearMonto(filtro.montoMinimo),
    ),
    ...dato(
      filtros.montoMaximo,
      filtro.montoMaximo === undefined ? undefined : formatearMonto(filtro.montoMaximo),
    ),
  ];
  return lineas.length === 0 ? [textos.reporte.sinFiltros] : lineas;
}

function descripcionDe(opcion: EChartsOption): string {
  return opcion.aria?.label?.description ?? '';
}

function seccion(titulo: string, opcion: EChartsOption, alto = ALTO): SeccionDeGrafica {
  return {
    titulo,
    descripcion: descripcionDe(opcion),
    svg: dibujarComoSvg(opcion, ANCHO, alto),
  };
}

function seccionDelMapa(metricas: Metricas): SeccionDeGrafica {
  const { mapa } = textos.graficas;
  return metricas.puntosDelMapa.length === 0
    ? { titulo: mapa.titulo, mensaje: mapa.sinCoordenadas }
    : seccion(mapa.titulo, opcionDelMapa(metricas), ALTO_ALTO);
}

export function armarContenidoDelReporte({
  resultado,
  filtro,
  filtradas,
  periodo,
  metricas,
  umbrales,
}: EntradaDelReporte): ContenidoDelReporte {
  const { kpis, graficas } = textos;
  return {
    titulo: textos.reporte.titulo,
    encabezado: {
      mes: formatearMes(resultado.mes),
      periodo: textos.reporte.periodo(formatearFecha(periodo.desde), formatearFecha(periodo.hasta)),
      filtros: lineasDelFiltro(filtro),
    },
    kpis: {
      titulo: kpis.titulo,
      items: [
        { rotulo: kpis.gastoTotal, valor: formatearMonto(metricas.gastoTotal) },
        { rotulo: kpis.transacciones, valor: formatearConteo(metricas.numeroDeTransacciones) },
        { rotulo: kpis.ticketPromedio, valor: formatearMonto(metricas.ticketPromedio) },
        { rotulo: kpis.mediana, valor: formatearMonto(metricas.mediana) },
        { rotulo: kpis.gastoPromedioPorDia, valor: formatearMonto(metricas.gastoPromedioPorDia) },
      ],
    },
    hallazgos: {
      titulo: textos.hallazgos.titulo,
      frases: hallazgos(filtradas, umbrales, periodo).map(describirHallazgo),
      ninguno: textos.hallazgos.ninguno,
    },
    categorias: {
      titulo: textos.categorias.titulo,
      columnas: {
        categoria: textos.categorias.columnaCategoria,
        monto: textos.categorias.columnaMonto,
        porcentaje: textos.categorias.columnaPorcentaje,
      },
      filas: metricas.gastoPorCategoria.map(({ categoria, monto, proporcion }, posicion) => ({
        nombre: categoria,
        monto: formatearMonto(monto),
        porcentaje: formatearProporcion(proporcion),
        dominante: posicion === 0,
      })),
    },
    graficas: [
      seccion(textos.reporte.graficaDeCategorias, opcionDeCategorias(metricas)),
      seccion(graficas.porDia.titulo, opcionPorDia(metricas), ALTO_ALTO),
      seccion(graficas.porDiaDeLaSemana.titulo, opcionPorDiaDeLaSemana(metricas)),
      seccion(graficas.porHora.titulo, opcionPorHora(metricas)),
      seccion(graficas.porZona.titulo, opcionPorZona(metricas)),
      seccion(graficas.porCuenta.titulo, opcionPorCuenta(metricas)),
      seccionDelMapa(metricas),
    ],
  };
}
