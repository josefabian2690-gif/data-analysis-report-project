import { spawn } from 'node:child_process';

const TOPE_DE_ARRANQUE_MS = 30_000;
const TOPE_DE_PARADA_MS = 10_000;
const AVISO_DE_ARRANQUE = /Tablero en (http:\/\/127\.0\.0\.1:\d+)\//;

export interface ServidorPropio {
  /** `http://127.0.0.1:<puerto>`, el que el sistema operativo asignó al arrancar. */
  origen: string;
  /** Devuelve cuando el proceso ya salió; se puede llamar más de una vez. */
  detener(): Promise<void>;
}

/**
 * Levanta el servidor ya construido (`dist-server/main.mjs`, lo que `npm start` ejecuta tras
 * construir) desde la raíz del repositorio, en un puerto libre que elige el sistema operativo
 * (`TABLERO_PUERTO=0`, que `src/servidor/config.ts` admite) y con el historial en `carpetaDelHistorial`.
 * Si no llega a escuchar, lo detiene y falla con lo que el proceso escribió.
 */
export async function arrancarServidor(carpetaDelHistorial: string): Promise<ServidorPropio> {
  const proceso = spawn(process.execPath, ['dist-server/main.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TABLERO_SIN_NAVEGADOR: '1',
      TABLERO_PUERTO: '0',
      TABLERO_HISTORIAL: carpetaDelHistorial,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const salio = new Promise<void>((resolver) => proceso.once('exit', () => resolver()));

  const servidorPropio = (origen: string): ServidorPropio => ({
    origen,
    async detener() {
      if (proceso.exitCode === null && proceso.signalCode === null) {
        proceso.kill('SIGTERM');
        const forzar = setTimeout(() => proceso.kill('SIGKILL'), TOPE_DE_PARADA_MS);
        await salio;
        clearTimeout(forzar);
      }
    },
  });

  let escrito = '';
  const origen = await new Promise<string>((resolver, rechazar) => {
    const reloj = setTimeout(
      () => rechazar(new Error(`El servidor no escuchó en ${TOPE_DE_ARRANQUE_MS} ms.\n${escrito}`)),
      TOPE_DE_ARRANQUE_MS,
    );
    const fallar = (error: Error) => {
      clearTimeout(reloj);
      rechazar(error);
    };
    proceso.stdout.on('data', (trozo: Buffer) => {
      escrito += trozo.toString();
      const aviso = AVISO_DE_ARRANQUE.exec(escrito);
      if (aviso?.[1] === undefined) return;
      clearTimeout(reloj);
      resolver(aviso[1]);
    });
    proceso.stderr.on('data', (trozo: Buffer) => {
      escrito += trozo.toString();
    });
    proceso.once('error', fallar);
    proceso.once('exit', (codigo) =>
      fallar(new Error(`El servidor salió con código ${codigo} antes de escuchar.\n${escrito}`)),
    );
  }).catch(async (error: unknown) => {
    await servidorPropio('').detener();
    throw error;
  });

  return servidorPropio(origen);
}
