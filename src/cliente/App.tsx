import { useState, type ChangeEvent } from 'react';

import { pideConfirmacion, type MotivoRechazo, type ResultadoCarga } from '../dominio/carga';
import { leerArchivo } from './cargar';
import { Confirmacion } from './Confirmacion';
import { Rechazo } from './Rechazo';
import { Tablero } from './Tablero';
import { textos } from './textos';

type Pantalla =
  | { tipo: 'inicial' }
  | { tipo: 'rechazado'; motivo: MotivoRechazo }
  | { tipo: 'por-confirmar'; resultado: ResultadoCarga }
  | { tipo: 'tablero'; resultado: ResultadoCarga };

const INICIAL: Pantalla = { tipo: 'inicial' };

function pantallaDe(carga: Awaited<ReturnType<typeof leerArchivo>>): Pantalla {
  if (carga.tipo === 'rechazado') return carga;
  const { resultado } = carga;
  return { tipo: pideConfirmacion(resultado) ? 'por-confirmar' : 'tablero', resultado };
}

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>(INICIAL);

  async function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const entrada = evento.currentTarget;
    const archivo = entrada.files?.[0];
    // Vaciar el valor deja elegir el mismo archivo otra vez: sin eso el navegador no dispara el cambio.
    entrada.value = '';
    if (archivo === undefined) return;
    setPantalla(pantallaDe(await leerArchivo(archivo)));
  }

  return (
    <main>
      <h1>{textos.titulo}</h1>
      <label className="selector">
        {textos.elegirCsv}
        <input type="file" accept=".csv,text/csv" onChange={alElegir} />
      </label>
      {pantalla.tipo === 'rechazado' && <Rechazo motivo={pantalla.motivo} />}
      {pantalla.tipo === 'por-confirmar' && (
        <Confirmacion
          invalidas={pantalla.resultado.invalidas.length}
          validas={pantalla.resultado.transacciones.length}
          alConfirmar={() => setPantalla({ tipo: 'tablero', resultado: pantalla.resultado })}
          alCancelar={() => setPantalla(INICIAL)}
        />
      )}
      {pantalla.tipo === 'tablero' && <Tablero resultado={pantalla.resultado} />}
    </main>
  );
}
