import type { MotivoInvalido, MotivoRechazo } from '../dominio/carga';

const listaDeColumnas = new Intl.ListFormat('es-MX', { style: 'long', type: 'conjunction' });

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

type CodigoDeRechazo = MotivoRechazo['codigo'];

type TextosDeRechazo = Record<Exclude<CodigoDeRechazo, 'faltan-columnas'>, string> & {
  'faltan-columnas': (columnas: readonly string[]) => string;
};

const rechazo: TextosDeRechazo = {
  vacio: 'El archivo está vacío. Elige un CSV con encabezado y gastos.',
  'sin-filas': 'El archivo solo trae el encabezado. Elige un CSV con al menos un gasto.',
  'faltan-columnas': (columnas) =>
    `Al archivo le faltan columnas obligatorias: ${listaDeColumnas.format(columnas)}.`,
  'sin-filas-validas': 'Ninguna fila del archivo es válida, así que no hay nada que mostrar.',
};

const motivos: Record<MotivoInvalido, string> = {
  'fila-mal-formada': 'La fila no tiene el mismo número de columnas que el encabezado',
  fecha: 'La fecha no es válida',
  monto: 'El monto no es un número mayor que cero',
  'concepto-vacio': 'El concepto está vacío',
  'id-repetido': 'El identificador ya aparece en una fila anterior',
  'fuera-del-mes': 'La fecha queda fuera del mes de la carga',
};

const nombreGrafica = 'Gráfico de barras del gasto por categoría, de mayor a menor';

export const textos = {
  titulo: 'Tablero de gastos',
  elegirCsv: 'Elegir archivo CSV',
  lecturaFallida:
    'No se pudo leer el archivo. Revisa que siga en su lugar y que esté descargado, y elígelo de nuevo.',
  meses: MESES,
  rechazo,
  motivos,
  confirmacion: {
    titulo: 'Confirma la carga',
    aviso: (proporcion: string) =>
      `${proporcion} de las filas del archivo son inválidas. ¿Quieres cargarlo de todos modos?`,
    confirmar: 'Cargar de todos modos',
    cancelar: 'Cancelar',
  },
  resumen: {
    titulo: 'Resumen de la carga',
    mes: 'Mes',
    validas: 'Transacciones válidas',
    invalidas: 'Filas inválidas',
    tablaDeInvalidas: 'Filas inválidas y su motivo',
    columnaFila: 'Fila',
    columnaMotivo: 'Motivo',
  },
  kpis: {
    titulo: 'Indicadores',
    gastoTotal: 'Gasto total',
    transacciones: 'Transacciones',
    ticketPromedio: 'Ticket promedio',
    mediana: 'Mediana',
    gastoPromedioPorDia: 'Gasto promedio por día',
  },
  filtros: {
    titulo: 'Filtros',
    fechas: 'Fechas',
    desde: 'Desde',
    hasta: 'Hasta',
    sinLimite: 'Sin límite',
    categorias: 'Categorías',
    cuentas: 'Cuentas',
    zonas: 'Zonas',
    monto: 'Monto',
    montoMinimo: 'Monto mínimo',
    montoMaximo: 'Monto máximo',
    quitar: 'Quitar filtros',
    sinResultados:
      'Ningún gasto cumple los filtros. Cambia o quita los filtros para ver el tablero.',
  },
  categorias: {
    titulo: 'Gasto por categoría',
    tabla: 'Gasto por categoría, de mayor a menor',
    columnaCategoria: 'Categoría',
    columnaMonto: 'Monto',
    columnaPorcentaje: 'Porcentaje del gasto',
    dominante: 'Dominante',
    nombreGrafica,
    descripcionGrafica: (detalle: string) => `${nombreGrafica}. ${detalle}.`,
    detalleDeCategoria: (categoria: string, monto: string, porcentaje: string) =>
      `${categoria}, ${monto}, ${porcentaje}`,
  },
} as const;
