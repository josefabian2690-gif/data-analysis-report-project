import type { Comparacion } from '../../src/dominio/comparacion';

/** Julio contra agosto, hecha a mano: Compras gana a Servicios y a Comida en agosto. */
export const COMPARACION_DE_PRUEBA: Comparacion = {
  meses: ['2026-07', '2026-08'],
  categorias: [
    {
      nombre: 'Compras',
      montos: [814566.3, 201746.52],
      diferencias: [{ absoluta: -612819.78, proporcion: -0.752 }],
    },
    {
      nombre: 'Servicios',
      montos: [0, 15000.5],
      diferencias: [{ absoluta: 15000.5, proporcion: null }],
    },
    {
      nombre: 'Comida',
      montos: [9000, 120],
      diferencias: [{ absoluta: -8880, proporcion: -0.9867 }],
    },
  ],
  total: {
    nombre: 'Total',
    montos: [823566.3, 216867.02],
    diferencias: [{ absoluta: -606699.28, proporcion: -0.7367 }],
  },
};

export const ROTULOS_DE_MESES = { '2026-07': 'Julio de 2026', '2026-08': 'Agosto de 2026' };
