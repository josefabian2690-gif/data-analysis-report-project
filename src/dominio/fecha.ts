export interface FechaLeida {
  dia: string;
  hora: string | null;
}

const FORMA = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?$/;
const MESES_DE_30_DIAS = [4, 6, 9, 11];

function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

export function diasDelMes(anio: number, mes: number): number {
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return MESES_DE_30_DIAS.includes(mes) ? 30 : 31;
}

export function leerFecha(texto: string): FechaLeida | null {
  const partes = FORMA.exec(texto);
  if (partes === null) return null;
  const [, anio = '', mes = '', dia = '', hora, minuto, segundo] = partes;
  const numeroDeMes = Number(mes);
  const diaValido = Number(dia) >= 1 && Number(dia) <= diasDelMes(Number(anio), numeroDeMes);
  const mesValido = numeroDeMes >= 1 && numeroDeMes <= 12;
  const horaValida =
    hora === undefined || (Number(hora) < 24 && Number(minuto) < 60 && Number(segundo) < 60);
  if (!mesValido || !diaValido || !horaValida) return null;
  return {
    dia: `${anio}-${mes}-${dia}`,
    hora: hora === undefined ? null : `${hora}:${minuto}:${segundo}`,
  };
}
