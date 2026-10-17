import type { Page } from '@playwright/test';
import { resolve } from 'node:path';

import { textos } from '../../src/cliente/textos';
import { expect, test } from './sin-red';

const FIXTURE = resolve('tests/fixtures/generador/2026-07-semilla-1.csv');

function dato(pagina: Page, etiqueta: string) {
  return pagina.getByRole('group', { name: etiqueta, exact: true }).locator('strong');
}

function grafica(pagina: Page, nombre: string) {
  return pagina.getByRole('img', { name: nombre });
}

function transacciones(pagina: Page) {
  return pagina.getByRole('table', { name: textos.tabla.nombre, exact: true });
}

test('el dashboard del mes se filtra, se ordena y se recupera de punta a punta', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel(textos.elegirCsv).setInputFiles(FIXTURE);

  await expect(dato(page, textos.kpis.gastoTotal)).toHaveText('$1,689,470.67');

  const porDia = grafica(page, textos.graficas.porDia.nombre);
  await expect(porDia).toHaveAttribute(
    'aria-label',
    new RegExp(`15/07/2026, ${textos.graficas.tiposDeDia.quincena}, \\$107,565\\.60`),
  );
  await expect(porDia).toHaveAttribute(
    'aria-label',
    new RegExp(`31/07/2026, ${textos.graficas.tiposDeDia.quincena}, \\$188,091\\.48`),
  );
  await expect(
    porDia.getByText(textos.graficas.tiposDeDia.quincena, { exact: true }),
  ).toBeVisible();

  await page.getByRole('combobox', { name: textos.filtros.desde }).selectOption('01/07/2026');
  await page.getByRole('combobox', { name: textos.filtros.hasta }).selectOption('10/07/2026');

  await expect(dato(page, textos.kpis.transacciones)).toHaveText('590');
  await expect(dato(page, textos.kpis.gastoTotal)).toHaveText('$458,549.33');
  await expect(dato(page, textos.kpis.gastoPromedioPorDia)).toHaveText('$45,854.93');
  await expect(porDia).toHaveAttribute('aria-label', /10\/07\/2026/);
  await expect(porDia).not.toHaveAttribute('aria-label', /11\/07\/2026/);

  const tabla = transacciones(page);
  await expect(page.getByText(textos.tabla.pagina(1, 12), { exact: true })).toBeVisible();
  await expect(tabla.getByRole('row').nth(1).getByRole('cell').last()).toHaveText('$2,679.41');

  await tabla.getByRole('button', { name: textos.tabla.columnas.monto, exact: true }).click();

  await expect(tabla.getByRole('row').nth(1).getByRole('cell').last()).toHaveText('$12,990.00');
  await expect(page.getByText(textos.tabla.pagina(1, 12), { exact: true })).toBeVisible();

  await page.getByRole('button', { name: textos.filtros.quitar }).click();

  await expect(dato(page, textos.kpis.transacciones)).toHaveText('2,000');
  await expect(dato(page, textos.kpis.gastoTotal)).toHaveText('$1,689,470.67');
});
