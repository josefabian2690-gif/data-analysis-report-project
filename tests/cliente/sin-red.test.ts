import { expect, it } from 'vitest';

import { exigirSinRed, llamadasAlFetchGlobal } from './red-prohibida';

it('un test de componente que llama al fetch global lo ve rechazado y exigirSinRed lo hace fallar', async () => {
  await expect(fetch('/api/meses')).rejects.toThrow('crearHistorialFalso');

  expect(llamadasAlFetchGlobal).toEqual(['/api/meses']);
  expect(() => exigirSinRed()).toThrow('crearHistorialFalso');
  llamadasAlFetchGlobal.length = 0;
});
