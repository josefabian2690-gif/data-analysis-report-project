import type { MotivoRechazo } from '../dominio/carga';
import { textos } from './textos';

function textoDelRechazo(motivo: MotivoRechazo): string {
  if (motivo.codigo === 'faltan-columnas')
    return textos.rechazo['faltan-columnas'](motivo.columnas);
  return textos.rechazo[motivo.codigo];
}

export function Rechazo({ motivo }: { motivo: MotivoRechazo }) {
  return (
    <p role="alert" className="rechazo">
      {textoDelRechazo(motivo)}
    </p>
  );
}
