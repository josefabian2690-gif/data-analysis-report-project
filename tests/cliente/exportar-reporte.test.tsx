import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import { archivoCsv, elegir } from './ayudas';
import { gastosDeJulioConDimensiones } from './ayudas-filtros';
import { marcaDeHallazgo } from './ayudas-hallazgos';
import { crearDescargaFalsa } from './descarga-falsa';
import { crearHistorialFalso } from './historial-falso';

const TOTAL_DEL_MES = '$1,689,470.67';
const TOTAL_DE_COMPRAS = '$814,566.30';

async function conLaSemilla() {
  const descarga = crearDescargaFalsa();
  render(<App historial={crearHistorialFalso()} descargar={descarga.descargar} />);
  const usuario = await elegir(archivoCsv(semilla1));
  await screen.findByRole('group', { name: textos.kpis.gastoTotal });
  return { descarga, usuario };
}

const exportar = () => screen.getByRole('button', { name: textos.reporte.exportar });

describe('botón de exportar el reporte', () => {
  it('aparece antes de los KPIs', async () => {
    await conLaSemilla();

    const kpis = screen.getByRole('group', { name: textos.kpis.gastoTotal });
    expect(
      exportar().compareDocumentPosition(kpis) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('al pulsarlo descarga el reporte del mes con su nombre y el gasto total', async () => {
    const { descarga, usuario } = await conLaSemilla();

    await usuario.click(exportar());

    expect(descarga.descargas).toHaveLength(1);
    expect(descarga.descargas[0]?.nombre).toBe('reporte-2026-07.html');
    expect(descarga.descargas[0]?.html).toContain(TOTAL_DEL_MES);
  });

  it('tras filtrar solo Compras el reporte trae el gasto de Compras y no el total del mes', async () => {
    const { descarga, usuario } = await conLaSemilla();
    await usuario.click(screen.getByRole('checkbox', { name: 'Compras' }));

    await usuario.click(exportar());

    const html = descarga.descargas[0]?.html ?? '';
    expect(html).toContain(TOTAL_DE_COMPRAS);
    expect(html).not.toContain(TOTAL_DEL_MES);
  });

  it('con el umbral de la categoría dominante en 50 el reporte no trae ese hallazgo', async () => {
    const { descarga, usuario } = await conLaSemilla();
    await usuario.click(exportar());
    const region = screen.getByRole('region', { name: textos.hallazgos.titulo });
    const umbral = within(region).getByRole('textbox', {
      name: textos.hallazgos.umbrales.controles.categoriaDominante,
    });
    await usuario.clear(umbral);
    await usuario.paste('50');

    await usuario.click(exportar());

    const [conUmbralPorDefecto, conUmbralAjustado] = descarga.descargas;
    expect(conUmbralPorDefecto?.html).toContain(marcaDeHallazgo('categoriaDominante'));
    expect(conUmbralAjustado?.html).not.toContain(marcaDeHallazgo('categoriaDominante'));
  });

  it('con un filtro que deja 0 filas no hay botón', async () => {
    const descarga = crearDescargaFalsa();
    render(<App historial={crearHistorialFalso()} descargar={descarga.descargar} />);
    const usuario = await elegir(gastosDeJulioConDimensiones());
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });
    expect(exportar()).toBeInTheDocument();

    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMinimo }), '500');
    await usuario.type(screen.getByRole('spinbutton', { name: textos.filtros.montoMaximo }), '400');

    expect(screen.queryByRole('button', { name: textos.reporte.exportar })).toBeNull();
  });

  it('sin una descarga disponible no hay botón', async () => {
    render(<App historial={crearHistorialFalso()} />);
    await elegir(archivoCsv(semilla1));
    await screen.findByRole('group', { name: textos.kpis.gastoTotal });

    expect(screen.queryByRole('button', { name: textos.reporte.exportar })).toBeNull();
  });
});
