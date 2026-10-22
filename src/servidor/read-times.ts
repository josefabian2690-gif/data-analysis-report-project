import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { BundleTimes } from './needs-build';

export interface ReadTimesOptions {
  /** Carpeta a partir de la cual se resuelven las rutas relativas. */
  root: string;
  /** Archivo del bundle del navegador cuya fecha decide si está al día, relativo a `root`. */
  bundleFile: string;
  /** Archivos y carpetas fuente, relativos a `root`; una carpeta cuenta con todo su contenido. */
  sources: readonly string[];
}

async function modifiedTime(path: string): Promise<number | undefined> {
  try {
    return (await stat(path)).mtimeMs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function pathsOf(path: string): Promise<string[]> {
  const isDirectory = (await stat(path).catch(() => undefined))?.isDirectory() ?? false;
  if (!isDirectory) return [path];
  const inside = await readdir(path, { recursive: true });
  return [path, ...inside.map((name) => join(path, name))];
}

/** Fechas de modificación del bundle y de las fuentes; lo que no existe se omite. */
export async function readTimes({
  root,
  bundleFile,
  sources,
}: ReadTimesOptions): Promise<BundleTimes> {
  const paths = (await Promise.all(sources.map((source) => pathsOf(join(root, source))))).flat();
  const times = await Promise.all(paths.map(modifiedTime));
  return {
    bundle: await modifiedTime(join(root, bundleFile)),
    sources: times.filter((time) => time !== undefined),
  };
}
