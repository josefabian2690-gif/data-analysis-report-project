import { init } from 'echarts';

export interface HuellaDeMarca {
  /** Fracción de la losa que el patrón pinta. */
  cobertura: number;
  /** `true` si alguna figura es más ancha o más alta que la losa: la losa la recorta y solo queda una astilla. */
  figuraMasGrandeQueLaLosa: boolean;
}

type Forma = (x: number, y: number) => boolean;

interface Primitiva {
  desde: [number, number];
  hasta: [number, number];
  contiene: Forma;
}

const PASO = 0.25;

function primitivaDe(d: string): Primitiva {
  const circulo = /^M(-?[\d.]+) (-?[\d.]+)A([\d.]+) [\d.]+ 0 1 1/.exec(d);
  if (circulo !== null) {
    const [, sx, sy, radio] = circulo.map(Number);
    const [cx, cy, r] = [sx! - radio!, sy!, radio!];
    return {
      desde: [cx - r, cy - r],
      hasta: [cx + r, cy + r],
      contiene: (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2,
    };
  }
  const rect = /^M(-?[\d.]+) (-?[\d.]+)l([\d.]+) 0l0 ([\d.]+)l/.exec(d);
  if (rect !== null) {
    const [, x0, y0, ancho, alto] = rect.map(Number);
    return {
      desde: [x0!, y0!],
      hasta: [x0! + ancho!, y0! + alto!],
      contiene: () => true,
    };
  }
  throw new Error(`forma de símbolo que el test no sabe medir: ${d}`);
}

function modulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Dibuja una barra con la marca, lee la losa que ECharts repite y mide qué pinta. */
export function huellaDeMarca(marca: object): HuellaDeMarca {
  const grafica = init(null, null, { renderer: 'svg', ssr: true, width: 300, height: 200 });
  let svg: string;
  try {
    grafica.setOption({
      animation: false,
      xAxis: { type: 'category', data: ['a'] },
      yAxis: {},
      series: [{ type: 'bar', data: [5], itemStyle: { color: '#0f766e', decal: marca } }],
    });
    svg = grafica.renderToSVGString();
  } finally {
    grafica.dispose();
  }
  const losa = /<pattern width="(\d+)" height="(\d+)"[^>]*>([\s\S]*?)<\/pattern>/.exec(svg);
  if (losa === null) throw new Error('la barra no lleva patrón');
  const [ancho, alto] = [Number(losa[1]), Number(losa[2])];
  const [columnas, filas] = [Math.round(ancho / PASO), Math.round(alto / PASO)];
  const pintada = Array.from({ length: filas }, () => new Array<boolean>(columnas).fill(false));
  const figuras = [...(losa[3] ?? '').matchAll(/<path d="([^"]+)"/g)].map(([, d]) =>
    primitivaDe(d ?? ''),
  );
  if (figuras.length === 0) throw new Error('la losa del patrón no tiene figuras que medir');
  for (const { desde, hasta, contiene } of figuras) {
    for (let y = desde[1] + PASO / 2; y < hasta[1]; y += PASO) {
      for (let x = desde[0] + PASO / 2; x < hasta[0]; x += PASO) {
        const fila = pintada[modulo(Math.floor(y / PASO), filas)];
        if (fila !== undefined && contiene(x, y))
          fila[modulo(Math.floor(x / PASO), columnas)] = true;
      }
    }
  }
  const celdas = pintada.flat();
  return {
    cobertura: celdas.filter(Boolean).length / celdas.length,
    figuraMasGrandeQueLaLosa: figuras.some(
      ({ desde, hasta }) => hasta[0] - desde[0] > ancho || hasta[1] - desde[1] > alto,
    ),
  };
}
