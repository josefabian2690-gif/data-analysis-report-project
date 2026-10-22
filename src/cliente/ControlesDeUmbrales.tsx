import { useId, useState } from 'react';

import { leerUmbral, UMBRALES_POR_DEFECTO, type Umbrales } from '../dominio/hallazgos';
import { textos } from './textos';

type Clave = keyof Umbrales;

const CLAVES = Object.keys(UMBRALES_POR_DEFECTO) as Clave[];

/** La dominante se muestra en % aunque `Umbrales` la guarde como proporción. */
function textoDe(clave: Clave, valor: number): string {
  return String(clave === 'categoriaDominante' ? Number((valor * 100).toFixed(4)) : valor);
}

function textosDe(umbrales: Umbrales): Record<Clave, string> {
  return Object.fromEntries(
    CLAVES.map((clave) => [clave, textoDe(clave, umbrales[clave])]),
  ) as Record<Clave, string>;
}

interface Props {
  umbrales: Umbrales;
  alCambiar: (clave: Clave, valor: number) => void;
  alRestablecer: () => void;
}

export function ControlesDeUmbrales({ umbrales, alCambiar, alRestablecer }: Props) {
  const id = useId();
  const [escritos, setEscritos] = useState(() => textosDe(umbrales));
  const [invalidos, setInvalidos] = useState<ReadonlySet<Clave>>(new Set());
  const t = textos.hallazgos.umbrales;

  function escribir(clave: Clave, texto: string) {
    setEscritos((actual) => ({ ...actual, [clave]: texto }));
    const lectura = leerUmbral(clave, texto);
    setInvalidos((actual) => {
      const siguiente = new Set(actual);
      if (lectura.valido) siguiente.delete(clave);
      else siguiente.add(clave);
      return siguiente;
    });
    if (lectura.valido) alCambiar(clave, lectura.valor);
  }

  function restablecer() {
    setEscritos(textosDe(UMBRALES_POR_DEFECTO));
    setInvalidos(new Set());
    alRestablecer();
  }

  return (
    <div role="group" aria-label={t.nombre} className="umbrales">
      {CLAVES.map((clave) => {
        const invalido = invalidos.has(clave);
        const idMensaje = `${id}-${clave}`;
        return (
          <div key={clave} className="umbral">
            <label htmlFor={`${id}-campo-${clave}`}>{t.controles[clave]}</label>
            <input
              id={`${id}-campo-${clave}`}
              type="text"
              inputMode="decimal"
              value={escritos[clave]}
              aria-invalid={invalido}
              aria-describedby={invalido ? idMensaje : undefined}
              onChange={(evento) => escribir(clave, evento.currentTarget.value)}
            />
            {invalido && (
              <span id={idMensaje} className="umbral-invalido">
                {clave === 'categoriaDominante' ? t.invalido.porcentaje : t.invalido.numero}
              </span>
            )}
          </div>
        );
      })}
      <button type="button" className="quitar-filtros" onClick={restablecer}>
        {t.restablecer}
      </button>
    </div>
  );
}
