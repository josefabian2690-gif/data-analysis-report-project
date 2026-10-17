import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { crearHistorial } from './historial';
import { textos } from './textos';
import './estilos.css';

const raiz = document.getElementById('raiz');
if (!raiz) {
  throw new Error('index.html no define el contenedor #raiz');
}

document.title = textos.titulo;

const historial = crearHistorial((url, init) => fetch(url, init));

createRoot(raiz).render(
  <StrictMode>
    <App historial={historial} />
  </StrictMode>,
);
