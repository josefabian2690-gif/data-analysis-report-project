import type { Page } from '@playwright/test';
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { textos } from '../../src/cliente/textos';
import { expect, test } from './sin-red';
import { arrancarServidor, type ServidorPropio } from './servidor-propio';

const DIRECTORIO = resolve('tests/fixtures/generador');

const MESES = [
  {
    archivo: '2026-07-semilla-1.csv',
    rotulo: 'julio de 2026',
    filas: '2,000',
    total: '$1,689,470.67',
  },
  {
    archivo: '2026-08-semilla-2.csv',
    rotulo: 'agosto de 2026',
    filas: '2,000',
    total: '$1,544,622.78',
  },
  {
    archivo: '2026-09-semilla-3.csv',
    rotulo: 'septiembre de 2026',
    filas: '2,000',
    total: '$1,278,296.56',
  },
] as const;

const [JULIO, AGOSTO] = MESES;

// Un gasto más de julio (TX002001 no está en el archivo): reemplazar julio con él deja 2,001 filas.
const GASTO_NUEVO =
  'TX002001,2026-07-15 10:00:00,100.00,Tienda de ropa Montañez,Compras,Tarjeta de Crédito ****6361,"Centro Histórico, CDMX",19.430083,-99.137190\r\n';

function archivoDe(nombre: string) {
  return { name: nombre, mimeType: 'text/csv', buffer: readFileSync(resolve(DIRECTORIO, nombre)) };
}

function julioConUnGastoMas() {
  const original = archivoDe(JULIO.archivo);
  return { ...original, buffer: Buffer.concat([original.buffer, Buffer.from(GASTO_NUEVO)]) };
}

function aviso(pagina: Page) {
  return pagina.getByRole('status', { name: textos.guardado.region, exact: true });
}

async function abrirHistorial(pagina: Page) {
  await pagina
    .getByRole('group', { name: textos.vistas.nombre, exact: true })
    .getByRole('button', { name: textos.vistas.historial, exact: true })
    .click();
}

async function cargar(pagina: Page, archivo: string | ReturnType<typeof archivoDe>) {
  await pagina.getByLabel(textos.elegirCsv).setInputFiles(archivo);
}

type FilaDeLista = readonly [mes: string, transacciones: string, total: string];

async function esperarLaLista(pagina: Page, esperado: readonly FilaDeLista[]) {
  const tabla = pagina.getByRole('table', { name: textos.historial.tabla, exact: true });
  await expect(tabla.getByRole('row')).toHaveCount(esperado.length + 1);
  for (const [i, celdas] of esperado.entries()) {
    await expect(
      tabla
        .getByRole('row')
        .nth(i + 1)
        .getByRole('cell'),
    ).toHaveText([...celdas]);
  }
}

const listaDeLosTres: FilaDeLista[] = MESES.map(({ rotulo, filas, total }) => [
  rotulo,
  filas,
  total,
]);

function filaDeLaComparacion(pagina: Page, anterior: string, posterior: string, nombre: string) {
  return pagina
    .getByRole('table', { name: textos.comparacion.tabla(anterior, posterior), exact: true })
    .getByRole('row')
    .filter({ has: pagina.getByRole('rowheader', { name: nombre, exact: true }) })
    .getByRole('cell');
}

async function compararJulioContraAgosto(pagina: Page) {
  await pagina.getByLabel(textos.comparacion.mesBase).selectOption({ label: JULIO.rotulo });
  await pagina.getByLabel(textos.comparacion.mesAComparar).selectOption({ label: AGOSTO.rotulo });
}

test('los meses guardados sobreviven a un reinicio, el 409 no pierde ni mezcla meses y la comparación da las cifras de R-15', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const carpeta = realpathSync(mkdtempSync(join(tmpdir(), 'tablero-persistencia-')));
  let servidor: ServidorPropio | undefined;
  try {
    servidor = await arrancarServidor(carpeta);
    await page.goto(servidor.origen);
    for (const { archivo, rotulo } of MESES) {
      await cargar(page, resolve(DIRECTORIO, archivo));
      await expect(aviso(page)).toHaveText(textos.guardado.guardado(rotulo));
    }

    await servidor.detener();
    servidor = await arrancarServidor(carpeta);
    await page.goto(servidor.origen);
    await abrirHistorial(page);
    await esperarLaLista(page, listaDeLosTres);

    await cargar(page, julioConUnGastoMas());
    await expect(aviso(page)).toHaveText(textos.guardado.pregunta(JULIO.rotulo));
    await page.getByRole('button', { name: textos.guardado.conservar, exact: true }).click();
    await expect(aviso(page)).toHaveText(textos.guardado.conservado(JULIO.rotulo));
    await abrirHistorial(page);
    await esperarLaLista(page, listaDeLosTres);

    await compararJulioContraAgosto(page);
    await expect(
      filaDeLaComparacion(page, JULIO.rotulo, AGOSTO.rotulo, textos.comparacion.total),
    ).toHaveText(['$1,689,470.67', '$1,544,622.78', '-$144,847.89', '-8.6%']);
    await expect(
      filaDeLaComparacion(page, JULIO.rotulo, AGOSTO.rotulo, 'Entretenimiento'),
    ).toHaveText(['$258,692.09', '$847,205.02', '+$588,512.93', '+227.5%']);
    const grafica = page.getByRole('img', {
      name: new RegExp(`^${textos.comparacion.grafica.nombre(JULIO.rotulo, AGOSTO.rotulo)}`),
    });
    await expect
      .poll(async () => (await grafica.locator('svg').boundingBox())?.width ?? 0)
      .toBeGreaterThan(200);

    await cargar(page, julioConUnGastoMas());
    await expect(aviso(page)).toHaveText(textos.guardado.pregunta(JULIO.rotulo));
    await page.getByRole('button', { name: textos.guardado.reemplazar, exact: true }).click();
    await expect(aviso(page)).toHaveText(textos.guardado.reemplazado(JULIO.rotulo));
    await abrirHistorial(page);
    await esperarLaLista(page, [
      [JULIO.rotulo, '2,001', '$1,689,570.67'],
      ...listaDeLosTres.slice(1),
    ]);
    await expect(
      filaDeLaComparacion(page, JULIO.rotulo, AGOSTO.rotulo, textos.comparacion.total),
    ).toHaveText(['$1,689,570.67', '$1,544,622.78', '-$144,947.89', '-8.6%']);
  } finally {
    await servidor?.detener();
    rmSync(carpeta, { recursive: true, force: true });
  }
});
