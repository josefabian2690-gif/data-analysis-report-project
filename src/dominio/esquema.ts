/**
 * Un gasto. Objeto plano serializable (cadenas, números y `null`, sin `Date`) porque viaja
 * como JSON entre el cliente y el servidor; docs/ARQUITECTURA.md, «API del historial».
 */
export interface Transaccion {
  /** `TX` más seis dígitos, único dentro del mes. */
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
