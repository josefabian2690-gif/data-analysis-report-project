import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import indexHtml from '../../index.html?raw';
import { textos } from '../../src/cliente/textos';

it('la página abierta pide el historial al fetch del navegador y lista sus meses', async () => {
  const peticiones: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    peticiones.push(url);
    return new Response(JSON.stringify([{ mes: '2026-07', filas: 2000, total: 1689470.67 }]), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  document.body.innerHTML = new DOMParser().parseFromString(indexHtml, 'text/html').body.innerHTML;

  await import('../../src/cliente/main');
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: textos.vistas.historial }));

  expect(await screen.findByText('$1,689,470.67')).toBeVisible();
  expect(peticiones).toContain('/api/meses');
});
