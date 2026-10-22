import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import indexHtml from '../../index.html?raw';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv } from './ayudas';
import { marcaDeHallazgo } from './ayudas-hallazgos';

const control = textos.hallazgos.umbrales.controles.categoriaDominante;

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', () => Promise.reject(new TypeError('sin servidor del historial')));
  document.body.innerHTML = new DOMParser().parseFromString(indexHtml, 'text/html').body.innerHTML;
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

async function ponerLaDominanteEn50() {
  const usuario = userEvent.setup();
  await usuario.upload(await screen.findByLabelText(textos.elegirCsv), archivoCsv(semilla1));
  const campo = await screen.findByRole('textbox', { name: control });
  await usuario.clear(campo);
  await usuario.paste('50');
  return campo;
}

it('la página real conserva los umbrales en el localStorage del navegador', async () => {
  window.localStorage.clear();
  await import('../../src/cliente/main');

  await ponerLaDominanteEn50();

  const guardado = JSON.parse(window.localStorage.getItem('tablero-gastos:umbrales') ?? 'null');
  expect(guardado.categoriaDominante).toBe(0.5);
});

it('si acceder a localStorage lanza, la página abre y los umbrales funcionan en memoria', async () => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('acceso bloqueado', 'SecurityError');
  });
  await import('../../src/cliente/main');

  const usuario = userEvent.setup();
  await usuario.upload(await screen.findByLabelText(textos.elegirCsv), archivoCsv(semilla1));
  await screen.findByText(marcaDeHallazgo('categoriaDominante'), { exact: false });

  const campo = await ponerLaDominanteEn50();

  expect(campo).toHaveValue('50');
  expect(screen.queryByText(marcaDeHallazgo('categoriaDominante'), { exact: false })).toBeNull();
});
