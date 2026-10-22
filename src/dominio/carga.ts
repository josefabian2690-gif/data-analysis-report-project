import Papa from 'papaparse';

import { VALORES_POR_DEFECTO, type Transaccion } from './esquema';
import { leerFecha } from './fecha';

const COLUMNAS_OBLIGATORIAS = ['fecha', 'monto', 'concepto'] as const;
export type ColumnaObligatoria = (typeof COLUMNAS_OBLIGATORIAS)[number];

export type MotivoRechazo =
  | { codigo: 'vacio' }
  | { codigo: 'sin-filas' }
  | { codigo: 'faltan-columnas'; columnas: ColumnaObligatoria[] }
  | { codigo: 'sin-filas-validas' };

export class CargaRechazada extends Error {
  readonly motivo: MotivoRechazo;

  constructor(motivo: MotivoRechazo) {
    super(`carga rechazada: ${motivo.codigo}`);
    this.name = 'CargaRechazada';
    this.motivo = motivo;
  }
}

export type MotivoInvalido =
  'fila-mal-formada' | 'fecha' | 'monto' | 'concepto-vacio' | 'id-repetido' | 'fuera-del-mes';

export interface FilaInvalida {
  fila: number;
  motivo: MotivoInvalido;
}

export interface ResultadoCarga {
  mes: string;
  transacciones: Transaccion[];
  invalidas: FilaInvalida[];
}

type Registro = Record<string, string | undefined>;

interface FilaLeida {
  fila: number;
  idDelArchivo: string;
  datos: Omit<Transaccion, 'id'>;
}

const MOTIVO_DE_CELDA_VACIA: Record<ColumnaObligatoria, MotivoInvalido> = {
  fecha: 'fecha',
  monto: 'monto',
  concepto: 'concepto-vacio',
};
const MONTO = /^\d+(\.\d+)?$/;
const COORDENADA = /^-?\d+(\.\d+)?$/;

function celda(registro: Registro, columna: string): string {
  return (registro[columna] ?? '').trim();
}

function estaVacio(texto: string): boolean {
  return texto.trim() === '';
}

function leerRegistros(texto: string): {
  columnas: string[];
  registros: Registro[];
  malFormadas: Set<number>;
} {
  const { data, meta, errors } = Papa.parse<Registro>(texto, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (nombre) => nombre.trim(),
  });
  const malFormadas = new Set<number>();
  for (const error of errors) {
    if (error.type === 'FieldMismatch' && error.row !== undefined) malFormadas.add(error.row);
  }
  return { columnas: meta.fields ?? [], registros: data, malFormadas };
}

function exigirColumnas(columnas: string[]): void {
  const faltan = COLUMNAS_OBLIGATORIAS.filter((columna) => !columnas.includes(columna));
  if (faltan.length > 0) throw new CargaRechazada({ codigo: 'faltan-columnas', columnas: faltan });
}

function leerMonto(texto: string): number | null {
  if (!MONTO.test(texto)) return null;
  const monto = Number(texto);
  return Number.isFinite(monto) && monto > 0 ? monto : null;
}

function leerCoordenada(texto: string, limite: number): number | null {
  if (!COORDENADA.test(texto)) return null;
  const valor = Number(texto);
  return Math.abs(valor) <= limite ? valor : null;
}

function leerCoordenadas(registro: Registro): Pick<Transaccion, 'latitud' | 'longitud'> {
  const latitud = leerCoordenada(celda(registro, 'latitud'), 90);
  const longitud = leerCoordenada(celda(registro, 'longitud'), 180);
  if (latitud === null || longitud === null) return { latitud: null, longitud: null };
  return { latitud, longitud };
}

function leerFila(registro: Registro, fila: number): FilaLeida | MotivoInvalido {
  for (const columna of COLUMNAS_OBLIGATORIAS) {
    if (celda(registro, columna) === '') return MOTIVO_DE_CELDA_VACIA[columna];
  }
  const fecha = leerFecha(celda(registro, 'fecha'));
  if (fecha === null) return 'fecha';
  const monto = leerMonto(celda(registro, 'monto'));
  if (monto === null) return 'monto';
  return {
    fila,
    idDelArchivo: celda(registro, 'id_transaccion'),
    datos: {
      ...fecha,
      monto,
      concepto: celda(registro, 'concepto'),
      categoria: celda(registro, 'categoria') || VALORES_POR_DEFECTO.categoria,
      cuenta: celda(registro, 'cuenta') || VALORES_POR_DEFECTO.cuenta,
      zona: celda(registro, 'zona') || VALORES_POR_DEFECTO.zona,
      ...leerCoordenadas(registro),
    },
  };
}

function ordenDeFecha(datos: Omit<Transaccion, 'id'>): string {
  return `${datos.dia} ${datos.hora ?? '00:00:00'}`;
}

function comparar(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function asignarIds(filas: FilaLeida[], idsDelArchivo: Set<string>): Transaccion[] {
  const idGenerado = new Map<FilaLeida, string>();
  let consecutivo = 0;
  const sinId = filas
    .filter((fila) => fila.idDelArchivo === '')
    .sort((a, b) => comparar(ordenDeFecha(a.datos), ordenDeFecha(b.datos)));
  for (const fila of sinId) {
    let id: string;
    do {
      consecutivo += 1;
      id = `TX${String(consecutivo).padStart(6, '0')}`;
    } while (idsDelArchivo.has(id));
    idGenerado.set(fila, id);
  }
  return filas.map((fila) => ({
    id: fila.idDelArchivo || (idGenerado.get(fila) ?? ''),
    ...fila.datos,
  }));
}

export function pideConfirmacion(resultado: ResultadoCarga): boolean {
  const filasDeDatos = resultado.transacciones.length + resultado.invalidas.length;
  return resultado.invalidas.length * 100 > filasDeDatos * 5;
}

function separarIdsRepetidos(filas: FilaLeida[]): {
  conservadas: FilaLeida[];
  repetidas: FilaInvalida[];
} {
  const vistos = new Set<string>();
  const conservadas: FilaLeida[] = [];
  const repetidas: FilaInvalida[] = [];
  for (const fila of filas) {
    if (fila.idDelArchivo !== '' && vistos.has(fila.idDelArchivo)) {
      repetidas.push({ fila: fila.fila, motivo: 'id-repetido' });
      continue;
    }
    if (fila.idDelArchivo !== '') vistos.add(fila.idDelArchivo);
    conservadas.push(fila);
  }
  return { conservadas, repetidas };
}

function mesDe(fila: FilaLeida): string {
  return fila.datos.dia.slice(0, 7);
}

function elegirMes(filas: FilaLeida[]): string {
  const conteo = new Map<string, number>();
  for (const fila of filas) conteo.set(mesDe(fila), (conteo.get(mesDe(fila)) ?? 0) + 1);
  const porMayoria = [...conteo.entries()].sort(
    ([mesA, filasA], [mesB, filasB]) => filasB - filasA || comparar(mesA, mesB),
  );
  return porMayoria[0]?.[0] ?? '';
}

export function parsearCsv(texto: string): ResultadoCarga {
  if (estaVacio(texto)) throw new CargaRechazada({ codigo: 'vacio' });
  const { columnas, registros, malFormadas } = leerRegistros(texto);
  exigirColumnas(columnas);
  if (registros.length === 0) throw new CargaRechazada({ codigo: 'sin-filas' });

  const idsDelArchivo = new Set(
    registros.map((registro) => celda(registro, 'id_transaccion')).filter((id) => id !== ''),
  );
  const validas: FilaLeida[] = [];
  const invalidas: FilaInvalida[] = [];
  registros.forEach((registro, indice) => {
    const fila = indice + 2;
    const leida = malFormadas.has(indice) ? 'fila-mal-formada' : leerFila(registro, fila);
    if (typeof leida === 'string') invalidas.push({ fila, motivo: leida });
    else validas.push(leida);
  });

  const { conservadas, repetidas } = separarIdsRepetidos(validas);
  if (conservadas.length === 0) throw new CargaRechazada({ codigo: 'sin-filas-validas' });
  const mes = elegirMes(conservadas);
  const delMes = conservadas.filter((fila) => mesDe(fila) === mes);
  const fueraDelMes = conservadas
    .filter((fila) => mesDe(fila) !== mes)
    .map((fila): FilaInvalida => ({ fila: fila.fila, motivo: 'fuera-del-mes' }));

  return {
    mes,
    transacciones: asignarIds(delMes, idsDelArchivo),
    invalidas: [...invalidas, ...repetidas, ...fueraDelMes].sort((a, b) => a.fila - b.fila),
  };
}
