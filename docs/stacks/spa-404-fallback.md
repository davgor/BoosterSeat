# Optional SPA deep-link fallback for GitHub Pages

Prefer the copy-ready script in [`templates/react-pages/`](../../templates/react-pages/).

After `npm run build`, run `node scripts/copy-404-fallback.mjs` (or wire `postbuild`) so `dist/404.html` matches production `index.html`. Enable when client routes must survive a hard refresh on project/user Pages.
