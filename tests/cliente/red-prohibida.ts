import { vi } from 'vitest';

/** Las URLs que cada test de componente pidió al `fetch` global; `exigirSinRed` falla si hay alguna. */
export const llamadasAlFetchGlobal: string[] = [];

/**
 * Un test de componente no depende de la red ni de un servidor (CLAUDE.md, *Test driven
 * development*, punto 2): el historial entra por la prop de `App` con `crearHistorialFalso()`. El
 * `fetch` global rechaza y anota la llamada, porque el cliente del historial convierte ese rechazo
 * en un aviso y el test pasaría sin enterarse de que quien lo escribió olvidó el falso.
 */
export function prohibirLaRed() {
  llamadasAlFetchGlobal.length = 0;
  vi.stubGlobal('fetch', (url: unknown) => {
    llamadasAlFetchGlobal.push(String(url));
    return Promise.reject(
      new TypeError('fetch: los tests de componente usan crearHistorialFalso()'),
    );
  });
}

export function exigirSinRed() {
  if (llamadasAlFetchGlobal.length === 0) return;
  throw new Error(
    `El test llamó al fetch global (${llamadasAlFetchGlobal.join(', ')}): pásale a App crearHistorialFalso().`,
  );
}
