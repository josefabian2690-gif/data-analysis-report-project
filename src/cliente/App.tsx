import { useMemo, useRef, useState, type ChangeEvent } from 'react';

import { pideConfirmacion, type MotivoRechazo, type ResultadoCarga } from '../dominio/carga';
import type { Almacen } from './almacen-de-umbrales';
import { AvisoDeGuardado } from './AvisoDeGuardado';
import { leerArchivo, type EstadoDeCarga } from './cargar';
import { Confirmacion } from './Confirmacion';
import type { Descargar } from './descargar';
import { cambiaElHistorial, guardarMes, type EstadoDeGuardado } from './guardado';
import type { Historial } from './historial';
import { HistorialDeMeses } from './HistorialDeMeses';
import { useListado } from './listado';
import { recordarMeses } from './meses-pedidos';
import { Rechazo } from './Rechazo';
import { Tablero } from './Tablero';
import { textos } from './textos';
import { usarUmbrales } from './usar-umbrales';

type Pantalla =
  | { tipo: 'inicial' }
  | { tipo: 'rechazado'; motivo: MotivoRechazo }
  | { tipo: 'ilegible' }
  | { tipo: 'por-confirmar'; resultado: ResultadoCarga; eleccion: number }
  | {
      tipo: 'tablero';
      resultado: ResultadoCarga;
      eleccion: number;
      guardado: EstadoDeGuardado;
    };

type Vista = 'tablero' | 'historial';

const INICIAL: Pantalla = { tipo: 'inicial' };
const ILEGIBLE: Pantalla = { tipo: 'ilegible' };

function pantallaDe(carga: EstadoDeCarga, eleccion: number): Pantalla {
  if (carga.tipo === 'rechazado') return carga;
  const { resultado } = carga;
  return pideConfirmacion(resultado)
    ? { tipo: 'por-confirmar', resultado, eleccion }
    : { tipo: 'tablero', resultado, eleccion, guardado: 'guardando' };
}

export function App({
  historial,
  almacen,
  descargar,
}: {
  historial: Historial;
  almacen?: Almacen;
  descargar?: Descargar;
}) {
  const ajusteDeUmbrales = usarUmbrales(almacen);
  const [pantalla, setPantalla] = useState<Pantalla>(INICIAL);
  const [vista, setVista] = useState<Vista>('tablero');
  const { listado, recargar } = useListado(historial);
  const pedidos = useMemo(() => recordarMeses(historial), [historial]);
  const ultimaEleccion = useRef(0);

  async function guardar(resultado: ResultadoCarga, eleccion: number, reemplazar: boolean) {
    const guardado = await guardarMes(
      historial,
      resultado.mes,
      resultado.transacciones,
      reemplazar,
    );
    if (cambiaElHistorial(guardado)) {
      pedidos.olvidar(resultado.mes);
      recargar();
    }
    if (eleccion !== ultimaEleccion.current) return;
    setPantalla((actual) =>
      actual.tipo === 'tablero' && actual.eleccion === eleccion ? { ...actual, guardado } : actual,
    );
  }

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
    if (eleccion !== ultimaEleccion.current) return;
    setPantalla(siguiente);
    if (siguiente.tipo !== 'tablero') return;
    setVista('tablero');
    void guardar(siguiente.resultado, eleccion, false);
  }

  function reemplazarElGuardado() {
    if (pantalla.tipo !== 'tablero') return;
    setPantalla({ ...pantalla, guardado: 'guardando' });
    void guardar(pantalla.resultado, pantalla.eleccion, true);
  }

  function conservarElGuardado() {
    if (pantalla.tipo !== 'tablero') return;
    setPantalla({ ...pantalla, guardado: 'conservado' });
  }

  const hayGuardado = pantalla.tipo === 'tablero';

  return (
    <main>
      <h1>{textos.titulo}</h1>
      <label className="selector">
        {textos.elegirCsv}
        <input type="file" accept=".csv,text/csv" onChange={alElegir} />
      </label>
      <AvisoDeGuardado
        mes={hayGuardado ? pantalla.resultado.mes : null}
        estado={hayGuardado ? pantalla.guardado : null}
        alReemplazar={reemplazarElGuardado}
        alConservar={conservarElGuardado}
      />
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
          alConfirmar={() => {
            setPantalla({ ...pantalla, tipo: 'tablero', guardado: 'guardando' });
            setVista('tablero');
            void guardar(pantalla.resultado, pantalla.eleccion, false);
          }}
          alCancelar={() => setPantalla(INICIAL)}
        />
      )}
      <div role="group" aria-label={textos.vistas.nombre} className="vistas">
        {(['tablero', 'historial'] as const).map((destino) => (
          <button
            key={destino}
            type="button"
            aria-pressed={vista === destino}
            onClick={() => setVista(destino)}
          >
            {textos.vistas[destino]}
          </button>
        ))}
      </div>
      <div hidden={vista !== 'tablero'}>
        {pantalla.tipo === 'tablero' && (
          <Tablero
            key={pantalla.eleccion}
            resultado={pantalla.resultado}
            ajuste={ajusteDeUmbrales}
            descargar={descargar}
          />
        )}
      </div>
      <div hidden={vista !== 'historial'}>
        <HistorialDeMeses listado={listado} pedidos={pedidos} visible={vista === 'historial'} />
      </div>
    </main>
  );
}
