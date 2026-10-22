import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import { textos } from '../../src/cliente/textos';

it('al abrir la página, la pestaña y el encabezado llevan el título del catálogo', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(indexHtml, 'text/html').body.innerHTML;

  await import('../../src/cliente/main');

  expect(document.title).toBe(textos.titulo);
  expect(await screen.findByRole('heading', { name: textos.titulo })).toBeInTheDocument();
});
