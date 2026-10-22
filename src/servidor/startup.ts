import type { Server } from 'node:http';
import { readConfig, type Env } from './config';
import { needsBuild, type BundleTimes } from './needs-build';
import { startStaticServer, LOCAL_ADDRESS } from './static-server';
import { StartupFailure } from './startup-failure';

export interface StartupDeps {
  env: Env;
  /** Carpeta del bundle del navegador. */
  bundleDirectory: string;
  readTimes(): Promise<BundleTimes>;
  /** Construye el bundle del navegador y devuelve el código de salida del proceso de construcción. */
  buildBundle(): Promise<number>;
  openBrowser(url: string): Promise<unknown>;
  log(message: string): void;
}

async function ensureBundle({ readTimes, buildBundle }: StartupDeps): Promise<void> {
  if (!needsBuild(await readTimes())) return;
  const exitCode = await buildBundle();
  if (exitCode !== 0) {
    throw new StartupFailure('La construcción del bundle del navegador falló.', exitCode);
  }
}

async function listen(deps: StartupDeps, port: number): Promise<Server> {
  try {
    return await startStaticServer({ directory: deps.bundleDirectory, port });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw error;
    throw new StartupFailure(
      `El puerto ${port} ya está en uso. Libéralo o elige otro con la variable TABLERO_PUERTO.`,
    );
  }
}

async function openOrWarn({ openBrowser, log }: StartupDeps, url: string): Promise<void> {
  try {
    await openBrowser(url);
  } catch {
    log(`No se pudo abrir el navegador. Abre ${url} a mano.`);
  }
}

/** Deja el bundle al día, sirve el tablero en `LOCAL_ADDRESS` y, salvo que se pida lo contrario, abre el navegador. */
export async function start(deps: StartupDeps): Promise<Server> {
  const { port, openBrowser } = readConfig(deps.env);
  await ensureBundle(deps);
  const server = await listen(deps, port);
  const { port: actualPort } = server.address() as { port: number };
  const url = `http://${LOCAL_ADDRESS}:${actualPort}/`;
  deps.log(`Tablero en ${url}`);
  if (openBrowser) await openOrWarn(deps, url);
  return server;
}
