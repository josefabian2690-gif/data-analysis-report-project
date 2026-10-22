import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMonthStore, type MonthStore } from '../../src/servidor/month-store';
import { AGOSTO, JULIO, SEPTIEMBRE, transaccionesDelFixture, unaTransaccion } from './ayudas';

let raiz: string;
let carpeta: string;
let avisos: string[];

function almacen(escribir?: (ruta: string, datos: string) => Promise<void>): MonthStore {
  return createMonthStore({
    directory: carpeta,
    log: (aviso) => avisos.push(aviso),
    ...(escribir === undefined ? {} : { writeFile: escribir }),
  });
}

async function escrituraCortada(ruta: string, datos: string): Promise<void> {
  await writeFile(ruta, datos.slice(0, Math.floor(datos.length / 2)));
  throw new Error('disco lleno');
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'tablero-almacen-'));
  carpeta = join(raiz, 'historial');
  avisos = [];
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

const ORIGINAL = [unaTransaccion('A1', '2026-07-01', 10), unaTransaccion('A2', '2026-07-02', 20)];
const NUEVO = [unaTransaccion('B1', '2026-07-15', 999)];

function contenidoDe(mes: string): string {
  return readFileSync(join(carpeta, `${mes}.json`), 'utf8');
}

describe('almacén de meses: guardar', () => {
  it('guarda un mes nuevo en AAAA-MM.json y crea la carpeta si falta', async () => {
    expect(existsSync(carpeta)).toBe(false);

    const resultado = await almacen().save('2026-07', ORIGINAL, { replace: false });

    expect(resultado).toBe('creado');
    expect(JSON.parse(contenidoDe('2026-07'))).toEqual(ORIGINAL);
    expect(readdirSync(carpeta)).toEqual(['2026-07.json']);
  });

  it('un mes que ya existe sin pedir reemplazo no se toca y avisa que existe', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });
    const antes = contenidoDe('2026-07');

    const resultado = await almacen().save('2026-07', NUEVO, { replace: false });

    expect(resultado).toBe('existe');
    expect(contenidoDe('2026-07')).toBe(antes);
  });

  it('reemplazar sustituye el contenido entero: los meses nunca se mezclan (R-09)', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });

    const resultado = await almacen().save('2026-07', NUEVO, { replace: true });

    expect(resultado).toBe('reemplazado');
    expect(JSON.parse(contenidoDe('2026-07'))).toEqual(NUEVO);
  });

  it('reemplazar un mes que no existía lo crea', async () => {
    const resultado = await almacen().save('2026-07', NUEVO, { replace: true });

    expect(resultado).toBe('creado');
  });
});

describe('almacén de meses: escritura atómica', () => {
  it('si la escritura se corta antes del rename, el mes anterior queda intacto, el error sube y no sobra ningún temporal', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });
    const antes = contenidoDe('2026-07');

    const fallo = await almacen(escrituraCortada)
      .save('2026-07', NUEVO, { replace: true })
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(Error);
    expect((fallo as Error).message).toBe('disco lleno');
    expect(contenidoDe('2026-07')).toBe(antes);
    expect(readdirSync(carpeta)).toEqual(['2026-07.json']);
  });

  it('si la escritura de un mes nuevo se corta, no queda ningún archivo y el mes no aparece', async () => {
    const fallo = await almacen(escrituraCortada)
      .save('2026-07', NUEVO, { replace: false })
      .catch((error: unknown) => error);

    expect(fallo).toBeInstanceOf(Error);
    expect(readdirSync(carpeta)).toEqual([]);
    expect(await almacen().list()).toEqual([]);
  });
});

describe('almacén de meses: el temporal', () => {
  it('se escribe en la carpeta del historial, para que el rename no cruce sistemas de archivos, y no con la forma de un mes', async () => {
    const rutas: string[] = [];

    await almacen(async (ruta, datos) => {
      rutas.push(ruta);
      await writeFile(ruta, datos);
    }).save('2026-07', ORIGINAL, { replace: false });

    expect(rutas).toHaveLength(1);
    expect(dirname(rutas[0]!)).toBe(carpeta);
    expect(rutas[0]).not.toBe(join(carpeta, '2026-07.json'));
  });
});

describe('almacén de meses: listar', () => {
  it('lista en orden cronológico con filas y total de cada mes', async () => {
    await almacen().save('2026-09', transaccionesDelFixture(SEPTIEMBRE), { replace: false });
    await almacen().save('2026-07', transaccionesDelFixture(JULIO), { replace: false });
    await almacen().save('2026-08', transaccionesDelFixture(AGOSTO), { replace: false });

    const lista = await almacen().list();

    expect(lista.map(({ mes, filas }) => ({ mes, filas }))).toEqual([
      { mes: '2026-07', filas: 2000 },
      { mes: '2026-08', filas: 2000 },
      { mes: '2026-09', filas: 2000 },
    ]);
    expect(lista[0]?.total).toBeCloseTo(1689470.67, 2);
    expect(lista[1]?.total).toBeCloseTo(1544622.78, 2);
    expect(lista[2]?.total).toBeCloseTo(1278296.56, 2);
  });

  it('con la carpeta sin crear la lista es vacía y no la crea', async () => {
    expect(await almacen().list()).toEqual([]);
    expect(existsSync(carpeta)).toBe(false);
  });

  it('un temporal sobrante de una escritura interrumpida no aparece como mes ni se reporta', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });
    const valido = JSON.stringify([unaTransaccion('C1', '2026-08-03')]);
    const sobrantes = [
      '2026-08.json.tmp',
      '.2026-08.json.4f2a.tmp',
      '2026-08.json~',
      '2026-07.json.tmp',
      '.2026-07.json.9c1b.tmp',
      'notas.txt',
    ];
    for (const nombre of sobrantes) {
      writeFileSync(join(carpeta, nombre), valido);
    }

    const lista = await almacen().list();

    expect(lista.map((m) => m.mes)).toEqual(['2026-07']);
    expect(avisos).toEqual([]);
  });

  it.each([
    ['no es JSON', '{"cortado":'],
    ['no es una lista', '{"id":"X"}'],
    ['es una lista vacía', '[]'],
    ['trae una transacción de otro mes', JSON.stringify([unaTransaccion('D1', '2026-09-01')])],
  ])('un 2026-08.json que %s se omite y su nombre sale por el log', async (_caso, contenido) => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });
    writeFileSync(join(carpeta, '2026-08.json'), contenido);

    const lista = await almacen().list();

    expect(lista.map((m) => m.mes)).toEqual(['2026-07']);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('2026-08.json');
  });
});

describe('almacén de meses: leer y borrar', () => {
  it('lee las transacciones tal como se guardaron', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });

    expect(await almacen().read('2026-07')).toEqual(ORIGINAL);
  });

  it('leer un mes que no está da undefined', async () => {
    expect(await almacen().read('2026-01')).toBeUndefined();
  });

  it('borrar un mes guardado quita su archivo y dice que existía', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });

    expect(await almacen().remove('2026-07')).toBe(true);
    expect(await almacen().list()).toEqual([]);
  });

  it('borrar un mes que no está dice que no existía', async () => {
    expect(await almacen().remove('2026-01')).toBe(false);
  });

  it('un archivo del mes que no valida no se entrega: leerlo falla con un error', async () => {
    await almacen().save('2026-07', ORIGINAL, { replace: false });
    writeFileSync(join(carpeta, '2026-07.json'), '[]');

    await expect(almacen().read('2026-07')).rejects.toThrow(/2026-07/);
  });
});

describe('almacén de meses: solo meses', () => {
  it.each(['2026-13', '../../package', '', '2026-07/../..'])(
    'el mes %j no se acepta en ninguna operación y no toca el disco',
    async (mes) => {
      const alm = almacen();

      await expect(alm.read(mes)).rejects.toThrow();
      await expect(alm.remove(mes)).rejects.toThrow();
      await expect(alm.save(mes, NUEVO, { replace: true })).rejects.toThrow();
      expect(existsSync(carpeta)).toBe(false);
    },
  );
});
