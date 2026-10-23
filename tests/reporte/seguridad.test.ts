import { describe, expect, it } from 'vitest';
import { generarHtml, type ContenidoDelReporte } from '../../src/reporte';
import { contenidoDePrueba, desescapar, imagenes } from './contenido-de-prueba';

const ATAQUE = '<script>alert(1)</script>';
const ESCAPADO = '&lt;script&gt;alert(1)&lt;/script&gt;';

function sinElementoScript(html: string) {
  expect(html).not.toMatch(/<script/i);
}

function contar(html: string, texto: string): number {
  return html.split(texto).length - 1;
}

const lugares: [string, (c: ContenidoDelReporte) => void][] = [
  ['título', (c) => (c.titulo = ATAQUE)],
  ['mes', (c) => (c.encabezado.mes = ATAQUE)],
  ['periodo', (c) => (c.encabezado.periodo = ATAQUE)],
  ['línea de filtro', (c) => (c.encabezado.filtros = [ATAQUE])],
  ['título de KPIs', (c) => (c.kpis.titulo = ATAQUE)],
  ['rótulo de KPI', (c) => (c.kpis.items[0]!.rotulo = ATAQUE)],
  ['valor de KPI', (c) => (c.kpis.items[0]!.valor = ATAQUE)],
  ['título de hallazgos', (c) => (c.hallazgos.titulo = ATAQUE)],
  ['hallazgo', (c) => (c.hallazgos.frases = [ATAQUE])],
  ['mensaje de ninguno', (c) => ((c.hallazgos.frases = []), (c.hallazgos.ninguno = ATAQUE))],
  ['título de categorías', (c) => (c.categorias.titulo = ATAQUE)],
  ['encabezado de columna', (c) => (c.categorias.columnas.monto = ATAQUE)],
  ['nombre de categoría', (c) => (c.categorias.filas[0]!.nombre = ATAQUE)],
  ['monto de categoría', (c) => (c.categorias.filas[0]!.monto = ATAQUE)],
  ['porcentaje de categoría', (c) => (c.categorias.filas[0]!.porcentaje = ATAQUE)],
  ['título de gráfica', (c) => (c.graficas[0]!.titulo = ATAQUE)],
];

describe('generarHtml: los textos del CSV se muestran como texto', () => {
  it.each(lugares)('escapa el marcado en: %s', (_nombre, inyectar) => {
    const contenido = contenidoDePrueba();
    inyectar(contenido);
    const html = generarHtml(contenido);
    sinElementoScript(html);
    expect(contar(html, ESCAPADO)).toBe(1);
    expect(desescapar(ESCAPADO)).toBe(ATAQUE);
  });

  it('escapa el marcado en el mensaje en lugar de gráfica', () => {
    const contenido = contenidoDePrueba();
    contenido.graficas[2] = { titulo: 'Mapa', mensaje: ATAQUE };
    const html = generarHtml(contenido);
    sinElementoScript(html);
    expect(contar(html, ESCAPADO)).toBe(1);
  });

  it('una descripción con comillas no rompe el atributo alt y se recupera íntegra', () => {
    const contenido = contenidoDePrueba();
    const descripcion = `Zona "Norte" <b>&</b> 'Sur' ${ATAQUE}`;
    contenido.graficas[0] = { titulo: 'X', descripcion, svg: '<svg/>' };
    const html = generarHtml(contenido);
    sinElementoScript(html);
    expect(imagenes(html)[0]?.alt).toBe(descripcion);
    expect(html).not.toContain('alt="Zona "');
  });

  it('un ampersand ya escapado en el contenido se escapa una sola vez más, sin perder el texto', () => {
    const contenido = contenidoDePrueba();
    contenido.encabezado.mes = 'A&B &amp; C';
    const html = generarHtml(contenido);
    expect(html).toContain('A&amp;B &amp;amp; C');
  });
});

describe('generarHtml: sin red', () => {
  it('lleva exactamente la política de seguridad de contenido que bloquea todo salvo imágenes data:', () => {
    const html = generarHtml(contenidoDePrueba());
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    expect(head).toContain(
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">`,
    );
  });

  const patronesExternos = [
    /\bsrc\s*=\s*["']?\s*https?:/i,
    /\bhref\s*=\s*["']?\s*https?:/i,
    /url\(\s*["']?\s*https?:/i,
    /@import[^;]*https?:/i,
  ];

  it('ningún src, href, url( ni @import apunta a http(s), aunque el SVG traiga xmlns', () => {
    const html = generarHtml(contenidoDePrueba());
    expect(imagenes(html).length).toBeGreaterThan(0);
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain('<style>');
    for (const patron of patronesExternos) expect(html).not.toMatch(patron);
  });

  it('los patrones detectan una hoja de estilos cargada desde una URL', () => {
    const malo =
      '<link rel="stylesheet" href="https://x.test/a.css"><style>@import "https://x.test/a.css"; a{background:url(https://x.test/i.png)}</style><img src="http://x.test/i.png">';
    const detectados = patronesExternos.filter((p) => p.test(malo));
    expect(detectados).toHaveLength(patronesExternos.length);
  });
});

describe('generarHtml: impresión', () => {
  function hoja(): string {
    const html = generarHtml(contenidoDePrueba());
    return html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
  }

  it('en @media print evita partir gráficas, KPIs y hallazgos, con fondo blanco y texto oscuro', () => {
    const estilos = hoja();
    const impresion = estilos.slice(estilos.indexOf('@media print'));
    expect(impresion).toMatch(/background:\s*#fff/);
    expect(impresion).toMatch(/color:\s*#(0|1)[0-9a-f]{5}\b/i);
    for (const clase of ['seccion-grafica', 'kpis', 'hallazgo']) {
      expect(impresion).toMatch(new RegExp(`\\.${clase}[^{]*\\{[^}]*break-inside:\\s*avoid`));
    }
  });

  it('en pantalla las imágenes no se salen del ancho', () => {
    expect(hoja()).toMatch(/img\s*\{[^}]*max-width:\s*100%/);
  });

  it('las clases que la hoja usa existen en el documento', () => {
    const html = generarHtml(contenidoDePrueba());
    for (const clase of ['seccion-grafica', 'kpis', 'hallazgo'])
      expect(html).toContain(`class="${clase}"`);
  });
});
