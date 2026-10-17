import {
  constructSortFn,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  functionalUpdate,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
  type OnChangeFn,
  type PaginationState,
  type SortDirection,
} from '@tanstack/react-table';
import { useId, useState } from 'react';

import type { Transaccion } from '../dominio/esquema';
import { formatearFecha, formatearMonto } from '../dominio/formato';
import { textos } from './textos';

const FILAS_POR_PAGINA = 50;
const PRIMERA_PAGINA: PaginationState = { pageIndex: 0, pageSize: FILAS_POR_PAGINA };

const collator = new Intl.Collator('es');
const texto = constructSortFn({
  sort: (a: string, b: string) => collator.compare(a, b),
});

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { basic: sortFn_basic, texto },
  columnMeta: metaHelper<{ clase?: string }>(),
});

const columna = createColumnHelper<typeof features, Transaccion>();

/**
 * Clave de la fecha: `AAAA-MM-DDTHH:MM:SS`, que ordena igual como cadena. Una transacción sin hora
 * (R-03) deja la parte de la hora vacía: su clave es prefijo de la de cualquier hora de su día, así
 * que va antes que todas, incluida la de las 00:00:00, sin depender del desempate de la tabla.
 */
function claveDeFecha({ dia, hora }: Transaccion): string {
  return `${dia}T${hora ?? ''}`;
}

function textoDeFecha({ dia, hora }: Transaccion): string {
  const fecha = formatearFecha(dia);
  return hora === null ? fecha : `${fecha} ${hora}`;
}

const columnas = columna.columns([
  columna.accessor(claveDeFecha, {
    id: 'fecha',
    header: textos.tabla.columnas.fecha,
    cell: ({ row }) => textoDeFecha(row.original),
    sortFn: 'basic',
    meta: { clase: 'columna-fecha' },
  }),
  columna.accessor('concepto', {
    header: textos.tabla.columnas.concepto,
    sortFn: 'texto',
  }),
  columna.accessor('categoria', {
    header: textos.tabla.columnas.categoria,
    sortFn: 'texto',
  }),
  columna.accessor('cuenta', {
    header: textos.tabla.columnas.cuenta,
    sortFn: 'texto',
  }),
  columna.accessor('zona', {
    header: textos.tabla.columnas.zona,
    sortFn: 'texto',
  }),
  columna.accessor('monto', {
    header: textos.tabla.columnas.monto,
    cell: ({ getValue }) => formatearMonto(getValue()),
    sortFn: 'basic',
    meta: { clase: 'columna-monto numerico' },
  }),
]);

const ORDEN_INICIAL = [{ id: 'fecha', desc: false }];

function ordenAnunciado(orden: false | SortDirection): 'ascending' | 'descending' | 'none' {
  if (orden === false) return 'none';
  return orden === 'asc' ? 'ascending' : 'descending';
}

function indicadorDeOrden(orden: false | SortDirection): string {
  if (orden === false) return '';
  return orden === 'asc' ? textos.tabla.indicadorAscendente : textos.tabla.indicadorDescendente;
}

interface PaginaDeUnConjunto {
  conjunto: Transaccion[];
  paginacion: PaginationState;
}

export function TablaDeTransacciones({ transacciones }: { transacciones: Transaccion[] }) {
  const id = useId();
  const [pagina, setPagina] = useState<PaginaDeUnConjunto>({
    conjunto: transacciones,
    paginacion: PRIMERA_PAGINA,
  });
  if (pagina.conjunto !== transacciones) {
    setPagina({ conjunto: transacciones, paginacion: PRIMERA_PAGINA });
  }
  const paginacion = pagina.conjunto === transacciones ? pagina.paginacion : PRIMERA_PAGINA;
  const alCambiarPagina: OnChangeFn<PaginationState> = (cambio) =>
    setPagina((anterior) => ({
      ...anterior,
      paginacion: functionalUpdate(cambio, anterior.paginacion),
    }));

  const tabla = useTable({
    features,
    columns: columnas,
    data: transacciones,
    getRowId: (transaccion) => transaccion.id,
    initialState: { sorting: ORDEN_INICIAL },
    enableSortingRemoval: false,
    autoResetPageIndex: false,
    state: { pagination: paginacion },
    onPaginationChange: alCambiarPagina,
  });

  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{textos.tabla.titulo}</h2>
      <table className="tabla-de-transacciones">
        <caption>{textos.tabla.nombre}</caption>
        <thead>
          {tabla.getHeaderGroups().map((grupo) => (
            <tr key={grupo.id}>
              {grupo.headers.map((encabezado) => {
                const orden = encabezado.column.getIsSorted();
                return (
                  <th
                    key={encabezado.id}
                    scope="col"
                    aria-sort={ordenAnunciado(orden)}
                    className={encabezado.column.columnDef.meta?.clase}
                  >
                    <button
                      type="button"
                      className="orden-de-columna"
                      onClick={() => {
                        encabezado.column.toggleSorting();
                        tabla.firstPage();
                      }}
                    >
                      <tabla.FlexRender header={encabezado} />
                      <span aria-hidden="true">{indicadorDeOrden(orden)}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {tabla.getRowModel().rows.map((fila) => (
            <tr key={fila.id}>
              {fila.getAllCells().map((celda) => (
                <td key={celda.id} className={celda.column.columnDef.meta?.clase}>
                  <tabla.FlexRender cell={celda} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <nav aria-label={textos.tabla.paginacion} className="paginacion">
        <button
          type="button"
          disabled={!tabla.getCanPreviousPage()}
          onClick={() => tabla.previousPage()}
        >
          {textos.tabla.anterior}
        </button>
        <span aria-live="polite">
          {textos.tabla.pagina(paginacion.pageIndex + 1, tabla.getPageCount())}
        </span>
        <button type="button" disabled={!tabla.getCanNextPage()} onClick={() => tabla.nextPage()}>
          {textos.tabla.siguiente}
        </button>
      </nav>
    </section>
  );
}
