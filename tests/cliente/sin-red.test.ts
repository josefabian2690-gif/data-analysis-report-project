import { expect, it } from 'vitest';

it('un test de componente no puede hacer red: el fetch global rechaza avisando del historial falso', async () => {
  await expect(fetch('/api/meses')).rejects.toThrow('crearHistorialFalso');
});
