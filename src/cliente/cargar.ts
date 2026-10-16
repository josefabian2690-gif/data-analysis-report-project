import {
  CargaRechazada,
  parsearCsv,
  type MotivoRechazo,
  type ResultadoCarga,
} from '../dominio/carga';

export type EstadoDeCarga =
  { tipo: 'rechazado'; motivo: MotivoRechazo } | { tipo: 'cargado'; resultado: ResultadoCarga };

export async function leerArchivo(archivo: File): Promise<EstadoDeCarga> {
  const texto = await archivo.text();
  try {
    return { tipo: 'cargado', resultado: parsearCsv(texto) };
  } catch (error) {
    if (error instanceof CargaRechazada) return { tipo: 'rechazado', motivo: error.motivo };
    throw error;
  }
}
