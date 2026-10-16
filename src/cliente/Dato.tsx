import { useId } from 'react';

interface DatoProps {
  etiqueta: string;
  valor: string;
}

export function Dato({ etiqueta, valor }: DatoProps) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="dato">
      <span id={id} className="dato-etiqueta">
        {etiqueta}
      </span>
      <strong className="dato-valor">{valor}</strong>
    </div>
  );
}
