import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Un test de componente no hace red (docs/STACK.md, «Sin red en ejecución»): el historial se le
// pasa a `App` con el falso de `historial-falso.ts`, y quien lo olvide ve este error.
vi.stubGlobal('fetch', () =>
  Promise.reject(new TypeError('fetch: los tests de componente usan crearHistorialFalso()')),
);

afterEach(cleanup);
