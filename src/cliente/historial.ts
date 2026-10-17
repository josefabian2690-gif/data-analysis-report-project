import { esMes, leerMesGuardado, type Transaccion } from '../dominio/esquema';

/** Un mes tal como lo lista `GET /api/meses` (docs/ARQUITECTURA.md, «API del historial»). */
export interface MesListado {
  mes: string;
  filas: number;
  total: number;
}

/** `existe` es la respuesta 409 de R-09 (docs/DOMINIO.md): el mes ya está guardado y no se pidió reemplazarlo. */
export type ResultadoDeGuardado = 'creado' | 'reemplazado' | 'existe';

export interface OpcionesDeGuardado {
  reemplazar?: boolean;
}

export interface Historial {
  listar(): Promise<MesListado[]>;
  obtener(mes: string): Promise<Transaccion[] | undefined>;
  guardar(
    mes: string,
    transacciones: readonly Transaccion[],
    opciones: OpcionesDeGuardado,
  ): Promise<ResultadoDeGuardado>;
}

export type Peticionar = (url: string, init?: RequestInit) => Promise<Response>;

const RUTA_DE_MESES = '/api/meses';
const TIPO_JSON = 'application/json';

function rutaDelMes(mes: string): string {
  return `${RUTA_DE_MESES}/${mes}`;
}

function errorDeEstado(respuesta: Response): Error {
  return new Error(`El historial respondió ${respuesta.status}.`);
}

function esMesListado(valor: unknown): valor is MesListado {
  if (typeof valor !== 'object' || valor === null) return false;
  const { mes, filas, total } = valor as Record<string, unknown>;
  return (
    typeof mes === 'string' &&
    esMes(mes) &&
    typeof filas === 'number' &&
    Number.isFinite(filas) &&
    typeof total === 'number' &&
    Number.isFinite(total)
  );
}

function leerLista(valor: unknown): MesListado[] {
  if (!Array.isArray(valor) || !valor.every(esMesListado)) {
    throw new Error('La lista de meses del historial no tiene la forma esperada.');
  }
  return valor;
}

export function crearHistorial(peticionar: Peticionar): Historial {
  return {
    async listar() {
      const respuesta = await peticionar(RUTA_DE_MESES);
      if (!respuesta.ok) throw errorDeEstado(respuesta);
      return leerLista(await respuesta.json());
    },

    async obtener(mes) {
      const respuesta = await peticionar(rutaDelMes(mes));
      if (respuesta.status === 404) return undefined;
      if (!respuesta.ok) throw errorDeEstado(respuesta);
      const guardado = leerMesGuardado(mes, await respuesta.json());
      if (!guardado.ok) throw new Error(`El mes ${mes} guardado no es válido: ${guardado.motivo}.`);
      return guardado.transacciones;
    },

    async guardar(mes, transacciones, { reemplazar = false }) {
      const respuesta = await peticionar(`${rutaDelMes(mes)}${reemplazar ? '?reemplazar=1' : ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': TIPO_JSON },
        body: JSON.stringify(transacciones),
      });
      if (respuesta.status === 409) return 'existe';
      if (!respuesta.ok) throw errorDeEstado(respuesta);
      return respuesta.status === 201 ? 'creado' : 'reemplazado';
    },
  };
}
