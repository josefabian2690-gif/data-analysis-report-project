import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/cliente/App';
import { textos } from '../../src/cliente/textos';

describe('página del tablero', () => {
  it('muestra al analista el título del tablero como encabezado', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: textos.titulo })).toBeInTheDocument();
  });
});
