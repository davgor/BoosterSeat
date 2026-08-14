/**
 * GitHub Pages SPA deep-link fallback: copy production index to 404.html.
 * Run after `vite build` (see package-scripts.snippet.json).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'dist', 'index.html');
const notFoundPath = join(root, 'dist', '404.html');

if (!existsSync(indexPath)) {
  console.error('dist/index.html missing — run build first');
  process.exit(1);
}

copyFileSync(indexPath, notFoundPath);
console.log('Wrote dist/404.html (SPA fallback for GitHub Pages)');
