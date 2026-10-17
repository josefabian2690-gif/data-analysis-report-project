import { describe, expect, it } from 'vitest';

import { crearHistorial } from '../../src/cliente/historial';
import type { Transaccion } from '../../src/dominio/esquema';

const JULIO: Transaccion[] = [
  {
    id: 'TX000001',
    dia: '2026-07-03',
    hora: '10:15:00',
    monto: 125.5,
    concepto: 'Tienda de ropa Montañez',
    categoria: 'Compras',
    cuenta: 'Tarjeta de Crédito ****6361',
    zona: 'Centro Histórico, CDMX',
    latitud: 19.430083,
    longitud: -99.13719,
  },
  {
    id: 'TX000002',
    dia: '2026-07-04',
    hora: null,
    monto: 40,
    concepto: 'Café',
    categoria: 'Comida',
    cuenta: 'Sin cuenta',
    zona: 'Sin zona',
    latitud: null,
    longitud: null,
  },
];

interface Peticion {
  url: string;
  metodo: string | undefined;
  contentType: string | null;
  cuerpo: unknown;
}

/** Un `fetch` que anota lo que recibe y responde con la respuesta que se le dé o falla como una red caída. */
function fetchFalso(respuesta: Response | Error) {
  const peticiones: Peticion[] = [];
  const peticionar = (url: string, init?: RequestInit): Promise<Response> => {
    peticiones.push({
      url,
      metodo: init?.method,
      contentType: new Headers(init?.headers).get('Content-Type'),
      cuerpo: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : init?.body,
    });
    return respuesta instanceof Error ? Promise.reject(respuesta) : Promise.resolve(respuesta);
  };
  return { peticionar, peticiones };
}

function json(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sinCuerpo(estado: number): Response {
  return new Response(null, { status: estado });
}

describe('guardar un mes en el historial', () => {
  it('manda las transacciones del mes en JSON con PUT a la ruta del mes y dice que quedó creado (201)', async () => {
    const { peticionar, peticiones } = fetchFalso(sinCuerpo(201));

    const resultado = await crearHistorial(peticionar).guardar('2026-07', JULIO, {});

    expect(resultado).toBe('creado');
    expect(peticiones).toEqual([
      { url: '/api/meses/2026-07', metodo: 'PUT', contentType: 'application/json', cuerpo: JULIO },
    ]);
  });

  it('con reemplazar pide ?reemplazar=1 y dice que quedó reemplazado (200)', async () => {
    const { peticionar, peticiones } = fetchFalso(sinCuerpo(200));

    const resultado = await crearHistorial(peticionar).guardar('2026-07', JULIO, {
      reemplazar: true,
    });

    expect(resultado).toBe('reemplazado');
    expect(peticiones.map(({ url, metodo }) => [metodo, url])).toEqual([
      ['PUT', '/api/meses/2026-07?reemplazar=1'],
    ]);
  });

  it('sin reemplazar nunca pide ?reemplazar=1, aunque la opción venga en falso', async () => {
    const { peticionar, peticiones } = fetchFalso(sinCuerpo(201));

    await crearHistorial(peticionar).guardar('2026-07', JULIO, { reemplazar: false });

    expect(peticiones.map(({ url }) => url)).toEqual(['/api/meses/2026-07']);
  });

  it('el 409 es «el mes ya existe», no un error: la página tiene que preguntar', async () => {
    const { peticionar } = fetchFalso(json(409, { error: 'El mes 2026-07 ya está guardado.' }));

    const resultado = await crearHistorial(peticionar).guardar('2026-07', JULIO, {});

    expect(resultado).toBe('existe');
  });

  it.each([400, 413, 415, 500])(
    'el %s del servidor es un error, no un guardado',
    async (estado) => {
      const { peticionar } = fetchFalso(json(estado, { error: 'no' }));

      await expect(crearHistorial(peticionar).guardar('2026-07', JULIO, {})).rejects.toThrow();
    },
  );

  it('una red caída es un error', async () => {
    const { peticionar } = fetchFalso(new TypeError('Failed to fetch'));

    await expect(crearHistorial(peticionar).guardar('2026-07', JULIO, {})).rejects.toThrow(
      'Failed to fetch',
    );
  });
});

describe('obtener un mes guardado', () => {
  it('devuelve las transacciones que el servidor guardó, pedidas con GET a la ruta del mes', async () => {
    const { peticionar, peticiones } = fetchFalso(json(200, JULIO));

    const transacciones = await crearHistorial(peticionar).obtener('2026-07');

    expect(transacciones).toEqual(JULIO);
    expect(peticiones.map(({ url, metodo }) => [metodo ?? 'GET', url])).toEqual([
      ['GET', '/api/meses/2026-07'],
    ]);
  });

  it('un mes que no está guardado (404) es «no está», no un error', async () => {
    const { peticionar } = fetchFalso(json(404, { error: 'El mes 2026-07 no está guardado.' }));

    expect(await crearHistorial(peticionar).obtener('2026-07')).toBeUndefined();
  });

  it('una respuesta que no cumple el esquema es un error y nunca llega a la página', async () => {
    const conMontoNegativo = [{ ...JULIO[0], monto: -5 }];
    const { peticionar } = fetchFalso(json(200, conMontoNegativo));

    await expect(crearHistorial(peticionar).obtener('2026-07')).rejects.toThrow();
  });

  it('una respuesta con transacciones de otro mes es un error', async () => {
    const { peticionar } = fetchFalso(json(200, JULIO));

    await expect(crearHistorial(peticionar).obtener('2026-08')).rejects.toThrow();
  });

  it('un 500 es un error aunque su cuerpo parezca un mes válido', async () => {
    const { peticionar } = fetchFalso(json(500, JULIO));

    await expect(crearHistorial(peticionar).obtener('2026-07')).rejects.toThrow();
  });
});

describe('listar los meses guardados', () => {
  it('devuelve cada mes con sus filas y su total sin redondear, pedidos con GET a /api/meses', async () => {
    const lista = [
      { mes: '2026-07', filas: 2000, total: 1689470.6699999995 },
      { mes: '2026-08', filas: 1800, total: 1544622.78 },
    ];
    const { peticionar, peticiones } = fetchFalso(json(200, lista));

    const meses = await crearHistorial(peticionar).listar();

    expect(meses).toEqual(lista);
    expect(peticiones.map(({ url, metodo }) => [metodo ?? 'GET', url])).toEqual([
      ['GET', '/api/meses'],
    ]);
  });

  it('un historial vacío es una lista vacía', async () => {
    const { peticionar } = fetchFalso(json(200, []));

    expect(await crearHistorial(peticionar).listar()).toEqual([]);
  });

  it.each([
    ['no es una lista', { mes: '2026-07', filas: 1, total: 1 }],
    ['un mes que no es AAAA-MM', [{ mes: 'julio', filas: 1, total: 1 }]],
    ['filas que no es un número', [{ mes: '2026-07', filas: '2000', total: 1 }]],
    ['total que no es un número', [{ mes: '2026-07', filas: 1, total: null }]],
    ['un elemento que no es un objeto', [null]],
  ])('una respuesta con %s es un error', async (_caso, cuerpo) => {
    const { peticionar } = fetchFalso(json(200, cuerpo));

    await expect(crearHistorial(peticionar).listar()).rejects.toThrow();
  });

  it('un 500 y una red caída son errores', async () => {
    const caida = fetchFalso(new TypeError('Failed to fetch'));
    const interno = fetchFalso(json(500, []));

    await expect(crearHistorial(caida.peticionar).listar()).rejects.toThrow();
    await expect(crearHistorial(interno.peticionar).listar()).rejects.toThrow();
  });
});
