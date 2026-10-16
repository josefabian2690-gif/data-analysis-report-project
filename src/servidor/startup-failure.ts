/** Fallo que termina el arranque: su mensaje se muestra tal cual y `exitCode` es el código de salida. */
export class StartupFailure extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = 'StartupFailure';
    this.exitCode = exitCode;
  }
}
