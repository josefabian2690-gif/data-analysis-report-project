import { useId } from 'react';

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
  const id = useId();
  const pregunta = estado === 'pregunta';
  const mensaje =
    mes === null || estado === null ? null : textos.guardado[estado](formatearMes(mes));
  return (
    <section
      aria-labelledby={pregunta ? id : undefined}
      className={pregunta ? 'confirmacion' : undefined}
    >
      {pregunta && <h2 id={id}>{textos.guardado.tituloDeLaPregunta}</h2>}
      <p role="status" aria-label={textos.guardado.region} className="aviso-guardado">
        {mensaje}
      </p>
      {pregunta && (
        <div className="acciones">
          <button type="button" onClick={alReemplazar}>
            {textos.guardado.reemplazar}
          </button>
          <button type="button" className="secundario" onClick={alConservar}>
            {textos.guardado.conservar}
          </button>
        </div>
      )}
    </section>
  );
}
