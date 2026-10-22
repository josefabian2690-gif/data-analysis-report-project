import { resolve } from 'node:path';

import { textos } from '../../src/cliente/textos';
import { UMBRALES_POR_DEFECTO } from '../../src/dominio/hallazgos';
import { marcaDeHallazgo } from '../cliente/ayudas-hallazgos';
import { expect, test } from './sin-red';

const SEMILLA_1 = resolve('tests/fixtures/generador/2026-07-semilla-1.csv');
const CLAVE_GUARDADA = 'tablero-gastos:umbrales';
const CLAVES_DE_UMBRALES = Object.keys(UMBRALES_POR_DEFECTO);
const UMBRAL_EN_LA_URL = /umbral|tablero-gastos/i;

test('el umbral de la dominante en 50 sobrevive a recargar la página y ninguna petición lo lleva', async ({
  page,
}) => {
  const peticiones: { url: string; cuerpo: string }[] = [];
  page.on('request', (peticion) =>
    peticiones.push({ url: peticion.url(), cuerpo: peticion.postData() ?? '' }),
  );
  const panel = () => page.getByRole('region', { name: textos.hallazgos.titulo, exact: true });
  const dominante = () =>
    panel()
      .getByRole('listitem')
      .filter({ hasText: marcaDeHallazgo('categoriaDominante') });
  const umbral = () =>
    panel().getByRole('textbox', {
      name: textos.hallazgos.umbrales.controles.categoriaDominante,
      exact: true,
    });
  const cargarSemilla1 = () => page.getByLabel(textos.elegirCsv).setInputFiles(SEMILLA_1);

  await page.goto('/');
  await cargarSemilla1();
  await expect(dominante()).toHaveCount(1);
  await expect(umbral()).toHaveValue('35');

  await umbral().fill('50');
  await expect(dominante()).toHaveCount(0);

  await page.reload();
  await cargarSemilla1();

  await expect(umbral()).toHaveValue('50');
  await expect(panel().getByRole('listitem').first()).toBeVisible();
  await expect(dominante()).toHaveCount(0);
  expect(await page.evaluate((clave) => localStorage.getItem(clave), CLAVE_GUARDADA)).toContain(
    '"categoriaDominante":0.5',
  );
  const conUmbrales = peticiones.filter(
    ({ url, cuerpo }) =>
      UMBRAL_EN_LA_URL.test(decodeURIComponent(url)) ||
      CLAVES_DE_UMBRALES.some((clave) => decodeURIComponent(url).includes(clave)) ||
      cuerpo.includes(CLAVE_GUARDADA) ||
      CLAVES_DE_UMBRALES.some((clave) => cuerpo.includes(clave)),
  );
  expect(conUmbrales).toEqual([]);
});
