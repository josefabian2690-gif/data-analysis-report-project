import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { exigirSinRed, prohibirLaRed } from './cliente/red-prohibida';

beforeEach(prohibirLaRed);

afterEach(() => {
  cleanup();
  exigirSinRed();
});
