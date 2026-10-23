import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { textos } from '../../src/cliente/textos';
import { marcaDeHallazgo } from '../cliente/ayudas-hallazgos';
import { expect, test } from './sin-red';

const DIRECTORIO = resolve('tests/fixtures/generador');
const NOMBRE = '2026-07-semilla-1.csv';
const GRAFICAS = 7;

const esperado = JSON.parse(
  readFileSync(resolve(DIRECTORIO, '2026-07-semilla-1.esperado.json'), 'utf8'),
) as { categoriaDominante: string };

test('el reporte exportado de la semilla 1 se abre sin conexión con sus cifras y se imprime a PDF', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByLabel(textos.elegirCsv).setInputFiles(resolve(DIRECTORIO, NOMBRE));
  const exportar = page.getByRole('button', { name: textos.reporte.exportar, exact: true });
  await expect(exportar).toBeVisible();

  const [descarga] = await Promise.all([page.waitForEvent('download'), exportar.click()]);
  expect(descarga.suggestedFilename()).toBe('reporte-2026-07.html');
  const html = readFileSync(await descarga.path(), 'utf8');

  const reporte = await context.newPage();
  await context.setOffline(true);
  await reporte.setContent(html, { waitUntil: 'load' });

  const valor = (rotulo: string) =>
    reporte.locator('.kpi').filter({ hasText: rotulo }).locator('dd');
  await expect(valor(textos.kpis.transacciones)).toHaveText('2,000');
  await expect(valor(textos.kpis.gastoTotal)).toHaveText('$1,689,470.67');
  await expect(
    reporte
      .locator('.hallazgo')
      .filter({ hasText: marcaDeHallazgo('categoriaDominante') })
      .filter({ hasText: esperado.categoriaDominante }),
  ).toHaveCount(1);

  const imagenes = reporte.locator('img');
  await expect(imagenes).toHaveCount(GRAFICAS);
  const anchos = await imagenes.evaluateAll((todas) =>
    todas.map((imagen) => (imagen as HTMLImageElement).naturalWidth),
  );
  expect(
    anchos.every((ancho) => ancho > 0),
    'anchos naturales de las gráficas',
  ).toBe(true);

  const pdf = await reporte.pdf();
  expect(pdf.subarray(0, 4).toString('latin1')).toBe('%PDF');
});
