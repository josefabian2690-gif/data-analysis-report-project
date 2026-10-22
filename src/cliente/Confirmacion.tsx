import { useId } from 'react';

import { formatearProporcion } from '../dominio/formato';
import { textos } from './textos';

interface ConfirmacionProps {
  invalidas: number;
  validas: number;
  alConfirmar: () => void;
  alCancelar: () => void;
}

export function Confirmacion({ invalidas, validas, alConfirmar, alCancelar }: ConfirmacionProps) {
  const id = useId();
  const proporcion = formatearProporcion(invalidas / (invalidas + validas));
  return (
    <section aria-labelledby={id} className="confirmacion">
      <h2 id={id}>{textos.confirmacion.titulo}</h2>
      <p>{textos.confirmacion.aviso(proporcion)}</p>
      <div className="acciones">
        <button type="button" onClick={alConfirmar}>
          {textos.confirmacion.confirmar}
        </button>
        <button type="button" className="secundario" onClick={alCancelar}>
          {textos.confirmacion.cancelar}
        </button>
      </div>
    </section>
  );
}
