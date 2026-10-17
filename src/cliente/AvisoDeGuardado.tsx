import type { EstadoDeGuardado } from './guardado';
import { formatearMes } from './presentacion';
import { textos } from './textos';

interface AvisoDeGuardadoProps {
  mes: string | null;
  estado: EstadoDeGuardado | null;
  alReemplazar: () => void;
  alConservar: () => void;
}

export function AvisoDeGuardado({ mes, estado, alReemplazar, alConservar }: AvisoDeGuardadoProps) {
  const mensaje =
    mes === null || estado === null ? null : textos.guardado[estado](formatearMes(mes));
  return (
    <>
      <p role="status" aria-label={textos.guardado.region} className="aviso-guardado">
        {mensaje}
      </p>
      {estado === 'pregunta' && (
        <div className="acciones">
          <button type="button" onClick={alReemplazar}>
            {textos.guardado.reemplazar}
          </button>
          <button type="button" className="secundario" onClick={alConservar}>
            {textos.guardado.conservar}
          </button>
        </div>
      )}
    </>
  );
}
