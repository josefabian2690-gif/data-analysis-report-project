/** Una fila de la tabla de categorías; los montos y porcentajes llegan ya formateados. */
export interface FilaDeCategoria {
  nombre: string;
  monto: string;
  porcentaje: string;
  dominante: boolean;
}

export interface KpiDelReporte {
  rotulo: string;
  valor: string;
}

/** Con `svg` la sección lleva su gráfica; con `mensaje` lo muestra en su lugar. */
export type SeccionDeGrafica = { titulo: string } & (
  { descripcion: string; svg: string } | { mensaje: string }
);

/** Contenido ya redactado y formateado por quien llama; `reporte` solo lo compone, escapa y estiliza. */
export interface ContenidoDelReporte {
  titulo: string;
  encabezado: { mes: string; periodo: string; filtros: string[] };
  kpis: { titulo: string; items: KpiDelReporte[] };
  hallazgos: { titulo: string; frases: string[]; ninguno: string };
  categorias: {
    titulo: string;
    columnas: { categoria: string; monto: string; porcentaje: string };
    filas: FilaDeCategoria[];
  };
  /** Se muestran en el orden recibido, tras la tabla de categorías. */
  graficas: SeccionDeGrafica[];
}
