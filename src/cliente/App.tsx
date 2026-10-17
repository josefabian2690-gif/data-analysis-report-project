import { useRef, useState, type ChangeEvent } from 'react';

import { pideConfirmacion, type MotivoRechazo, type ResultadoCarga } from '../dominio/carga';
import { leerArchivo, type EstadoDeCarga } from './cargar';
import { Confirmacion } from './Confirmacion';
import { Rechazo } from './Rechazo';
import { Tablero } from './Tablero';
import { textos } from './textos';

type Pantalla =
  | { tipo: 'inicial' }
  | { tipo: 'rechazado'; motivo: MotivoRechazo }
  | { tipo: 'ilegible' }
  | { tipo: 'por-confirmar'; resultado: ResultadoCarga; eleccion: number }
  | { tipo: 'tablero'; resultado: ResultadoCarga; eleccion: number };

const INICIAL: Pantalla = { tipo: 'inicial' };
const ILEGIBLE: Pantalla = { tipo: 'ilegible' };

function pantallaDe(carga: EstadoDeCarga, eleccion: number): Pantalla {
  if (carga.tipo === 'rechazado') return carga;
  const { resultado } = carga;
  return { tipo: pideConfirmacion(resultado) ? 'por-confirmar' : 'tablero', resultado, eleccion };
}

export function App() {
  const [pantalla, setPantalla] = useState<Pantalla>(INICIAL);
  const ultimaEleccion = useRef(0);

  async function alElegir(evento: ChangeEvent<HTMLInputElement>) {
    const entrada = evento.currentTarget;
    const archivo = entrada.files?.[0];
    // Vaciar el valor deja elegir el mismo archivo otra vez: sin eso el navegador no dispara el cambio.
    entrada.value = '';
    if (archivo === undefined) return;
    const eleccion = ++ultimaEleccion.current;
    const siguiente = await leerArchivo(archivo).then(
      (carga) => pantallaDe(carga, eleccion),
      () => ILEGIBLE,
    );
    if (eleccion === ultimaEleccion.current) setPantalla(siguiente);
  }

  return (
    <main>
      <h1>{textos.titulo}</h1>
      <label className="selector">
        {textos.elegirCsv}
        <input type="file" accept=".csv,text/csv" onChange={alElegir} />
      </label>
      {pantalla.tipo === 'rechazado' && <Rechazo motivo={pantalla.motivo} />}
      {pantalla.tipo === 'ilegible' && (
        <p role="alert" className="rechazo">
          {textos.lecturaFallida}
        </p>
      )}
      {pantalla.tipo === 'por-confirmar' && (
        <Confirmacion
          invalidas={pantalla.resultado.invalidas.length}
          validas={pantalla.resultado.transacciones.length}
          alConfirmar={() => setPantalla({ ...pantalla, tipo: 'tablero' })}
          alCancelar={() => setPantalla(INICIAL)}
        />
      )}
      {pantalla.tipo === 'tablero' && (
        <Tablero key={pantalla.eleccion} resultado={pantalla.resultado} />
      )}
    </main>
  );
}
