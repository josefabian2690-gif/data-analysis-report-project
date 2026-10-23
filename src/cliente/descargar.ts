/** Entrega un archivo HTML al analista: el navegador lo guarda con ese nombre. */
export type Descargar = (nombre: string, html: string) => void;

export const descargarEnElNavegador: Descargar = (nombre, html) => {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
};
