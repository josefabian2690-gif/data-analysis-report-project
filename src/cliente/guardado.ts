import type { Transaccion } from '../dominio/esquema';
import type { Historial } from './historial';

export type EstadoDeGuardado =
  'guardando' | 'guardado' | 'pregunta' | 'reemplazado' | 'conservado' | 'fallido';

export async function guardarMes(
  historial: Historial,
  mes: string,
  transacciones: readonly Transaccion[],
  reemplazar: boolean,
): Promise<EstadoDeGuardado> {
  try {
    const resultado = await historial.guardar(mes, transacciones, { reemplazar });
    if (resultado === 'existe') return 'pregunta';
    return resultado === 'creado' ? 'guardado' : 'reemplazado';
  } catch {
    return 'fallido';
  }
}

export function cambiaElHistorial(estado: EstadoDeGuardado): boolean {
  return estado === 'guardado' || estado === 'reemplazado';
}
