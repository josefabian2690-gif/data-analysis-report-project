import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import open from 'open';
import type { BundleTimes } from './needs-build';
import { start } from './startup';
import { StartupFailure } from './startup-failure';

// `npm start` corre desde la raíz del proyecto.
const root = process.cwd();
const bundleDirectory = join(root, 'dist');
const sourceEntries = ['src', 'index.html', 'vite.config.mts', 'package-lock.json'];

async function modifiedTime(path: string): Promise<number | undefined> {
  try {
    return (await stat(path)).mtimeMs;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function expandSources(entry: string): Promise<string[]> {
  const path = join(root, entry);
  const isDirectory = (await stat(path).catch(() => undefined))?.isDirectory() ?? false;
  if (!isDirectory) return [path];
  const inside = await readdir(path, { recursive: true });
  return [path, ...inside.map((name) => join(path, name))];
}

async function readTimes(): Promise<BundleTimes> {
  const paths = (await Promise.all(sourceEntries.map(expandSources))).flat();
  const times = await Promise.all(paths.map(modifiedTime));
  return {
    bundle: await modifiedTime(join(bundleDirectory, 'index.html')),
    sources: times.filter((time) => time !== undefined),
  };
}

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
  readTimes,
  buildBundle,
  openBrowser: (url) => open(url),
  log: (message) => console.log(message),
}).catch((error: unknown) => {
  console.error(error instanceof StartupFailure ? error.message : error);
  process.exitCode = error instanceof StartupFailure ? error.exitCode : 1;
});
