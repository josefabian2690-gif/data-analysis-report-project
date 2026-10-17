import { leerFecha } from './fecha';

/**
 * Un gasto. Objeto plano serializable (cadenas, números y `null`, sin `Date`) porque viaja
 * como JSON entre el cliente y el servidor; docs/ARQUITECTURA.md, «API del historial».
 */
export interface Transaccion {
  /**
   * Único dentro del mes. El del archivo se conserva tal cual; si la fila no trae id, el generado
   * es `TX` más seis dígitos (R-02).
   */
  id: string;
  /** Día en `AAAA-MM-DD`. */
  dia: string;
  /** Hora en `HH:MM:SS`; `null` cuando la fecha del CSV no traía hora (R-03). */
  hora: string | null;
  /** MXN, mayor que 0, con todos sus decimales (R-04). */
  monto: number;
  concepto: string;
  categoria: string;
  cuenta: string;
  zona: string;
  /** Las dos coordenadas vienen juntas o ninguna (R-07). */
  latitud: number | null;
  longitud: number | null;
}

/** Valores que R-02 pone cuando la columna opcional falta o su celda está vacía. */
export const VALORES_POR_DEFECTO = {
  categoria: 'Sin categoría',
  cuenta: 'Sin cuenta',
  zona: 'Sin zona',
} as const;

const CAMPOS_DE_TRANSACCION: Record<keyof Transaccion, true> = {
  id: true,
  dia: true,
  hora: true,
  monto: true,
  concepto: true,
  categoria: true,
  cuenta: true,
  zona: true,
  latitud: true,
  longitud: true,
};
const CAMPOS: readonly string[] = Object.keys(CAMPOS_DE_TRANSACCION);
const MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const LATITUD_MAXIMA = 90;
const LONGITUD_MAXIMA = 180;

export type MesGuardado =
  { ok: true; transacciones: Transaccion[] } | { ok: false; motivo: string };

/** `AAAA-MM` con el mes de 01 a 12; así `:mes` nunca contiene separadores de ruta. */
export function esMes(texto: string): boolean {
  return MES.test(texto);
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTextoNoVacio(valor: unknown): boolean {
  return typeof valor === 'string' && valor !== '';
}

function esNumeroFinito(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

function motivoDeCamposDeMas(registro: Record<string, unknown>): string | null {
  const sobran = Object.keys(registro).filter((clave) => !CAMPOS.includes(clave));
  return sobran.length > 0 ? `trae campos de más: ${sobran.join(', ')}` : null;
}

function motivoDeTextos(registro: Record<string, unknown>): string | null {
  if (!esTextoNoVacio(registro['id'])) return 'su id debe ser un texto no vacío';
  if (!esTextoNoVacio(registro['concepto'])) return 'su concepto debe ser un texto no vacío';
  const sinTexto = ['categoria', 'cuenta', 'zona'].find((c) => typeof registro[c] !== 'string');
  return sinTexto === undefined ? null : `su ${sinTexto} debe ser un texto`;
}

function motivoDeMonto(monto: unknown): string | null {
  return esNumeroFinito(monto) && monto > 0 ? null : 'su monto debe ser un número mayor que 0';
}

function motivoDeFechaYHora(registro: Record<string, unknown>, mes: string): string | null {
  const { dia, hora } = registro;
  if (typeof dia !== 'string' || leerFecha(dia)?.dia !== dia) {
    return 'su día debe tener la forma AAAA-MM-DD y existir';
  }
  if (dia.slice(0, 7) !== mes) return `su día ${dia} no es del mes ${mes}`;
  if (hora === null) return null;
  const valida = typeof hora === 'string' && leerFecha(`${dia} ${hora}`)?.hora === hora;
  return valida ? null : 'su hora debe ser null o HH:MM:SS válida';
}

function motivoDeCoordenadas(registro: Record<string, unknown>): string | null {
  const { latitud, longitud } = registro;
  if (latitud === null && longitud === null) return null;
  if (!esNumeroFinito(latitud) || !esNumeroFinito(longitud)) {
    return 'sus coordenadas deben venir juntas, ambas números o ambas null';
  }
  const dentro = Math.abs(latitud) <= LATITUD_MAXIMA && Math.abs(longitud) <= LONGITUD_MAXIMA;
  return dentro ? null : 'sus coordenadas están fuera de rango';
}

function motivoDeTransaccion(valor: unknown, mes: string): string | null {
  if (!esRegistro(valor)) return 'no es un objeto';
  return (
    motivoDeCamposDeMas(valor) ??
    motivoDeTextos(valor) ??
    motivoDeMonto(valor['monto']) ??
    motivoDeFechaYHora(valor, mes) ??
    motivoDeCoordenadas(valor)
  );
}

function idRepetido(lista: unknown[]): string | undefined {
  const vistos = new Set<unknown>();
  for (const elemento of lista) {
    const id = (elemento as Record<string, unknown>)['id'];
    if (vistos.has(id)) return String(id);
    vistos.add(id);
  }
  return undefined;
}

/**
 * Valida lo que viaja por la API del historial: una lista no vacía de transacciones del mes
 * `mes`, con exactamente los campos de `Transaccion` y ids sin repetir (docs/ARQUITECTURA.md,
 * «API del historial»).
 */
export function leerMesGuardado(mes: string, valor: unknown): MesGuardado {
  if (!Array.isArray(valor)) return { ok: false, motivo: 'el cuerpo debe ser una lista' };
  if (valor.length === 0) return { ok: false, motivo: 'la lista no puede estar vacía' };
  for (const [posicion, elemento] of valor.entries()) {
    const motivo = motivoDeTransaccion(elemento, mes);
    if (motivo !== null) return { ok: false, motivo: `la transacción ${posicion + 1}: ${motivo}` };
  }
  const repetido = idRepetido(valor);
  if (repetido !== undefined) return { ok: false, motivo: `el id ${repetido} está repetido` };
  return { ok: true, transacciones: valor as Transaccion[] };
}
