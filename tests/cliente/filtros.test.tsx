import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import { elegir } from './ayudas';
import { casillasDe, diasOfrecidos, gastosDeJulioConDimensiones } from './ayudas-filtros';

const DIAS_DE_JULIO = Array.from(
  { length: 31 },
  (_, i) => `${String(i + 1).padStart(2, '0')}/07/2026`,
);

describe('panel de filtros', () => {
  it('ofrece el inicio y el fin del periodo con los días del mes en dd/mm/aaaa', async () => {
    render(<App />);

    await elegir(gastosDeJulioConDimensiones());

    await screen.findByRole('combobox', { name: textos.filtros.desde });
    expect(diasOfrecidos(textos.filtros.desde)).toEqual([
      textos.filtros.sinLimite,
      ...DIAS_DE_JULIO,
    ]);
    expect(diasOfrecidos(textos.filtros.hasta)).toEqual([
      textos.filtros.sinLimite,
      ...DIAS_DE_JULIO,
    ]);
  });

  it('ofrece una casilla por categoría, cuenta y zona del mes, ordenadas por nombre', async () => {
    render(<App />);

    await elegir(gastosDeJulioConDimensiones());

    await screen.findByRole('group', { name: textos.filtros.categorias });
    expect(casillasDe(textos.filtros.categorias)).toEqual(['Comida', 'Hogar', 'Ocio']);
    expect(casillasDe(textos.filtros.cuentas)).toEqual(['Crédito', 'Débito']);
    expect(casillasDe(textos.filtros.zonas)).toEqual(['Centro', 'Roma']);
  });

  it('tras marcar una categoría siguen ofreciéndose todas las opciones del mes', async () => {
    render(<App />);
    const usuario = await elegir(gastosDeJulioConDimensiones());

    await usuario.click(await screen.findByRole('checkbox', { name: 'Comida' }));

    expect(casillasDe(textos.filtros.categorias)).toEqual(['Comida', 'Hogar', 'Ocio']);
    expect(casillasDe(textos.filtros.cuentas)).toEqual(['Crédito', 'Débito']);
    expect(casillasDe(textos.filtros.zonas)).toEqual(['Centro', 'Roma']);
  });
});
