import { resolve } from 'node:path';
import { StartupFailure } from './startup-failure';

export type Env = Readonly<Record<string, string | undefined>>;

export interface Config {
  port: number;
  openBrowser: boolean;
  historyDirectory: string;
}

const DEFAULT_PORT = 4310;
const MAX_PORT = 65535;

function readPort(value: string | undefined): number {
  if (value === undefined) return DEFAULT_PORT;
  const port = /^\d+$/.test(value) ? Number(value) : NaN;
  if (port > MAX_PORT || Number.isNaN(port)) {
    throw new StartupFailure(
      `TABLERO_PUERTO debe ser un número de puerto entre 0 y ${MAX_PORT}; se recibió «${value}».`,
    );
  }
  return port;
}

function readHistoryDirectory(value: string | undefined, root: string): string {
  if (value === undefined) return resolve(root, 'historial');
  if (value === '') {
    throw new StartupFailure(
      'TABLERO_HISTORIAL debe ser la ruta de una carpeta; se recibió un valor vacío.',
    );
  }
  return resolve(root, value);
}

export function readConfig(env: Env, root: string): Config {
  return {
    port: readPort(env['TABLERO_PUERTO']),
    openBrowser: env['TABLERO_SIN_NAVEGADOR'] !== '1',
    historyDirectory: readHistoryDirectory(env['TABLERO_HISTORIAL'], root),
  };
}
