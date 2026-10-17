import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { textos } from '../../src/cliente/textos';
import { expect, test } from './sin-red';

const DIRECTORIO = resolve('tests/fixtures/generador');
const NOMBRE = '2026-07-semilla-1.csv';

const esperado = JSON.parse(
  readFileSync(resolve(DIRECTORIO, '2026-07-semilla-1.esperado.json'), 'utf8'),
) as {
  categoriaDominante: string;
};

const ZONA = '"Centro Histórico, CDMX"';
const CUENTA = 'Tarjeta de Crédito ****6361';

function fila(id: string, fecha: string, monto: string): string {
  return `${id},${fecha},${monto},Tienda de ropa Montañez,Compras,${CUENTA},${ZONA},19.430083,-99.137190\r\n`;
}

// Filas 2002, 2003 y 2004 del archivo (el encabezado es la fila 1): 3 de 2 003, bajo el umbral de
// confirmación de R-05 (docs/DOMINIO.md).
const INVALIDAS_AL_FINAL =
  fila('TX002001', '2026-07-15 10:00:00', '0') +
  fila('TX000001', '2026-07-15 10:00:00', '100.00') +
  fila('TX002003', '2026-08-02 10:00:00', '100.00');

function archivoConInvalidas() {
  return {
    name: NOMBRE,
    mimeType: 'text/csv',
    buffer: Buffer.from(readFileSync(resolve(DIRECTORIO, NOMBRE), 'utf8') + INVALIDAS_AL_FINAL),
  };
}

const TROZOS_DEL_ARCHIVO = ['TX000001', 'Montañez'];

// El cuerpo del guardado es `Transaccion[]` en JSON (docs/ARQUITECTURA.md, «API del historial»): trae
// ids y conceptos del archivo como campos, así que se busca el encabezado y las líneas crudas.
const LINEAS_DEL_ARCHIVO = archivoConInvalidas()
  .buffer.toString('utf8')
  .split(/\r?\n/)
  .filter((linea) => linea !== '');

function dato(pagina: Page, etiqueta: string) {
  return pagina.getByRole('group', { name: etiqueta, exact: true }).locator('strong');
}

test('el CSV del generador con tres filas inválidas se convierte en el tablero del mes', async ({
  page,
}) => {
  await page.goto('/');
  const peticiones: { metodo: string; cuerpo: string | null; url: string }[] = [];
  page.on('request', (peticion) =>
    peticiones.push({
      metodo: peticion.method(),
      cuerpo: peticion.postData(),
      url: peticion.url(),
    }),
  );

  await page.getByLabel(textos.elegirCsv).setInputFiles(archivoConInvalidas());
  await expect(dato(page, textos.kpis.gastoTotal)).toBeVisible();

  await expect(dato(page, textos.kpis.gastoTotal)).toHaveText('$1,689,470.67');
  await expect(dato(page, textos.kpis.transacciones)).toHaveText('2,000');
  await expect(dato(page, textos.resumen.validas)).toHaveText('2,000');
  await expect(dato(page, textos.resumen.invalidas)).toHaveText('3');

  const invalidas = page.getByRole('table', { name: textos.resumen.tablaDeInvalidas, exact: true });
  const filasDeInvalidas = invalidas.getByRole('row');
  await expect(filasDeInvalidas).toHaveCount(4);
  await expect(filasDeInvalidas.nth(1).getByRole('cell')).toHaveText([
    '2002',
    textos.motivos.monto,
  ]);
  await expect(filasDeInvalidas.nth(2).getByRole('cell')).toHaveText([
    '2003',
    textos.motivos['id-repetido'],
  ]);
  await expect(filasDeInvalidas.nth(3).getByRole('cell')).toHaveText([
    '2004',
    textos.motivos['fuera-del-mes'],
  ]);

  const categorias = page.getByRole('table', { name: textos.categorias.tabla, exact: true });
  const primera = categorias.getByRole('row').nth(1);
  await expect(primera.getByRole('cell').first()).toHaveText(
    `${esperado.categoriaDominante}${textos.categorias.dominante}`,
  );
  await expect(primera.locator('mark')).toHaveText(textos.categorias.dominante);

  await expect(
    page
      .getByText(textos.guardado.guardado('julio de 2026'), { exact: true })
      .or(page.getByText(textos.guardado.pregunta('julio de 2026'), { exact: true })),
  ).toBeVisible();

  expect(
    peticiones.filter(({ cuerpo }) => cuerpo !== null).map(({ metodo, url }) => `${metodo} ${url}`),
    'peticiones con cuerpo',
  ).toEqual(['PUT http://127.0.0.1:4173/api/meses/2026-07']);
  expect(
    peticiones.filter(({ cuerpo, url }) =>
      LINEAS_DEL_ARCHIVO.some(
        (linea) => (cuerpo ?? '').includes(linea) || decodeURIComponent(url).includes(linea),
      ),
    ),
    'peticiones que llevan el encabezado o una línea del archivo',
  ).toEqual([]);
  expect(
    peticiones.filter(({ url }) =>
      TROZOS_DEL_ARCHIVO.some((trozo) => decodeURIComponent(url).includes(trozo)),
    ),
    'peticiones que llevan un trozo del archivo en la URL',
  ).toEqual([]);
});
