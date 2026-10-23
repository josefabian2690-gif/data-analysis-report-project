import type { ContenidoDelReporte } from '../../src/reporte';

export const SVG_DE_PRUEBA =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text x="1" y="5">Ñ & "q" \'a\' 100%</text></svg>';

export function contenidoDePrueba(): ContenidoDelReporte {
  return {
    titulo: 'Reporte de gastos',
    encabezado: {
      mes: 'julio de 2026',
      periodo: 'del 01/07/2026 al 31/07/2026',
      filtros: ['Sin filtros'],
    },
    kpis: {
      titulo: 'Indicadores',
      items: [
        { rotulo: 'Transacciones', valor: '2,000' },
        { rotulo: 'Gasto total', valor: '$1,689,470.67' },
      ],
    },
    hallazgos: {
      titulo: 'Hallazgos',
      frases: ['Compras domina el gasto.', 'Hay un día atípico.'],
      ninguno: 'Sin hallazgos',
    },
    categorias: {
      titulo: 'Gasto por categoría',
      columnas: { categoria: 'Categoría', monto: 'Monto', porcentaje: 'Porcentaje' },
      filas: [
        { nombre: 'Compras', monto: '$814,000.00', porcentaje: '48.2 %', dominante: true },
        { nombre: 'Comida', monto: '$300,000.00', porcentaje: '17.8 %', dominante: false },
      ],
    },
    graficas: [
      { titulo: 'Categorías (gráfica)', descripcion: 'Compras 48.2 %', svg: SVG_DE_PRUEBA },
      { titulo: 'Por día', descripcion: 'Gasto por día', svg: '<svg><rect/></svg>' },
      { titulo: 'Mapa', mensaje: 'Sin coordenadas en este mes' },
    ],
  };
}

export interface Imagen {
  src: string;
  alt: string;
}

export function desescapar(texto: string): string {
  return texto
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

export function imagenes(html: string): Imagen[] {
  return [...html.matchAll(/<img\b[^>]*>/g)].map(([etiqueta]) => ({
    src: etiqueta.match(/\bsrc="([^"]*)"/)?.[1] ?? '',
    alt: desescapar(etiqueta.match(/\balt="([^"]*)"/)?.[1] ?? ''),
  }));
}

export function posicion(html: string, texto: string): number {
  return html.indexOf(texto);
}
