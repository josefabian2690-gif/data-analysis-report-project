import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { Almacen } from './almacen-de-umbrales';
import { descargarEnElNavegador } from './descargar';
import { crearHistorial } from './historial';
import { textos } from './textos';
import './estilos.css';

const raiz = document.getElementById('raiz');
if (!raiz) {
  throw new Error('index.html no define el contenedor #raiz');
}

document.title = textos.titulo;

const historial = crearHistorial((url, init) => fetch(url, init));

function almacenDelNavegador(): Almacen | undefined {
  try {
    return window.localStorage;
  } catch {
    // El acceso a `localStorage` puede lanzar: sin almacén, los umbrales viven en memoria.
    return undefined;
  }
}

createRoot(raiz).render(
  <StrictMode>
    <App historial={historial} almacen={almacenDelNavegador()} descargar={descargarEnElNavegador} />
  </StrictMode>,
);
