import { diasDelMes } from './fecha';

/** Rango de días `AAAA-MM-DD`, ambos extremos incluidos; con `desde` después de `hasta` no tiene días. */
export interface Periodo {
  desde: string;
  hasta: string;
}

export type TipoDeDia = 'quincena' | 'post-quincena' | 'pre-quincena' | 'normal';

/** Lunes es 0 y domingo es 6. */
export type DiaDeLaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const MS_POR_DIA = 86_400_000;
const PRIMER_DIA_DE_FIN_DE_SEMANA: DiaDeLaSemana = 4;

function partesDe(dia: string): [number, number, number] {
  const [anio = '', mes = '', numero = ''] = dia.split('-');
  return [Number(anio), Number(mes), Number(numero)];
}

/** Días transcurridos desde 1970-01-01, por aritmética UTC: no depende de la zona de la máquina. */
function numeroDeDia(dia: string): number {
  const [anio, mes, numero] = partesDe(dia);
  return Date.UTC(anio, mes - 1, numero) / MS_POR_DIA;
}

export function diaDeLaSemana(dia: string): DiaDeLaSemana {
  // El 1970-01-01 fue jueves, que con la semana empezando en lunes es el índice 3.
  return ((((numeroDeDia(dia) + 3) % 7) + 7) % 7) as DiaDeLaSemana;
}

export function esDiaDeFinDeSemana(dia: DiaDeLaSemana): boolean {
  return dia >= PRIMER_DIA_DE_FIN_DE_SEMANA;
}

export function esFinDeSemana(dia: string): boolean {
  return esDiaDeFinDeSemana(diaDeLaSemana(dia));
}

/** Misma precedencia que `tipo_dia` del generador: quincena, luego post-quincena, luego pre-quincena. */
export function tipoDeDia(dia: string): TipoDeDia {
  const [anio, mes, numero] = partesDe(dia);
  const ultimo = diasDelMes(anio, mes);
  if (numero === 15 || numero === ultimo) return 'quincena';
  if (numero === 16 || numero === 1) return 'post-quincena';
  if ((numero >= 12 && numero <= 14) || (numero >= ultimo - 3 && numero < ultimo)) {
    return 'pre-quincena';
  }
  return 'normal';
}

/** El mes `AAAA-MM` de principio a fin. */
export function periodoDelMes(mes: string): Periodo {
  const [anio = '', numero = ''] = mes.split('-');
  return {
    desde: `${mes}-01`,
    hasta: `${mes}-${String(diasDelMes(Number(anio), Number(numero)))}`,
  };
}

export function diasDelPeriodo(periodo: Periodo): number {
  return Math.max(0, numeroDeDia(periodo.hasta) - numeroDeDia(periodo.desde) + 1);
}

/** Cada día del periodo, en orden; vacío si el inicio va después del fin. */
export function recorrerPeriodo(periodo: Periodo): string[] {
  const primero = numeroDeDia(periodo.desde);
  return Array.from({ length: diasDelPeriodo(periodo) }, (_, i) => {
    return new Date((primero + i) * MS_POR_DIA).toISOString().slice(0, 10);
  });
}
