import { spawn } from 'node:child_process';
import { join } from 'node:path';
import open from 'open';
import { readTimes } from './read-times';
import { start } from './startup';
import { StartupFailure } from './startup-failure';

// `npm start` corre desde la raíz del proyecto.
const root = process.cwd();
const bundleDirectory = join(root, 'dist');
const sourceEntries = ['src', 'index.html', 'vite.config.mts', 'package-lock.json'];

function buildBundle(): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(join(root, 'node_modules', '.bin', 'vite'), ['build'], {
      cwd: root,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
}

start({
  env: process.env,
  bundleDirectory,
  readTimes: () =>
    readTimes({ root, bundleFile: join('dist', 'index.html'), sources: sourceEntries }),
  buildBundle,
  openBrowser: (url) => open(url),
  log: (message) => console.log(message),
}).catch((error: unknown) => {
  console.error(error instanceof StartupFailure ? error.message : error);
  process.exitCode = error instanceof StartupFailure ? error.exitCode : 1;
});
