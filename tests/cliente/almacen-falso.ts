import type { Almacen } from '../../src/cliente/almacen-de-umbrales';

export interface AlmacenFalso extends Almacen {
  readonly contenido: Map<string, string>;
  /** Cada valor escrito con `setItem`, en orden. */
  readonly escrituras: string[];
}

/** Un almacén en memoria con la forma de lectura y escritura del almacén del navegador. */
export function crearAlmacenFalso(inicial: Record<string, string> = {}): AlmacenFalso {
  const contenido = new Map(Object.entries(inicial));
  const escrituras: string[] = [];
  return {
    contenido,
    escrituras,
    getItem: (clave) => contenido.get(clave) ?? null,
    setItem: (clave, valor) => {
      escrituras.push(valor);
      contenido.set(clave, valor);
    },
  };
}

/** Un almacén cuyo acceso falla como el de un navegador en modo privado o con la cuota llena. */
export function crearAlmacenQueLanza(): Almacen {
  return {
    getItem: () => {
      throw new DOMException('acceso bloqueado', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('cuota llena', 'QuotaExceededError');
    },
  };
}
