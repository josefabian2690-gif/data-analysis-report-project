import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, elegir } from './ayudas';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';

const { graficas } = textos;

const NOMBRES = [
  graficas.porDia.nombre,
  graficas.porDiaDeLaSemana.nombre,
  graficas.porHora.nombre,
  graficas.porZona.nombre,
  graficas.porCuenta.nombre,
];

function grafica(nombre: string): Promise<HTMLElement> {
  return screen.findByRole('img', { name: new RegExp(`^${nombre}`) });
}

async function descripcionDe(nombre: string): Promise<string> {
  return (await grafica(nombre)).getAttribute('aria-label') ?? '';
}

async function conLaSemilla() {
  render(<App />);
  await elegir(archivoCsv(semilla1));
}

describe('las gráficas del mes', () => {
  it('cada una tiene su título y su descripción accesible, además de la de categoría', async () => {
    await conLaSemilla();

    for (const nombre of NOMBRES) await grafica(nombre);
    const titulos = [
      graficas.porDia.titulo,
      graficas.porDiaDeLaSemana.titulo,
      graficas.porHora.titulo,
      graficas.porZona.titulo,
      graficas.porCuenta.titulo,
    ];
    for (const titulo of titulos) {
      expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img', { name: /^Gráfico/ })).toHaveLength(6);
  });

  it('van tras el gasto por categoría y antes de la tabla, en el orden por día, día de la semana, hora, zona y cuenta', async () => {
    await conLaSemilla();
    await grafica(graficas.porCuenta.nombre);

    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

    expect(titulos.slice(titulos.indexOf(textos.categorias.titulo))).toEqual([
      textos.categorias.titulo,
      graficas.porDia.titulo,
      graficas.porDiaDeLaSemana.titulo,
      graficas.porHora.titulo,
      graficas.porZona.titulo,
      graficas.porCuenta.titulo,
      textos.tabla.titulo,
    ]);
  });

  it('la de zona nombra primero Centro Histórico, CDMX, con su monto y su porcentaje', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porZona.nombre);

    expect(descripcion).toContain(
      `${graficas.porZona.nombre}. Centro Histórico, CDMX: $700,525.14, `,
    );
    expect(descripcion).not.toContain('700525');
  });

  it('la de cuenta nombra primero la cuenta de mayor gasto, en MXN', async () => {
    await conLaSemilla();

    expect(await descripcionDe(graficas.porCuenta.nombre)).toContain(
      `${graficas.porCuenta.nombre}. Tarjeta de Crédito ****6361: $1,081,126.06, `,
    );
  });

  it('la de hora nombra cada hora con su monto', async () => {
    await conLaSemilla();

    expect(await descripcionDe(graficas.porHora.nombre)).toContain('20 h: $177,904.41');
  });
});

describe('quincena en la gráfica por día (R-13)', () => {
  it('su descripción nombra el 15 y el 31 de julio como quincena, con la fecha y el monto en R-17', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porDia.nombre);

    expect(descripcion).toContain('15/07/2026, Quincena, $107,565.60');
    expect(descripcion).toContain('31/07/2026, Quincena, $188,091.48');
  });

  it('nombra los días contiguos con su propio tipo y los demás como día normal', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porDia.nombre);

    expect(descripcion).toContain('01/07/2026, Post-quincena, $122,712.37');
    expect(descripcion).toContain('16/07/2026, Post-quincena, $80,277.45');
    expect(descripcion).toContain('14/07/2026, Pre-quincena, $26,526.69');
    expect(descripcion).toContain('02/07/2026, Día normal, $25,350.13');
  });

  it('la leyenda con el significado de cada tipo de día está dibujada en la gráfica', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDia.nombre)).querySelector('svg');

    for (const rotulo of Object.values(graficas.tiposDeDia)) {
      expect(dibujo?.textContent).toContain(rotulo);
    }
  });

  it('dibuja una marca que no depende del color para cada tipo de día con marca: quincena, post-quincena y pre-quincena', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDia.nombre)).querySelector('svg');

    expect(dibujo?.querySelectorAll('pattern')).toHaveLength(3);
  });
});

describe('fin de semana en la gráfica por día de la semana (R-14)', () => {
  it('nombra cada día con su promedio en R-17 y viernes, sábado y domingo como fin de semana', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porDiaDeLaSemana.nombre);

    expect(descripcion).toContain('Lunes, promedio $27,174.60, Entre semana');
    expect(descripcion).toContain('Jueves, promedio $42,720.46, Entre semana');
    expect(descripcion).toContain('Viernes, promedio $88,188.54, Fin de semana');
    expect(descripcion).toContain('Sábado, promedio $70,484.24, Fin de semana');
    expect(descripcion).toContain('Domingo, promedio $50,263.20, Fin de semana');
  });

  it('la leyenda de entre semana y fin de semana está dibujada en la gráfica', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDiaDeLaSemana.nombre)).querySelector('svg');

    expect(dibujo?.textContent).toContain(graficas.porDiaDeLaSemana.entreSemana);
    expect(dibujo?.textContent).toContain(graficas.porDiaDeLaSemana.finDeSemana);
  });

  it('dibuja una marca que no depende del color para el fin de semana', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDiaDeLaSemana.nombre)).querySelector('svg');

    expect(dibujo?.querySelectorAll('pattern')).toHaveLength(1);
  });
});

describe('las gráficas se recalculan con el filtro', () => {
  it('elegir una categoría deja en las cinco gráficas solo los gastos de esa categoría', async () => {
    render(<App />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await grafica(graficas.porDia.nombre);

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    const porDia = await descripcionDe(graficas.porDia.nombre);
    expect(porDia).toContain('17/07/2026, Día normal, $300.00');
    expect(porDia).toContain('20/07/2026, Día normal, $0.00');
    expect(await descripcionDe(graficas.porDiaDeLaSemana.nombre)).toContain(
      'Viernes, promedio $80.00',
    );
    expect(await descripcionDe(graficas.porDiaDeLaSemana.nombre)).toContain(
      'Lunes, promedio $0.00',
    );
    expect(await descripcionDe(graficas.porHora.nombre)).toContain('10 h: $400.00');
    const zona = await descripcionDe(graficas.porZona.nombre);
    expect(zona).toContain('Centro: $400.00, 100.0%');
    expect(zona).not.toContain('Roma');
    const cuenta = await descripcionDe(graficas.porCuenta.nombre);
    expect(cuenta).toContain('Crédito: $300.00, 75.0%');
    expect(cuenta).not.toContain('$600.00');
  });

  it('un rango de fechas deja en la gráfica por día solo los días del periodo', async () => {
    render(<App />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await grafica(graficas.porDia.nombre);

    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.desde }),
      '10/07/2026',
    );
    await usuario.selectOptions(
      screen.getByRole('combobox', { name: textos.filtros.hasta }),
      '20/07/2026',
    );

    const descripcion = await descripcionDe(graficas.porDia.nombre);
    expect(descripcion).toContain('10/07/2026');
    expect(descripcion).toContain('20/07/2026');
    expect(descripcion).not.toContain('03/07/2026');
    expect(descripcion).not.toContain('21/07/2026');
  });
});

describe('con el filtro que deja 0 filas', () => {
  it('no queda ninguna gráfica en la página', async () => {
    render(<App />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await grafica(graficas.porDia.nombre);

    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }), '500');
    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo }), '400');

    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(within(document.body).queryByText(/NaN/)).toBeNull();
  });
});
