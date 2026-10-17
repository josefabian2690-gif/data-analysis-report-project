import type { Historial, MesListado, ResultadoDeGuardado } from '../../src/cliente/historial';
import { leerMesGuardado, type Transaccion } from '../../src/dominio/esquema';

export interface IntentoDeGuardado {
  mes: string;
  reemplazar: boolean;
}

/**
 * Un historial en memoria que responde como la API de docs/ARQUITECTURA.md («API del historial»):
 * 409 (`existe`) si el mes ya está y no se pidió reemplazarlo, lista en orden cronológico y
 * rechazo de lo que el esquema del dominio no admite.
 */
export interface HistorialFalso extends Historial {
  /** Lo que el «servidor» tiene guardado, por mes. */
  readonly guardados: Map<string, Transaccion[]>;
  /** Cada llamada a `guardar`, en orden. */
  readonly intentos: IntentoDeGuardado[];
  /** Mientras sea `true`, la operación se rechaza como una red caída. */
  fallar: { listar: boolean; guardar: boolean };
  /** El próximo `guardar` de ese mes se aplica al instante, pero no responde hasta llamar a la función devuelta. */
  retenerRespuestaDeGuardar(mes: string): () => void;
}

export function crearHistorialFalso(
  inicial: Record<string, readonly Transaccion[]> = {},
): HistorialFalso {
  const guardados = new Map<string, Transaccion[]>(
    Object.entries(inicial).map(([mes, transacciones]) => [mes, [...transacciones]]),
  );
  const retenidas = new Map<string, Promise<void>>();
  const intentos: IntentoDeGuardado[] = [];
  const falso: HistorialFalso = {
    guardados,
    intentos,
    fallar: { listar: false, guardar: false },

    retenerRespuestaDeGuardar(mes) {
      let liberar: () => void = () => undefined;
      retenidas.set(
        mes,
        new Promise<void>((resolver) => {
          liberar = resolver;
        }),
      );
      return liberar;
    },

    async listar() {
      if (falso.fallar.listar) throw new TypeError('Failed to fetch');
      const meses: MesListado[] = [...guardados.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, transacciones]) => ({
          mes,
          filas: transacciones.length,
          total: transacciones.reduce((suma, { monto }) => suma + monto, 0),
        }));
      return meses;
    },

    async obtener(mes) {
      const transacciones = guardados.get(mes);
      return transacciones === undefined ? undefined : [...transacciones];
    },

    async guardar(mes, transacciones, { reemplazar = false }): Promise<ResultadoDeGuardado> {
      intentos.push({ mes, reemplazar });
      if (falso.fallar.guardar) throw new TypeError('Failed to fetch');
      const valido = leerMesGuardado(mes, transacciones);
      if (!valido.ok) throw new Error(`El historial respondió 400: ${valido.motivo}.`);
      const resultado = aplicar(mes, valido.transacciones, reemplazar);
      const retenida = retenidas.get(mes);
      retenidas.delete(mes);
      await retenida;
      return resultado;
    },
  };

  function aplicar(
    mes: string,
    transacciones: Transaccion[],
    reemplazar: boolean,
  ): ResultadoDeGuardado {
    const existia = guardados.has(mes);
    if (existia && !reemplazar) return 'existe';
    guardados.set(mes, [...transacciones]);
    return existia ? 'reemplazado' : 'creado';
  }

  return falso;
}
