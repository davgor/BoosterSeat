# React Pages templates

Copy into a BoosterSeat-based SPA when you need deep-link support or API env wiring.

## Files

| File | Copy to | Purpose |
|------|---------|---------|
| `copy-404-fallback.mjs` | `scripts/copy-404-fallback.mjs` | After build, `dist/index.html` → `dist/404.html` for Pages SPA refresh |
| `env.example` | `.env.example` | Document `VITE_*` vars (never commit real secrets) |
| `package-scripts.snippet.json` | merge into `package.json` `scripts` | Wire `postbuild` / assert |

Also see [`docs/stacks/react-pages.md`](../../docs/stacks/react-pages.md).

## Enable 404 fallback

1. Copy `copy-404-fallback.mjs` → `scripts/`
2. Merge scripts from `package-scripts.snippet.json`
3. Ensure deploy uploads `dist/` (already true for Pages workflow)
4. Red-team: hard-refresh a nested client route on the live Pages URL
