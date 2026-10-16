import { useId, type ChangeEvent } from 'react';

import { periodoDelMes, recorrerPeriodo } from '../dominio/calendario';
import type { Filtro, OpcionesDeFiltro } from '../dominio/filtro';
import { formatearFecha } from '../dominio/formato';
import { textos } from './textos';

type DimensionDeLista = 'categorias' | 'cuentas' | 'zonas';
type Extremo = 'desde' | 'hasta';
type LimiteDeMonto = 'montoMinimo' | 'montoMaximo';

export interface PanelDeFiltrosProps {
  mes: string;
  opciones: OpcionesDeFiltro;
  filtro: Filtro;
  alCambiar: (filtro: Filtro) => void;
}

function montoDe(texto: string): number | undefined {
  return texto === '' ? undefined : Number(texto);
}

function sinCampo(filtro: Filtro, campo: Extremo | LimiteDeMonto): Filtro {
  const copia = { ...filtro };
  delete copia[campo];
  return copia;
}

function ListaDeDias({
  etiqueta,
  dias,
  valor,
  alElegir,
}: {
  etiqueta: string;
  dias: string[];
  valor: string | undefined;
  alElegir: (dia: string | undefined) => void;
}) {
  return (
    <label className="campo-de-filtro">
      {etiqueta}
      <select
        value={valor ?? ''}
        onChange={(evento: ChangeEvent<HTMLSelectElement>) =>
          alElegir(evento.currentTarget.value || undefined)
        }
      >
        <option value="">{textos.filtros.sinLimite}</option>
        {dias.map((dia) => (
          <option key={dia} value={dia}>
            {formatearFecha(dia)}
          </option>
        ))}
      </select>
    </label>
  );
}

function CampoDeMonto({
  etiqueta,
  valor,
  alEscribir,
}: {
  etiqueta: string;
  valor: number | undefined;
  alEscribir: (monto: number | undefined) => void;
}) {
  return (
    <label className="campo-de-filtro">
      {etiqueta}
      <input
        type="number"
        min={0}
        step="any"
        value={valor ?? ''}
        onChange={(evento) => alEscribir(montoDe(evento.currentTarget.value))}
      />
    </label>
  );
}

function Casillas({
  leyenda,
  opciones,
  elegidas,
  alAlternar,
}: {
  leyenda: string;
  opciones: string[];
  elegidas: string[];
  alAlternar: (opcion: string) => void;
}) {
  return (
    <fieldset>
      <legend>{leyenda}</legend>
      {opciones.map((opcion) => (
        <label key={opcion} className="casilla">
          <input
            type="checkbox"
            checked={elegidas.includes(opcion)}
            onChange={() => alAlternar(opcion)}
          />
          {opcion}
        </label>
      ))}
    </fieldset>
  );
}

export function PanelDeFiltros({ mes, opciones, filtro, alCambiar }: PanelDeFiltrosProps) {
  const id = useId();
  const dias = recorrerPeriodo(periodoDelMes(mes));

  function elegirDia(extremo: Extremo, dia: string | undefined) {
    alCambiar(dia === undefined ? sinCampo(filtro, extremo) : { ...filtro, [extremo]: dia });
  }

  function escribirMonto(limite: LimiteDeMonto, monto: number | undefined) {
    alCambiar(monto === undefined ? sinCampo(filtro, limite) : { ...filtro, [limite]: monto });
  }

  function alternar(dimension: DimensionDeLista, opcion: string) {
    const elegidas = filtro[dimension] ?? [];
    const siguientes = elegidas.includes(opcion)
      ? elegidas.filter((elegida) => elegida !== opcion)
      : [...elegidas, opcion];
    alCambiar({ ...filtro, [dimension]: siguientes });
  }

  function casillas(dimension: DimensionDeLista, leyenda: string) {
    return (
      <Casillas
        leyenda={leyenda}
        opciones={opciones[dimension]}
        elegidas={filtro[dimension] ?? []}
        alAlternar={(opcion) => alternar(dimension, opcion)}
      />
    );
  }

  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.filtros.titulo}</h2>
      <div className="filtros">
        <fieldset>
          <legend>{textos.filtros.fechas}</legend>
          <ListaDeDias
            etiqueta={textos.filtros.desde}
            dias={dias}
            valor={filtro.desde}
            alElegir={(dia) => elegirDia('desde', dia)}
          />
          <ListaDeDias
            etiqueta={textos.filtros.hasta}
            dias={dias}
            valor={filtro.hasta}
            alElegir={(dia) => elegirDia('hasta', dia)}
          />
        </fieldset>
        <fieldset>
          <legend>{textos.filtros.monto}</legend>
          <CampoDeMonto
            etiqueta={textos.filtros.montoMinimo}
            valor={filtro.montoMinimo}
            alEscribir={(monto) => escribirMonto('montoMinimo', monto)}
          />
          <CampoDeMonto
            etiqueta={textos.filtros.montoMaximo}
            valor={filtro.montoMaximo}
            alEscribir={(monto) => escribirMonto('montoMaximo', monto)}
          />
        </fieldset>
        {casillas('categorias', textos.filtros.categorias)}
        {casillas('cuentas', textos.filtros.cuentas)}
        {casillas('zonas', textos.filtros.zonas)}
      </div>
      <button type="button" className="quitar-filtros" onClick={() => alCambiar({})}>
        {textos.filtros.quitar}
      </button>
    </section>
  );
}
