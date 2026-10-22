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
  guardado: {
    region: 'Estado del guardado en el historial',
    tituloDeLaPregunta: 'Confirma el reemplazo',
    guardando: (mes: string) => `Guardando el mes ${mes} en el historial…`,
    guardado: (mes: string) => `El mes ${mes} quedó guardado en el historial.`,
    pregunta: (mes: string) =>
      `El mes ${mes} ya está guardado en el historial. ¿Quieres reemplazarlo con este archivo?`,
    reemplazar: 'Reemplazar',
    conservar: 'Conservar el guardado',
    reemplazado: (mes: string) => `El mes ${mes} se reemplazó en el historial.`,
    conservado: (mes: string) => `Se conservó el mes ${mes} que ya estaba guardado.`,
    fallido: (mes: string) =>
      `No se pudo guardar el mes ${mes} en el historial. El tablero sigue disponible.`,
  },
  vistas: {
    nombre: 'Vistas de la página',
    tablero: 'Tablero del mes',
    historial: 'Historial',
  },
  historial: {
    titulo: 'Historial de meses',
    tabla: 'Transacciones y gasto total de cada mes guardado',
    columnas: { mes: 'Mes', transacciones: 'Transacciones', total: 'Gasto total' },
    vacio: 'Todavía no hay meses guardados. Carga un CSV y quedará aquí.',
    noDisponible:
      'No se pudo obtener la lista de meses guardados. Puedes seguir cargando archivos CSV.',
  },
  comparacion: {
    titulo: 'Comparación de meses',
    faltanMeses: 'Hacen falta al menos dos meses guardados para compararlos.',
    mesBase: 'Mes base',
    mesAComparar: 'Mes a comparar',
    mismoMes: 'Elige dos meses distintos: un mes no se compara consigo mismo.',
    cargando: 'Cargando la comparación…',
    fallo:
      'No se pudo obtener alguno de los dos meses guardados. Elige otros meses o inténtalo de nuevo más tarde.',
    tabla: (anterior: string, posterior: string) =>
      `Gasto por categoría de ${anterior} a ${posterior}, con la diferencia del segundo mes respecto del primero`,
    columnas: { categoria: 'Categoría', diferencia: 'Diferencia', proporcion: 'Diferencia %' },
    total: 'Gasto total',
    sinProporcion: 'Sin gasto en el mes anterior',
    grafica: {
      titulo: 'Gasto por categoría en los dos meses',
      nombre: (anterior: string, posterior: string) =>
        `Gráfico de columnas del gasto por categoría en ${anterior} y en ${posterior}`,
      detalle: (
        categoria: string,
        anterior: string,
        montoAnterior: string,
        posterior: string,
        montoPosterior: string,
      ) => `${categoria}, ${anterior} ${montoAnterior} y ${posterior} ${montoPosterior}`,
    },
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
  hallazgos: {
    titulo: 'Hallazgos',
    ninguno: 'Ningún patrón supera su umbral.',
    umbrales: {
      nombre: 'Umbrales de los hallazgos',
      controles: {
        categoriaDominante: 'Categoría dominante (% del gasto)',
        quincena: 'Quincena (veces el resto)',
        finDeSemana: 'Fin de semana (veces lunes a jueves)',
        diasDeViaje: 'Días máximos de un viaje',
        factorDeAtipicos: 'Atípicos (veces el percentil 99)',
      },
      restablecer: 'Restablecer umbrales',
      invalido: {
        porcentaje: 'Escribe un porcentaje mayor que 0 y hasta 100.',
        numero: 'Escribe un número mayor que 0.',
      },
    },
    categoriaDominante: (categoria: string, proporcion: string, monto: string) =>
      `${categoria} concentra ${proporcion} del gasto (${monto}).`,
    zonaFavorita: (zona: string, proporcion: string, monto: string) =>
      `Tu zona favorita para comer y divertirte es ${zona}: ${proporcion} de ese gasto (${monto}).`,
    quincena: (razon: string, promedioQuincena: string, promedioResto: string) =>
      `En quincena gastas ${razon} veces lo de los demás días: ${promedioQuincena} por día frente a ${promedioResto}.`,
    finDeSemana: (razon: string, promedioFinDeSemana: string, promedioResto: string) =>
      `En fin de semana gastas ${razon} veces lo de lunes a jueves: ${promedioFinDeSemana} por día frente a ${promedioResto}.`,
    viaje: (destino: string, desde: string, hasta: string, monto: string) =>
      `Viaje a ${destino} del ${desde} al ${hasta}, con ${monto} de gasto.`,
    atipicos: (cantidad: string, mayor: string) =>
      `${cantidad} gastos atípicos; el mayor es de ${mayor}.`,
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
  tabla: {
    titulo: 'Detalle de transacciones',
    nombre: 'Transacciones del conjunto filtrado',
    columnas: {
      fecha: 'Fecha',
      concepto: 'Concepto',
      categoria: 'Categoría',
      cuenta: 'Cuenta',
      zona: 'Zona',
      monto: 'Monto',
    },
    indicadorAscendente: '▲',
    indicadorDescendente: '▼',
    paginacion: 'Páginas de la tabla',
    anterior: 'Anterior',
    siguiente: 'Siguiente',
    pagina: (actual: number, total: number) => `Página ${actual} de ${total}`,
  },
  categorias: {
    titulo: 'Gasto por categoría',
    tabla: 'Gasto por categoría, de mayor a menor',
    columnaCategoria: 'Categoría',
    columnaMonto: 'Monto',
    columnaPorcentaje: 'Porcentaje del gasto',
    dominante: 'Dominante',
    nombreGrafica,
    detalleDeCategoria: (categoria: string, monto: string, porcentaje: string) =>
      `${categoria}, ${monto}, ${porcentaje}`,
  },
  graficas: {
    descripcion: (nombre: string, detalle: string) => `${nombre}. ${detalle}.`,
    tiposDeDia: {
      quincena: 'Quincena',
      'post-quincena': 'Post-quincena',
      'pre-quincena': 'Pre-quincena',
      normal: 'Día normal',
    },
    porDia: {
      titulo: 'Gasto por día',
      nombre: 'Gráfico de columnas del gasto por día del periodo, con la quincena marcada',
      detalle: (dia: string, tipo: string, monto: string) => `${dia}, ${tipo}, ${monto}`,
    },
    porDiaDeLaSemana: {
      titulo: 'Gasto promedio por día de la semana',
      nombre:
        'Gráfico de columnas del gasto promedio por día de la semana, con el fin de semana marcado',
      dias: {
        0: 'Lunes',
        1: 'Martes',
        2: 'Miércoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sábado',
        6: 'Domingo',
      },
      entreSemana: 'Entre semana',
      finDeSemana: 'Fin de semana',
      detalle: (dia: string, promedio: string, clase: string) =>
        `${dia}, promedio ${promedio}, ${clase}`,
    },
    porHora: {
      titulo: 'Gasto por hora',
      nombre: 'Gráfico de columnas del gasto por hora del día',
      detalle: (hora: string, monto: string) => `${hora} h: ${monto}`,
    },
    porZona: {
      titulo: 'Gasto por zona',
      nombre: 'Gráfico de barras del gasto por zona, de mayor a menor',
      detalle: (zona: string, monto: string, porcentaje: string) =>
        `${zona}: ${monto}, ${porcentaje}`,
    },
    porCuenta: {
      titulo: 'Gasto por cuenta',
      nombre: 'Gráfico de barras del gasto por cuenta, de mayor a menor',
      detalle: (cuenta: string, monto: string, porcentaje: string) =>
        `${cuenta}: ${monto}, ${porcentaje}`,
    },
    mapa: {
      titulo: 'Mapa del gasto',
      nombre: 'Mapa de dispersión de las transacciones por zona, encuadrado en la ciudad principal',
      detalle: (zona: string, puntos: string) =>
        `${zona}: ${puntos} ${puntos === '1' ? 'punto' : 'puntos'}`,
      ejes: { longitud: 'Longitud', latitud: 'Latitud' },
      sinCoordenadas:
        'Ninguna transacción de este conjunto trae coordenadas: no hay mapa que mostrar.',
    },
  },
} as const;
