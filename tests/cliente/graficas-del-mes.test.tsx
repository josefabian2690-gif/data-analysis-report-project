import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, elegir } from './ayudas';
import { crearHistorialFalso } from './historial-falso';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';

const { graficas } = textos;

const NOMBRES = [
  graficas.porDia.nombre,
  graficas.porDiaDeLaSemana.nombre,
  graficas.porHora.nombre,
  graficas.porZona.nombre,
  graficas.porCuenta.nombre,
];

const TODAS = [textos.categorias.nombreGrafica, ...NOMBRES];

/** Las barras con relleno de patrón: las de la leyenda llevan `transform` y no cuentan. */
function barrasConMarca(dibujo: SVGElement | null): number {
  return dibujo?.querySelectorAll('path[fill^="url("]:not([transform])').length ?? 0;
}

function grafica(nombre: string): Promise<HTMLElement> {
  return screen.findByRole('img', { name: new RegExp(`^${nombre}`) });
}

async function descripcionDe(nombre: string): Promise<string> {
  return (await grafica(nombre)).getAttribute('aria-label') ?? '';
}

async function conLaSemilla() {
  render(<App historial={crearHistorialFalso()} />);
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
    expect(screen.getAllByRole('img')).toHaveLength(TODAS.length);
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
      `${graficas.porZona.nombre}. ${graficas.porZona.detalle('Centro Histórico, CDMX', '$700,525.14', '41.5%')}`,
    );
    expect(descripcion).not.toContain('700525');
  });

  it('la de cuenta nombra primero la cuenta de mayor gasto, en MXN', async () => {
    await conLaSemilla();

    expect(await descripcionDe(graficas.porCuenta.nombre)).toContain(
      `${graficas.porCuenta.nombre}. ${graficas.porCuenta.detalle('Tarjeta de Crédito ****6361', '$1,081,126.06', '64.0%')}`,
    );
  });

  it('la de hora nombra cada hora con su monto', async () => {
    await conLaSemilla();

    expect(await descripcionDe(graficas.porHora.nombre)).toContain(
      graficas.porHora.detalle('20', '$177,904.41'),
    );
  });
});

describe('quincena en la gráfica por día (R-13)', () => {
  it('su descripción nombra el 15 y el 31 de julio como quincena, con la fecha y el monto en R-17', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porDia.nombre);

    const { detalle } = graficas.porDia;
    const { quincena } = graficas.tiposDeDia;
    expect(descripcion).toContain(detalle('15/07/2026', quincena, '$107,565.60'));
    expect(descripcion).toContain(detalle('31/07/2026', quincena, '$188,091.48'));
  });

  it('nombra los días contiguos con su propio tipo y los demás como día normal', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porDia.nombre);

    const { detalle } = graficas.porDia;
    const tipos = graficas.tiposDeDia;
    expect(descripcion).toContain(detalle('01/07/2026', tipos['post-quincena'], '$122,712.37'));
    expect(descripcion).toContain(detalle('16/07/2026', tipos['post-quincena'], '$80,277.45'));
    expect(descripcion).toContain(detalle('14/07/2026', tipos['pre-quincena'], '$26,526.69'));
    expect(descripcion).toContain(detalle('02/07/2026', tipos.normal, '$25,350.13'));
  });

  it('la leyenda con el significado de cada tipo de día está dibujada en la gráfica', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDia.nombre)).querySelector('svg');

    for (const rotulo of Object.values(graficas.tiposDeDia)) {
      expect(dibujo?.textContent).toContain(rotulo);
    }
  });

  it('marca con un patrón, además del color, los 10 días de quincena, post-quincena y pre-quincena', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDia.nombre)).querySelector('svg');

    expect(barrasConMarca(dibujo)).toBe(10);
  });
});

describe('fin de semana en la gráfica por día de la semana (R-14)', () => {
  it('nombra cada día con su promedio en R-17 y viernes, sábado y domingo como fin de semana', async () => {
    await conLaSemilla();

    const descripcion = await descripcionDe(graficas.porDiaDeLaSemana.nombre);

    const { dias, detalle, entreSemana, finDeSemana } = graficas.porDiaDeLaSemana;
    expect(descripcion).toContain(detalle(dias[0], '$27,174.60', entreSemana));
    expect(descripcion).toContain(detalle(dias[3], '$42,720.46', entreSemana));
    expect(descripcion).toContain(detalle(dias[4], '$88,188.54', finDeSemana));
    expect(descripcion).toContain(detalle(dias[5], '$70,484.24', finDeSemana));
    expect(descripcion).toContain(detalle(dias[6], '$50,263.20', finDeSemana));
  });

  it('la leyenda de entre semana y fin de semana está dibujada en la gráfica', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDiaDeLaSemana.nombre)).querySelector('svg');

    expect(dibujo?.textContent).toContain(graficas.porDiaDeLaSemana.entreSemana);
    expect(dibujo?.textContent).toContain(graficas.porDiaDeLaSemana.finDeSemana);
  });

  it('marca con un patrón, además del color, viernes, sábado y domingo', async () => {
    await conLaSemilla();

    const dibujo = (await grafica(graficas.porDiaDeLaSemana.nombre)).querySelector('svg');

    expect(barrasConMarca(dibujo)).toBe(3);
  });
});

describe('las gráficas se recalculan con el filtro', () => {
  it('elegir una categoría deja en las cinco gráficas solo los gastos de esa categoría', async () => {
    render(<App historial={crearHistorialFalso()} />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await grafica(graficas.porDia.nombre);

    await usuario.click(screen.getByRole('checkbox', { name: 'Comida' }));

    const normal = graficas.tiposDeDia.normal;
    const semana = graficas.porDiaDeLaSemana;
    const porDia = await descripcionDe(graficas.porDia.nombre);
    expect(porDia).toContain(graficas.porDia.detalle('17/07/2026', normal, '$300.00'));
    expect(porDia).toContain(graficas.porDia.detalle('20/07/2026', normal, '$0.00'));
    const porSemana = await descripcionDe(semana.nombre);
    expect(porSemana).toContain(semana.detalle(semana.dias[4], '$80.00', semana.finDeSemana));
    expect(porSemana).toContain(semana.detalle(semana.dias[0], '$0.00', semana.entreSemana));
    expect(await descripcionDe(graficas.porHora.nombre)).toContain(
      graficas.porHora.detalle('10', '$400.00'),
    );
    const zona = await descripcionDe(graficas.porZona.nombre);
    expect(zona).toContain(graficas.porZona.detalle('Centro', '$400.00', '100.0%'));
    expect(zona).not.toContain('Roma');
    const cuenta = await descripcionDe(graficas.porCuenta.nombre);
    expect(cuenta).toContain(graficas.porCuenta.detalle('Crédito', '$300.00', '75.0%'));
    expect(cuenta).toContain(graficas.porCuenta.detalle('Débito', '$100.00', '25.0%'));
    expect(cuenta).not.toContain('$700.00');
  });

  it('un rango de fechas deja en la gráfica por día solo los días del periodo', async () => {
    render(<App historial={crearHistorialFalso()} />);
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
