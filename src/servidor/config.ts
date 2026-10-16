import { StartupFailure } from './startup-failure';

export type Env = Readonly<Record<string, string | undefined>>;

export interface Config {
  port: number;
  openBrowser: boolean;
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

export function readConfig(env: Env): Config {
  return {
    port: readPort(env['TABLERO_PUERTO']),
    openBrowser: env['TABLERO_SIN_NAVEGADOR'] !== '1',
  };
}
