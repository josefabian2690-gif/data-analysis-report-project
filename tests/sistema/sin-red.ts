import { expect, test as base } from '@playwright/test';

const ANFITRION_LOCAL = '127.0.0.1';
const ESQUEMAS_SIN_RED = new Set(['data:', 'blob:']);

function sale(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  return !ESQUEMAS_SIN_RED.has(protocol) && hostname !== ANFITRION_LOCAL;
}

/**
 * Toda prueba de sistema falla si alguna petición sale de 127.0.0.1 (docs/STACK.md, «Sin red en
 * ejecución»). Se escucha `request` en el contexto, y no `response` en la página, porque una
 * petición que falla o se bloquea no recibe respuesta y pasaría sin ser vista.
 */
export const test = base.extend<{ sinRedExterna: void }>({
  sinRedExterna: [
    async ({ context }, use) => {
      const urls: string[] = [];
      context.on('request', (peticion) => urls.push(peticion.url()));
      await use();
      expect(urls.filter(sale), 'peticiones a hosts distintos de 127.0.0.1').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
