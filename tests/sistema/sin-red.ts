import { expect, test as base, type Page } from '@playwright/test';

const ANFITRION_LOCAL = '127.0.0.1';
const ESQUEMAS_SIN_RED = new Set(['data:', 'blob:']);

const PERIODO_DE_CALMA_MS = 1_000;
const TOPE_DE_ESPERA_MS = 10_000;
const PAUSA_MS = 50;

function sale(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  return !ESQUEMAS_SIN_RED.has(protocol) && hostname !== ANFITRION_LOCAL;
}

/** Espera, con tope, a que no haya peticiones en vuelo ni movimiento durante `PERIODO_DE_CALMA_MS`. */
async function esperarCalma(pagina: Page, actividad: { enVuelo: number; ultima: number }) {
  const limite = Date.now() + TOPE_DE_ESPERA_MS;
  while (Date.now() < limite && !pagina.isClosed()) {
    const calma = actividad.enVuelo === 0 && Date.now() - actividad.ultima >= PERIODO_DE_CALMA_MS;
    if (calma) return;
    await new Promise((resolver) => setTimeout(resolver, PAUSA_MS));
  }
}

/**
 * Toda prueba de sistema falla si alguna petición sale de 127.0.0.1 (docs/STACK.md, «Sin red en
 * ejecución»); eslint.config.mjs obliga a importar `test` de este módulo. Se escucha `request`
 * en el contexto, y no `response` en la página, porque una petición que falla o se bloquea no
 * recibe respuesta y pasaría sin ser vista. La evaluación espera a que la página termine de
 * pedir, con la página todavía abierta (por eso depende de `page`): una petición lanzada tras la
 * última aserción también cuenta.
 */
export const test = base.extend<{ sinRedExterna: void }>({
  sinRedExterna: [
    async ({ context, page }, use) => {
      const urls: string[] = [];
      const actividad = { enVuelo: 0, ultima: Date.now() };
      const terminada = () => {
        actividad.enVuelo = Math.max(0, actividad.enVuelo - 1);
        actividad.ultima = Date.now();
      };
      context.on('request', (peticion) => {
        urls.push(peticion.url());
        actividad.enVuelo += 1;
        actividad.ultima = Date.now();
      });
      context.on('requestfinished', terminada);
      context.on('requestfailed', terminada);
      await use();
      await esperarCalma(page, actividad);
      expect(urls.filter(sale), 'peticiones a hosts distintos de 127.0.0.1').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
