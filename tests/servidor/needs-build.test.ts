import { describe, expect, it } from 'vitest';
import { needsBuild } from '../../src/servidor/needs-build';

describe('decisión de construir el bundle del navegador', () => {
  it('sin bundle construido hay que construir', () => {
    expect(needsBuild({ bundle: undefined, sources: [100, 200] })).toBe(true);
  });

  it('con un bundle más reciente que todas las fuentes no se construye', () => {
    expect(needsBuild({ bundle: 300, sources: [100, 200] })).toBe(false);
  });

  it('con una sola fuente más reciente que el bundle hay que construir', () => {
    expect(needsBuild({ bundle: 150, sources: [100, 200, 120] })).toBe(true);
  });

  it('con la misma fecha en el bundle y en una fuente se trata como al día', () => {
    expect(needsBuild({ bundle: 200, sources: [100, 200] })).toBe(false);
  });

  it('sin fuentes y con bundle no se construye', () => {
    expect(needsBuild({ bundle: 200, sources: [] })).toBe(false);
  });
});
