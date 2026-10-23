import { describe, expect, it } from 'vitest';

import { armarContenidoDelReporte } from '../../src/cliente/contenido-del-reporte';
import { describirHallazgo } from '../../src/cliente/descripcion-de-hallazgos';
import { textos } from '../../src/cliente/textos';
import { parsearCsv } from '../../src/dominio/carga';
import { filtrar, periodoDelFiltro, type Filtro } from '../../src/dominio/filtro';
import { hallazgos, UMBRALES_POR_DEFECTO, type Umbrales } from '../../src/dominio/hallazgos';
import { metricas as calcularMetricas } from '../../src/dominio/metricas';
import { generarHtml } from '../../src/reporte';
import minimo from '../fixtures/a-mano/minimo.csv?raw';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { marcaDeHallazgo } from './ayudas-hallazgos';

function armar(csv: string, filtro: Filtro = {}, umbrales: Umbrales = UMBRALES_POR_DEFECTO) {
  const resultado = parsearCsv(csv);
  const filtradas = filtrar(resultado.transacciones, filtro);
  const periodo = periodoDelFiltro(resultado.mes, filtro);
  const metricas = calcularMetricas(filtradas, periodo);
  return armarContenidoDelReporte({ resultado, filtro, filtradas, periodo, metricas, umbrales });
}

const { reporte } = textos;

function valorDe(contenido: ReturnType<typeof armar>, rotulo: string): string | undefined {
  return contenido.kpis.items.find((item) => item.rotulo === rotulo)?.valor;
}

describe('el contenido del reporte del mes completo (R-10, R-11, R-16, R-17)', () => {
  const contenido = armar(semilla1);

  it('dice el mes, el periodo y que no hay filtros', () => {
    expect(contenido.titulo).toBe(reporte.titulo);
    expect(contenido.encabezado).toEqual({
      mes: 'julio de 2026',
      periodo: reporte.periodo('01/07/2026', '31/07/2026'),
      filtros: [reporte.sinFiltros],
    });
  });

  it('trae los cinco KPIs con los rótulos y formatos del tablero', () => {
    expect(contenido.kpis.titulo).toBe(textos.kpis.titulo);
    expect(contenido.kpis.items.map((item) => item.rotulo)).toEqual([
      textos.kpis.gastoTotal,
      textos.kpis.transacciones,
      textos.kpis.ticketPromedio,
      textos.kpis.mediana,
      textos.kpis.gastoPromedioPorDia,
    ]);
    expect(valorDe(contenido, textos.kpis.gastoTotal)).toBe('$1,689,470.67');
    expect(valorDe(contenido, textos.kpis.transacciones)).toBe('2,000');
  });

  it('pone Compras primera y dominante con 48.2% en la tabla de categorías', () => {
    const [primera, segunda] = contenido.categorias.filas;

    expect(primera).toEqual({
      nombre: 'Compras',
      monto: '$814,566.30',
      porcentaje: '48.2%',
      dominante: true,
    });
    expect(segunda?.dominante).toBe(false);
    expect(contenido.categorias.columnas).toEqual({
      categoria: textos.categorias.columnaCategoria,
      monto: textos.categorias.columnaMonto,
      porcentaje: textos.categorias.columnaPorcentaje,
    });
  });

  it('redacta los hallazgos con la misma frase que el panel', () => {
    const resultado = parsearCsv(semilla1);
    const esperados = hallazgos(
      resultado.transacciones,
      UMBRALES_POR_DEFECTO,
      periodoDelFiltro(resultado.mes, {}),
    ).map(describirHallazgo);

    expect(contenido.hallazgos.frases).toEqual(esperados);
    expect(contenido.hallazgos.frases).toContain(
      textos.hallazgos.categoriaDominante('Compras', '48.2%', '$814,566.30'),
    );
    expect(contenido.hallazgos.ninguno).toBe(textos.hallazgos.ninguno);
  });

  it('lleva siete secciones de gráfica, en el orden del tablero, cada una con su SVG y su descripción', () => {
    const { graficas } = textos;

    expect(contenido.graficas.map((seccion) => seccion.titulo)).toEqual([
      reporte.graficaDeCategorias,
      graficas.porDia.titulo,
      graficas.porDiaDeLaSemana.titulo,
      graficas.porHora.titulo,
      graficas.porZona.titulo,
      graficas.porCuenta.titulo,
      graficas.mapa.titulo,
    ]);
    for (const seccion of contenido.graficas) {
      expect(seccion).toMatchObject({
        svg: expect.stringContaining('<svg'),
        descripcion: expect.any(String),
      });
    }
    const [categorias] = contenido.graficas;
    expect(categorias).toMatchObject({
      descripcion: expect.stringContaining(
        textos.categorias.detalleDeCategoria('Compras', '$814,566.30', '48.2%'),
      ),
    });
  });

  it('el HTML final trae siete imágenes de gráfica', () => {
    expect(generarHtml(contenido).match(/<img\b/g)).toHaveLength(7);
  });
});

describe('el contenido del reporte sigue al filtro (R-10)', () => {
  it('con solo Compras nombra el filtro, suma $814,566.30, deja Compras al 100 % y no trae zona favorita', () => {
    const contenido = armar(semilla1, { categorias: ['Compras'] });

    expect(contenido.encabezado.filtros).toEqual([
      reporte.filtro(textos.filtros.categorias, 'Compras'),
    ]);
    expect(valorDe(contenido, textos.kpis.gastoTotal)).toBe('$814,566.30');
    expect(contenido.categorias.filas).toEqual([
      { nombre: 'Compras', monto: '$814,566.30', porcentaje: '100.0%', dominante: true },
    ]);
    expect(
      contenido.hallazgos.frases.some((frase) => frase.includes(marcaDeHallazgo('zonaFavorita'))),
    ).toBe(false);
    expect(
      armar(semilla1).hallazgos.frases.some((frase) =>
        frase.includes(marcaDeHallazgo('zonaFavorita')),
      ),
    ).toBe(true);
  });

  it('nombra un filtro de fechas y uno de monto con fechas dd/mm/aaaa y montos MXN (R-17)', () => {
    const contenido = armar(semilla1, {
      desde: '2026-07-05',
      hasta: '2026-07-20',
      montoMinimo: 100,
      montoMaximo: 1000,
      cuentas: [],
    });

    expect(contenido.encabezado.filtros).toEqual([
      reporte.filtro(textos.filtros.desde, '05/07/2026'),
      reporte.filtro(textos.filtros.hasta, '20/07/2026'),
      reporte.filtro(textos.filtros.montoMinimo, '$100.00'),
      reporte.filtro(textos.filtros.montoMaximo, '$1,000.00'),
    ]);
    expect(contenido.encabezado.periodo).toBe(reporte.periodo('05/07/2026', '20/07/2026'));
  });

  it('nombra las listas de cuentas y zonas elegidas, y no las vacías', () => {
    const contenido = armar(semilla1, { zonas: ['Monterrey, N.L.'], cuentas: [] });

    expect(contenido.encabezado.filtros).toEqual([
      reporte.filtro(textos.filtros.zonas, 'Monterrey, N.L.'),
    ]);
  });
});

describe('los hallazgos del reporte usan los umbrales vigentes (R-12, R-16)', () => {
  it('con el umbral de categoría dominante en 0.5 no trae ese hallazgo y sí los demás', () => {
    const porDefecto = armar(semilla1).hallazgos.frases;
    const frases = armar(semilla1, {}, { ...UMBRALES_POR_DEFECTO, categoriaDominante: 0.5 })
      .hallazgos.frases;

    expect(frases.some((f) => f.includes(marcaDeHallazgo('categoriaDominante')))).toBe(false);
    expect(porDefecto.some((f) => f.includes(marcaDeHallazgo('categoriaDominante')))).toBe(true);
    expect(frases).toEqual(
      porDefecto.filter((f) => !f.includes(marcaDeHallazgo('categoriaDominante'))),
    );
    expect(frases.length).toBeGreaterThan(0);
  });
});

describe('el contenido del reporte de un mes sin coordenadas (R-02, R-10)', () => {
  it('pone el mensaje de sin coordenadas en el mapa y deja las otras seis gráficas con SVG', () => {
    const contenido = armar(minimo);

    expect(contenido.graficas).toHaveLength(7);
    expect(contenido.graficas.at(-1)).toEqual({
      titulo: textos.graficas.mapa.titulo,
      mensaje: textos.graficas.mapa.sinCoordenadas,
    });
    expect(contenido.graficas.slice(0, -1).every((seccion) => 'svg' in seccion)).toBe(true);
    expect(generarHtml(contenido).match(/<img\b/g)).toHaveLength(6);
  });
});
