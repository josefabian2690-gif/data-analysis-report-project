import { textos } from '../../src/cliente/textos';
import { expect, test } from './sin-red';

test('la página vacía muestra el título del tablero sin pedir nada fuera de 127.0.0.1', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: textos.titulo })).toBeVisible();
});
