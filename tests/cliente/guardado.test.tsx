import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import type { Transaccion } from '../../src/dominio/esquema';
import invalidas from '../fixtures/a-mano/invalidas.csv?raw';
import { archivoCsv, csv, elegir, gastosDeAgosto, gastosDeJulio, hayTablero } from './ayudas';
import { crearHistorialFalso } from './historial-falso';

const ENCABEZADO = 'fecha,monto,concepto';

const JULIO_GUARDADO: Transaccion = {
  id: 'TX900001',
  dia: '2026-07-20',
  hora: '09:00:00',
  monto: 99,
  concepto: 'Versión guardada antes',
  categoria: 'Sin categoría',
  cuenta: 'Sin cuenta',
  zona: 'Sin zona',
  latitud: null,
  longitud: null,
};

function julio(n = 3): File {
  return archivoCsv(csv(ENCABEZADO, gastosDeJulio(n)));
}

function agosto(n = 2): File {
  return archivoCsv(csv(ENCABEZADO, gastosDeAgosto(n)));
}

function avisoDeGuardado(): HTMLElement {
  return screen.getByRole('status', { name: textos.guardado.region });
}

async function esperarAviso(texto: string) {
  await waitFor(() => expect(avisoDeGuardado()).toHaveTextContent(texto));
}

describe('guardar el mes al cargarlo (R-09)', () => {
  it('R-09: un mes que no estaba guardado se guarda con todas sus transacciones y se anuncia con su nombre', async () => {
    const historial = crearHistorialFalso();
    render(<App historial={historial} />);

    await elegir(julio(3));

    await esperarAviso(textos.guardado.guardado('julio de 2026'));
    expect(historial.guardados.get('2026-07')?.map(({ concepto }) => concepto)).toEqual([
      'Gasto 1',
      'Gasto 2',
      'Gasto 3',
    ]);
    expect(hayTablero()).toBe(true);
  });

  it('R-09: una carga aceptada hace exactamente un guardado, también bajo StrictMode', async () => {
    const historial = crearHistorialFalso();
    render(
      <StrictMode>
        <App historial={historial} />
      </StrictMode>,
    );

    await elegir(julio());

    await esperarAviso(textos.guardado.guardado('julio de 2026'));
    expect(historial.intentos).toEqual([{ mes: '2026-07', reemplazar: false }]);
  });

  it('R-09: con la confirmación de R-05 no se guarda nada hasta que el analista confirma', async () => {
    const historial = crearHistorialFalso();
    render(<App historial={historial} />);
    const usuario = await elegir(archivoCsv(invalidas));
    const confirmar = await screen.findByRole('button', { name: textos.confirmacion.confirmar });
    expect(historial.intentos).toEqual([]);

    await usuario.click(confirmar);

    await esperarAviso(textos.guardado.guardado('julio de 2026'));
    expect(historial.intentos).toEqual([{ mes: '2026-07', reemplazar: false }]);
    expect(historial.guardados.get('2026-07')).toHaveLength(4);
  });

  it('R-09: cancelar la confirmación de R-05 no guarda nada ni anuncia un guardado', async () => {
    const historial = crearHistorialFalso();
    render(<App historial={historial} />);
    const usuario = await elegir(archivoCsv(invalidas));

    await usuario.click(await screen.findByRole('button', { name: textos.confirmacion.cancelar }));

    expect(historial.intentos).toEqual([]);
    expect(historial.guardados.size).toBe(0);
    expect(avisoDeGuardado()).toBeEmptyDOMElement();
  });
});

describe('un mes que ya está guardado (R-09)', () => {
  it('R-09: pregunta si se reemplaza nombrando el mes, con el tablero visible y sin tocar lo guardado', async () => {
    const historial = crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] });
    render(<App historial={historial} />);

    await elegir(julio(3));

    await esperarAviso(textos.guardado.pregunta('julio de 2026'));
    expect(screen.getByRole('button', { name: textos.guardado.reemplazar })).toBeVisible();
    expect(screen.getByRole('button', { name: textos.guardado.conservar })).toBeVisible();
    expect(hayTablero()).toBe(true);
    expect(historial.guardados.get('2026-07')).toEqual([JULIO_GUARDADO]);
  });

  it('R-09: «Reemplazar» guarda la versión nueva pidiendo reemplazo y lo anuncia', async () => {
    const historial = crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] });
    render(<App historial={historial} />);
    const usuario = await elegir(julio(3));

    await usuario.click(await screen.findByRole('button', { name: textos.guardado.reemplazar }));

    await esperarAviso(textos.guardado.reemplazado('julio de 2026'));
    expect(historial.guardados.get('2026-07')?.map(({ concepto }) => concepto)).toEqual([
      'Gasto 1',
      'Gasto 2',
      'Gasto 3',
    ]);
    expect(historial.intentos).toEqual([
      { mes: '2026-07', reemplazar: false },
      { mes: '2026-07', reemplazar: true },
    ]);
    expect(screen.queryByRole('button', { name: textos.guardado.reemplazar })).toBeNull();
    expect(hayTablero()).toBe(true);
  });

  it('R-09: «Conservar el guardado» deja intacto lo guardado, no guarda y lo anuncia', async () => {
    const historial = crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] });
    render(<App historial={historial} />);
    const usuario = await elegir(julio(3));

    await usuario.click(await screen.findByRole('button', { name: textos.guardado.conservar }));

    await esperarAviso(textos.guardado.conservado('julio de 2026'));
    expect(historial.guardados.get('2026-07')).toEqual([JULIO_GUARDADO]);
    expect(historial.intentos).toEqual([{ mes: '2026-07', reemplazar: false }]);
    expect(screen.queryByRole('button', { name: textos.guardado.reemplazar })).toBeNull();
    expect(hayTablero()).toBe(true);
  });
});

describe('cuando el guardado falla', () => {
  it('un servidor caído anuncia que no se pudo guardar, deja el tablero y no dice que el archivo es ilegible', async () => {
    const historial = crearHistorialFalso();
    historial.fallar.guardar = true;
    render(<App historial={historial} />);

    await elegir(julio(3));

    await esperarAviso(textos.guardado.fallido('julio de 2026'));
    expect(hayTablero()).toBe(true);
    expect(screen.queryByText(textos.lecturaFallida)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('dos elecciones seguidas con el guardado en vuelo', () => {
  it('la respuesta del guardado del primer archivo no cambia lo que se anuncia del segundo', async () => {
    const historial = crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] });
    const responderJulio = historial.retenerRespuestaDeGuardar('2026-07');
    render(<App historial={historial} />);
    await elegir(julio(3));
    await waitFor(() => expect(historial.intentos).toHaveLength(1));

    await elegir(agosto(2));
    await esperarAviso(textos.guardado.guardado('agosto de 2026'));
    await act(async () => responderJulio());

    expect(avisoDeGuardado()).toHaveTextContent(textos.guardado.guardado('agosto de 2026'));
    expect(screen.queryByRole('button', { name: textos.guardado.reemplazar })).toBeNull();
  });

  it('la respuesta del guardado del primer archivo tampoco cambia nada mientras el segundo aún se está leyendo', async () => {
    const historial = crearHistorialFalso({ '2026-07': [JULIO_GUARDADO] });
    const responderJulio = historial.retenerRespuestaDeGuardar('2026-07');
    render(<App historial={historial} />);
    await elegir(julio(3));
    await waitFor(() => expect(historial.intentos).toHaveLength(1));
    const lento = Object.assign(agosto(2), { text: () => new Promise<string>(() => undefined) });

    await elegir(lento);
    await act(async () => responderJulio());

    expect(avisoDeGuardado()).toHaveTextContent(textos.guardado.guardando('julio de 2026'));
    expect(screen.queryByRole('button', { name: textos.guardado.reemplazar })).toBeNull();
  });
});
