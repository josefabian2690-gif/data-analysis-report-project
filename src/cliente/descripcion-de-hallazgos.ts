import { formatearFecha, formatearMonto, formatearProporcion } from '../dominio/formato';
import type { Hallazgo } from '../dominio/hallazgos';
import { formatearConteo, formatearRazon } from './presentacion';
import { textos } from './textos';

export function describirHallazgo(hallazgo: Hallazgo): string {
  const t = textos.hallazgos;
  switch (hallazgo.tipo) {
    case 'categoria-dominante':
      return t.categoriaDominante(
        hallazgo.categoria,
        formatearProporcion(hallazgo.proporcion),
        formatearMonto(hallazgo.monto),
      );
    case 'zona-favorita':
      return t.zonaFavorita(
        hallazgo.zona,
        formatearProporcion(hallazgo.proporcion),
        formatearMonto(hallazgo.monto),
      );
    case 'quincena':
      return t.quincena(
        formatearRazon(hallazgo.razon),
        formatearMonto(hallazgo.promedioQuincena),
        formatearMonto(hallazgo.promedioResto),
      );
    case 'fin-de-semana':
      return t.finDeSemana(
        formatearRazon(hallazgo.razon),
        formatearMonto(hallazgo.promedioFinDeSemana),
        formatearMonto(hallazgo.promedioResto),
      );
    case 'viaje':
      return t.viaje(
        hallazgo.destino,
        formatearFecha(hallazgo.desde),
        formatearFecha(hallazgo.hasta),
        formatearMonto(hallazgo.monto),
      );
    case 'atipicos':
      return t.atipicos(
        formatearConteo(hallazgo.transacciones.length),
        formatearMonto(hallazgo.transacciones[0]?.monto ?? 0),
      );
  }
}
