import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { textos } from './textos';

const raiz = document.getElementById('raiz');
if (!raiz) {
  throw new Error('index.html no define el contenedor #raiz');
}

document.title = textos.titulo;

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
