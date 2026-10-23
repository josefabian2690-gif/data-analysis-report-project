import { escapar } from './escape';
import { ESTILOS } from './estilos';
import type { ContenidoDelReporte, SeccionDeGrafica } from './tipos';

const POLITICA_DE_CONTENIDO = "default-src 'none'; img-src data:; style-src 'unsafe-inline'";
const PREFIJO_SVG = 'data:image/svg+xml;charset=utf-8,';

function seccionDeGrafica(seccion: SeccionDeGrafica): string {
  const cuerpo =
    'svg' in seccion
      ? `<img src="${PREFIJO_SVG}${encodeURIComponent(seccion.svg)}" alt="${escapar(seccion.descripcion)}">`
      : `<p>${escapar(seccion.mensaje)}</p>`;
  return `<section class="seccion-grafica"><h2>${escapar(seccion.titulo)}</h2>${cuerpo}</section>`;
}

function encabezado({ mes, periodo, filtros }: ContenidoDelReporte['encabezado']): string {
  const lineas = filtros.map((f) => `<li>${escapar(f)}</li>`).join('');
  return `<header><h1>${escapar(mes)}</h1><p class="periodo">${escapar(periodo)}</p><ul class="filtros">${lineas}</ul></header>`;
}

function kpis({ titulo, items }: ContenidoDelReporte['kpis']): string {
  const tarjetas = items
    .map((k) => `<div class="kpi"><dt>${escapar(k.rotulo)}</dt><dd>${escapar(k.valor)}</dd></div>`)
    .join('');
  return `<section><h2>${escapar(titulo)}</h2><dl class="kpis">${tarjetas}</dl></section>`;
}

function hallazgos({ titulo, frases, ninguno }: ContenidoDelReporte['hallazgos']): string {
  const cuerpo =
    frases.length === 0
      ? `<p>${escapar(ninguno)}</p>`
      : `<ul class="hallazgos">${frases.map((f) => `<li class="hallazgo">${escapar(f)}</li>`).join('')}</ul>`;
  return `<section><h2>${escapar(titulo)}</h2>${cuerpo}</section>`;
}

function categorias({ titulo, columnas, filas }: ContenidoDelReporte['categorias']): string {
  const cuerpo = filas
    .map((f) => {
      const marca = f.dominante ? ' data-dominante="true"' : '';
      return `<tr${marca}><td>${escapar(f.nombre)}</td><td class="cifra">${escapar(f.monto)}</td><td class="cifra">${escapar(f.porcentaje)}</td></tr>`;
    })
    .join('');
  const cabecera = `<tr><th>${escapar(columnas.categoria)}</th><th class="cifra">${escapar(columnas.monto)}</th><th class="cifra">${escapar(columnas.porcentaje)}</th></tr>`;
  return `<section><h2>${escapar(titulo)}</h2><table><thead>${cabecera}</thead><tbody>${cuerpo}</tbody></table></section>`;
}

export function generarHtml(contenido: ContenidoDelReporte): string {
  const cuerpo = [
    encabezado(contenido.encabezado),
    kpis(contenido.kpis),
    hallazgos(contenido.hallazgos),
    categorias(contenido.categorias),
    ...contenido.graficas.map(seccionDeGrafica),
  ].join('\n');
  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${POLITICA_DE_CONTENIDO}">
<title>${escapar(contenido.titulo)}</title>
<style>${ESTILOS}</style>
</head>
<body>
${cuerpo}
</body>
</html>
`;
}
