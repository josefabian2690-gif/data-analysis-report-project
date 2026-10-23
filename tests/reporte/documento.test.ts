import { describe, expect, it } from 'vitest';
import { generarHtml } from '../../src/reporte';
import { SVG_DE_PRUEBA, contenidoDePrueba, imagenes, posicion } from './contenido-de-prueba';

describe('generarHtml: el documento', () => {
  it('se declara documento es-MX, utf-8 y titulado', () => {
    const html = generarHtml(contenidoDePrueba());
    expect(html).toMatch(/<html[^>]*\blang="es-MX"/);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<title>Reporte de gastos</title>');
  });

  it('pone las secciones en el orden del tablero y respeta el orden de las gráficas', () => {
    const html = generarHtml(contenidoDePrueba());
    const orden = [
      'julio de 2026',
      'Indicadores',
      'Hallazgos',
      'Gasto por categoría',
      'Categorías (gráfica)',
      'Por día',
      'Mapa',
    ].map((texto) => posicion(html, texto));
    expect(orden.every((p) => p >= 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
  });

  it('muestra cada filtro, KPI como rótulo y valor, y cada hallazgo como elemento de lista', () => {
    const html = generarHtml(contenidoDePrueba());
    expect(html).toContain('Sin filtros');
    expect(html).toMatch(/Transacciones[\s\S]*?2,000/);
    expect(html).toMatch(/Gasto total[\s\S]*?\$1,689,470\.67/);
    expect(html).toMatch(/<li[^>]*>\s*Compras domina el gasto\.\s*<\/li>/);
    expect(html).toMatch(/<li[^>]*>\s*Hay un día atípico\.\s*<\/li>/);
  });

  it('con la lista de hallazgos vacía muestra el mensaje de ninguno y ningún elemento de lista', () => {
    const contenido = contenidoDePrueba();
    contenido.hallazgos.frases = [];
    const html = generarHtml(contenido);
    expect(html).toContain('Sin hallazgos');
    expect(html).not.toContain('class="hallazgo"');
  });

  it('marca solo la fila de la categoría dominante', () => {
    const html = generarHtml(contenidoDePrueba());
    const filas = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/g) ?? [];
    const compras = filas.find((f) => f.includes('Compras'));
    const comida = filas.find((f) => f.includes('Comida'));
    expect(compras).toContain('data-dominante="true"');
    expect(comida).not.toContain('data-dominante="true"');
    expect(compras).toMatch(/\$814,000\.00[\s\S]*48\.2 %/);
  });

  it('cada gráfica es una imagen data: cuyo src decodificado es el SVG recibido y cuyo alt es la descripción', () => {
    const [primera, segunda, ...resto] = imagenes(generarHtml(contenidoDePrueba()));
    expect(primera?.src.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(primera!.src.replace('data:image/svg+xml;charset=utf-8,', ''))).toBe(
      SVG_DE_PRUEBA,
    );
    expect(primera?.alt).toBe('Compras 48.2 %');
    expect(segunda?.alt).toBe('Gasto por día');
    expect(resto).toEqual([]);
  });

  it('la sección con mensaje en lugar de gráfica muestra el mensaje y no tiene imagen', () => {
    const html = generarHtml(contenidoDePrueba());
    const desdeMapa = html.slice(posicion(html, 'Mapa'));
    expect(desdeMapa).toContain('Sin coordenadas en este mes');
    expect(desdeMapa).not.toContain('<img');
  });
});
