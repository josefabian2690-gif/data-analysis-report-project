import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, elegir } from './ayudas';
import {
  celdasDe,
  conceptosDe,
  csvDeGastos,
  filasDeDatos,
  gastosAlternados,
  ordenarPor,
  tablaDeTransacciones,
  paginaVisible,
} from './ayudas-tabla';

const { anterior, siguiente, columnas } = textos.tabla;

async function conGastos(cantidad: number) {
  render(<App />);
  const usuario = await elegir(csvDeGastos(gastosAlternados(cantidad)));
  const tabla = await tablaDeTransacciones();
  return { usuario, tabla };
}

function boton(nombre: string): HTMLElement {
  return screen.getByRole('button', { name: nombre });
}

describe('paginación de la tabla', () => {
  it('el fixture de 2 000 transacciones se muestra en páginas de 50 filas: página 1 de 40', async () => {
    render(<App />);
    await elegir(archivoCsv(semilla1));

    const tabla = await tablaDeTransacciones();

    expect(filasDeDatos(tabla)).toHaveLength(50);
    expect(paginaVisible(1, 40)).toBeInTheDocument();
  });

  it('la primera página trae 50 filas, no deja ir atrás y ofrece la siguiente', async () => {
    const { tabla } = await conGastos(120);

    expect(conceptosDe(tabla)[0]).toBe('Gasto 1');
    expect(filasDeDatos(tabla)).toHaveLength(50);
    expect(paginaVisible(1, 3)).toBeInTheDocument();
    expect(boton(anterior)).toBeDisabled();
    expect(boton(siguiente)).toBeEnabled();
  });

  it('Siguiente avanza de 50 en 50 hasta la última página, que trae el resto y no deja seguir', async () => {
    const { usuario, tabla } = await conGastos(120);

    await usuario.click(boton(siguiente));
    expect(paginaVisible(2, 3)).toBeInTheDocument();
    expect(conceptosDe(tabla)[0]).toBe('Gasto 51');
    expect(filasDeDatos(tabla)).toHaveLength(50);

    await usuario.click(boton(siguiente));
    expect(paginaVisible(3, 3)).toBeInTheDocument();
    expect(conceptosDe(tabla)[0]).toBe('Gasto 101');
    expect(filasDeDatos(tabla)).toHaveLength(20);
    expect(boton(siguiente)).toBeDisabled();
    expect(boton(anterior)).toBeEnabled();
  });

  it('Anterior regresa a la página previa', async () => {
    const { usuario, tabla } = await conGastos(120);
    await usuario.click(boton(siguiente));
    await usuario.click(boton(siguiente));

    await usuario.click(boton(anterior));

    expect(paginaVisible(2, 3)).toBeInTheDocument();
    expect(conceptosDe(tabla)[0]).toBe('Gasto 51');
  });

  it('con menos de 50 transacciones hay una sola página y no se puede navegar', async () => {
    await conGastos(3);

    expect(paginaVisible(1, 1)).toBeInTheDocument();
    expect(boton(anterior)).toBeDisabled();
    expect(boton(siguiente)).toBeDisabled();
  });

  it('al cambiar un filtro estando en la página 3 vuelve a la página 1 del nuevo conjunto', async () => {
    const { usuario, tabla } = await conGastos(120);
    await usuario.click(boton(siguiente));
    await usuario.click(boton(siguiente));
    expect(paginaVisible(3, 3)).toBeInTheDocument();

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    expect(paginaVisible(1, 2)).toBeInTheDocument();
    expect(filasDeDatos(tabla)).toHaveLength(50);
    expect(conceptosDe(tabla)[0]).toBe('Gasto 1');
  });

  it('al quitar los filtros estando en la última página del conjunto filtrado vuelve a la página 1', async () => {
    const { usuario, tabla } = await conGastos(120);
    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));
    await usuario.click(boton(siguiente));
    expect(paginaVisible(2, 2)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: textos.filtros.quitar }));

    expect(paginaVisible(1, 3)).toBeInTheDocument();
    expect(conceptosDe(tabla)[0]).toBe('Gasto 1');
  });

  it('al ordenar estando en otra página vuelve a la página 1 del nuevo orden', async () => {
    const { usuario, tabla } = await conGastos(120);
    await usuario.click(boton(siguiente));

    await ordenarPor(usuario, tabla, columnas.monto);

    expect(paginaVisible(1, 3)).toBeInTheDocument();
    expect(celdasDe(filasDeDatos(tabla)[0]!)[5]).toBe('$120.00');
  });
});
