import { expect, it } from 'vitest';

import { llamadasAlFetchGlobal } from './red-prohibida';

it('un test de componente que llama al fetch global lo ve rechazado y la llamada queda anotada para fallar', async () => {
  await expect(fetch('/api/meses')).rejects.toThrow('crearHistorialFalso');

  expect(llamadasAlFetchGlobal).toEqual(['/api/meses']);
  llamadasAlFetchGlobal.length = 0;
});
