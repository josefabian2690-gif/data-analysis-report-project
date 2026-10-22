import type { Transaccion } from '../dominio/esquema';
import type { Historial } from './historial';

export interface MesesPedidos {
  obtener(mes: string): Promise<Transaccion[] | undefined>;
  olvidar(mes: string): void;
}

export function recordarMeses(historial: Pick<Historial, 'obtener'>): MesesPedidos {
  const pedidos = new Map<string, Promise<Transaccion[] | undefined>>();

  return {
    obtener(mes) {
      const recordado = pedidos.get(mes);
      if (recordado !== undefined) return recordado;
      const pedido = historial.obtener(mes);
      pedidos.set(mes, pedido);
      pedido.catch(() => {
        if (pedidos.get(mes) === pedido) pedidos.delete(mes);
      });
      return pedido;
    },

    olvidar(mes) {
      pedidos.delete(mes);
    },
  };
}
