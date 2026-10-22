import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { esMes, leerMesGuardado, type Transaccion } from '../dominio/esquema';
import { metricas } from '../dominio/metricas';

const EXTENSION = '.json';

/** Un mes del historial tal como lo lista la API: `GET /api/meses` (docs/ARQUITECTURA.md). */
export interface MonthSummary {
  mes: string;
  filas: number;
  total: number;
}

export type SaveOutcome = 'creado' | 'reemplazado' | 'existe';

export interface MonthStoreOptions {
  directory: string;
  log(message: string): void;
  writeFile?(path: string, data: string): Promise<void>;
}

export interface MonthStore {
  list(): Promise<MonthSummary[]>;
  read(mes: string): Promise<Transaccion[] | undefined>;
  save(
    mes: string,
    transacciones: Transaccion[],
    options: { replace: boolean },
  ): Promise<SaveOutcome>;
  remove(mes: string): Promise<boolean>;
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function monthOfFileName(name: string): string | undefined {
  if (!name.endsWith(EXTENSION)) return undefined;
  const mes = name.slice(0, -EXTENSION.length);
  return esMes(mes) ? mes : undefined;
}

export function createMonthStore({
  directory,
  log,
  writeFile: writeTemporary = writeFile,
}: MonthStoreOptions): MonthStore {
  function fileOf(mes: string): string {
    if (!esMes(mes)) throw new Error(`«${mes}» no es un mes AAAA-MM.`);
    return join(directory, `${mes}${EXTENSION}`);
  }

  async function readValid(mes: string): Promise<Transaccion[] | undefined> {
    let text: string;
    try {
      text = await readFile(fileOf(mes), 'utf8');
    } catch (error) {
      if (isMissing(error)) return undefined;
      throw error;
    }
    const leido = leerMesGuardado(mes, JSON.parse(text) as unknown);
    if (!leido.ok) throw new Error(`El archivo del mes ${mes} no es válido: ${leido.motivo}.`);
    return leido.transacciones;
  }

  async function summarize(name: string, mes: string): Promise<MonthSummary | undefined> {
    try {
      const transacciones = await readValid(mes);
      if (transacciones === undefined) return undefined;
      const { numeroDeTransacciones, gastoTotal } = metricas(transacciones);
      return { mes, filas: numeroDeTransacciones, total: gastoTotal };
    } catch (error) {
      log(`Se omite ${name} del historial: ${(error as Error).message}`);
      return undefined;
    }
  }

  async function writeAtomically(mes: string, transacciones: Transaccion[]): Promise<void> {
    const temporary = join(directory, `.${mes}${EXTENSION}.${randomUUID()}.tmp`);
    await mkdir(directory, { recursive: true });
    try {
      await writeTemporary(temporary, JSON.stringify(transacciones));
      await rename(temporary, fileOf(mes));
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }

  return {
    async list() {
      let names: string[];
      try {
        names = await readdir(directory);
      } catch (error) {
        if (isMissing(error)) return [];
        throw error;
      }
      const months = names.flatMap((name) => {
        const mes = monthOfFileName(name);
        return mes === undefined ? [] : [{ name, mes }];
      });
      const summaries = await Promise.all(months.map(({ name, mes }) => summarize(name, mes)));
      return summaries
        .filter((summary) => summary !== undefined)
        .sort((a, b) => a.mes.localeCompare(b.mes));
    },

    read: readValid,

    async save(mes, transacciones, { replace }) {
      const already = await exists(fileOf(mes));
      if (already && !replace) return 'existe';
      await writeAtomically(mes, transacciones);
      return already ? 'reemplazado' : 'creado';
    },

    async remove(mes) {
      try {
        await unlink(fileOf(mes));
        return true;
      } catch (error) {
        if (isMissing(error)) return false;
        throw error;
      }
    },
  };
}
