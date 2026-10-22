import { render, screen, waitFor, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/cliente/App';
import { CLAVE_DE_UMBRALES, type Almacen } from '../../src/cliente/almacen-de-umbrales';
import { textos } from '../../src/cliente/textos';
import semilla1 from '../fixtures/generador/2026-07-semilla-1.csv?raw';
import semilla2 from '../fixtures/generador/2026-08-semilla-2.csv?raw';
import { archivoCsv, elegir } from './ayudas';
import { crearAlmacenFalso, crearAlmacenQueLanza } from './almacen-falso';
import { crearHistorialFalso } from './historial-falso';

const controles = textos.hallazgos.umbrales.controles;
type Clave = keyof typeof controles;

async function conLaSemilla(almacen?: Almacen) {
  render(<App historial={crearHistorialFalso()} almacen={almacen} />);
  const usuario = await elegir(archivoCsv(semilla1));
  await screen.findByRole('region', { name: textos.hallazgos.titulo });
  return usuario;
}

function region(): HTMLElement {
  return screen.getByRole('region', { name: textos.hallazgos.titulo });
}

function control(clave: Clave): HTMLElement {
  return within(region()).getByRole('textbox', { name: controles[clave] });
}

function hallazgos(): string[] {
  return within(region())
    .queryAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

const hayDominante = () => hallazgos().some((texto) => texto.includes('concentra'));

async function escribir(usuario: ReturnType<typeof userEvent.setup>, clave: Clave, texto: string) {
  await usuario.clear(control(clave));
  if (texto !== '') await usuario.paste(texto);
}

async function restablecer(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(
    within(region()).getByRole('button', { name: textos.hallazgos.umbrales.restablecer }),
  );
}

const POR_DEFECTO: Record<Clave, string> = {
  categoriaDominante: '35',
  quincena: '1.5',
  finDeSemana: '1.2',
  diasDeViaje: '4',
  factorDeAtipicos: '3',
};

describe('controles de umbrales del panel de hallazgos', () => {
  it('ofrece un control por umbral de R-16 con su valor por defecto', async () => {
    await conLaSemilla();

    for (const [clave, valor] of Object.entries(POR_DEFECTO) as [Clave, string][]) {
      expect(control(clave)).toHaveValue(valor);
    }
  });

  it('subir la dominante a 50 quita ese hallazgo y deja los demás', async () => {
    const usuario = await conLaSemilla();
    const antes = hallazgos();
    expect(hayDominante()).toBe(true);

    await escribir(usuario, 'categoriaDominante', '50');

    expect(hayDominante()).toBe(false);
    expect(hallazgos()).toEqual(antes.filter((texto) => !texto.includes('concentra')));
    expect(hallazgos().length).toBeGreaterThan(0);
  });

  it('restablecer devuelve los cinco valores y la dominante reaparece', async () => {
    const usuario = await conLaSemilla();
    const antes = hallazgos();
    await escribir(usuario, 'categoriaDominante', '50');
    await escribir(usuario, 'quincena', '9');

    await restablecer(usuario);

    for (const [clave, valor] of Object.entries(POR_DEFECTO) as [Clave, string][]) {
      expect(control(clave)).toHaveValue(valor);
    }
    expect(hallazgos()).toEqual(antes);
  });

  it.each([
    ['categoriaDominante', ''],
    ['categoriaDominante', 'abc'],
    ['categoriaDominante', '0'],
    ['categoriaDominante', '-5'],
    ['categoriaDominante', '101'],
    ['finDeSemana', ''],
  ] as [Clave, string][])(
    'un valor %s «%s» marca el control inválido con su mensaje y no cambia los hallazgos',
    async (clave, texto) => {
      const usuario = await conLaSemilla();
      const antes = hallazgos();

      await escribir(usuario, clave, texto);

      const campo = control(clave);
      expect(campo).toHaveAttribute('aria-invalid', 'true');
      expect(campo).toHaveAccessibleDescription(
        clave === 'categoriaDominante'
          ? textos.hallazgos.umbrales.invalido.porcentaje
          : textos.hallazgos.umbrales.invalido.numero,
      );
      expect(campo).toHaveValue(texto);
      expect(hallazgos()).toEqual(antes);
    },
  );

  it('un umbral válido no marca el control como inválido', async () => {
    const usuario = await conLaSemilla();

    await escribir(usuario, 'categoriaDominante', '50');

    expect(control('categoriaDominante')).not.toHaveAttribute('aria-invalid', 'true');
    expect(control('categoriaDominante')).toHaveAccessibleDescription('');
  });

  it('restablecer limpia el texto inválido y su marca', async () => {
    const usuario = await conLaSemilla();
    await escribir(usuario, 'finDeSemana', '');

    await restablecer(usuario);

    expect(control('finDeSemana')).toHaveValue('1.2');
    expect(control('finDeSemana')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('con la dominante en 50, cargar otro mes conserva el 50 y marca Entretenimiento con 54.8 %', async () => {
    const usuario = await conLaSemilla();
    await escribir(usuario, 'categoriaDominante', '50');

    await usuario.upload(
      screen.getByLabelText(textos.elegirCsv),
      archivoCsv(semilla2, 'agosto.csv'),
    );
    await waitFor(() => expect(hallazgos().join(' ')).toContain('Entretenimiento'));

    expect(control('categoriaDominante')).toHaveValue('50');
    const dominante = hallazgos().find((texto) => texto.includes('concentra'));
    expect(dominante).toContain('Entretenimiento');
    expect(dominante).toContain('54.8%');
  });
});

describe('conservación de los umbrales en el almacén', () => {
  it('escribe los umbrales válidos al cambiar uno, con la dominante en proporción', async () => {
    const almacen = crearAlmacenFalso();
    const usuario = await conLaSemilla(almacen);

    await escribir(usuario, 'categoriaDominante', '50');

    const guardado = JSON.parse(almacen.contenido.get(CLAVE_DE_UMBRALES) ?? 'null');
    expect(guardado).toEqual({
      categoriaDominante: 0.5,
      quincena: 1.5,
      finDeSemana: 1.2,
      diasDeViaje: 4,
      factorDeAtipicos: 3,
    });
  });

  it('escribe los valores por defecto al restablecer', async () => {
    const almacen = crearAlmacenFalso();
    const usuario = await conLaSemilla(almacen);
    await escribir(usuario, 'quincena', '9');

    await restablecer(usuario);

    const guardado = JSON.parse(almacen.escrituras.at(-1) ?? 'null');
    expect(guardado.quincena).toBe(1.5);
    expect(guardado.categoriaDominante).toBe(0.35);
  });

  it('nunca escribe un valor inválido: el guardado queda como estaba', async () => {
    const almacen = crearAlmacenFalso();
    const usuario = await conLaSemilla(almacen);

    await escribir(usuario, 'finDeSemana', '');
    await escribir(usuario, 'categoriaDominante', '101');

    expect(almacen.escrituras).toEqual([]);
    expect(almacen.contenido.has(CLAVE_DE_UMBRALES)).toBe(false);
  });

  it('un App nuevo con lo guardado arranca con esos valores y los aplica', async () => {
    const almacen = crearAlmacenFalso();
    const primero = await conLaSemilla(almacen);
    await escribir(primero, 'categoriaDominante', '50');
    await escribir(primero, 'diasDeViaje', '2');
    document.body.innerHTML = '';

    await conLaSemilla(almacen);

    expect(control('categoriaDominante')).toHaveValue('50');
    expect(control('diasDeViaje')).toHaveValue('2');
    expect(hayDominante()).toBe(false);
  });

  it('un guardado con valores rotos arranca con los de por defecto en esos campos', async () => {
    const almacen = crearAlmacenFalso({
      [CLAVE_DE_UMBRALES]: JSON.stringify({ finDeSemana: -1, quincena: 2 }),
    });

    await conLaSemilla(almacen);

    expect(control('finDeSemana')).toHaveValue('1.2');
    expect(control('quincena')).toHaveValue('2');
  });

  it('un almacén que lanza al leer y al escribir no rompe: la dominante en 50 quita el hallazgo', async () => {
    const usuario = await conLaSemilla(crearAlmacenQueLanza());
    expect(control('categoriaDominante')).toHaveValue('35');

    await escribir(usuario, 'categoriaDominante', '50');

    expect(hayDominante()).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sin almacén los umbrales viven en memoria', async () => {
    const usuario = await conLaSemilla();

    await escribir(usuario, 'categoriaDominante', '50');

    expect(hayDominante()).toBe(false);
  });
});
