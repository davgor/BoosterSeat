# React Pages / SPA stack

Default BoosterSeat shape: **Vite + React + TypeScript** static SPA, usually on **GitHub Pages**.

Use this when the product is a browser app (CRUD UI, marketing site, dashboard) without a desktop shell.

## Already wired in this repo

| Piece | Where |
|-------|--------|
| Vite + React + Router | `vite.config.ts`, `src/main.tsx`, `src/App.tsx` |
| `BASE` / project-pages path | `vite.config.ts` + deploy job `BASE: /<repo>/` |
| Production HTML guard | `scripts/assert-dist-index.mjs`, `src/deploy/assertProductionHtml.ts` |
| `.nojekyll` | Vite `create-nojekyll` plugin |
| Playwright e2e | `e2e/`, `.github/workflows/playwright.yml` |
| Pages deploy | `.github/workflows/deploy.yml` |

## Checklist when copying for a new React page app

1. Rename package / brand (see `docs/using-this-template.md`).
2. Replace `src/pages`, `src/components`, `src/lib` with your domain.
3. Keep `BrowserRouter` `basename` tied to `import.meta.env.BASE_URL` (already in `src/main.tsx`).
4. Confirm **Settings → Pages → Source = GitHub Actions** (never “Deploy from a branch” → repo root — that ships the Vite *dev* `index.html` and white-screens).
5. For a **user/org site** (`username.github.io` root), set deploy `BASE` to `/` instead of `/<repo>/`.
6. Rewrite `e2e/` to your critical flows; keep at least one smoke that asserts primary nav + one happy path.
7. If you add client-only routes, remember Pages has no server fallback — either:
   - use HashRouter, or
   - add a `404.html` copy of `index.html` for GitHub Pages SPA fallback (not shipped by default; add when you need deep links on refresh).

## Optional SPA additions worth stealing later

- `public/404.html` SPA fallback for deep links on Pages
- Route-level code splitting (`React.lazy`) once the bundle grows
- Env-based API base URL (`VITE_API_URL`) with `.env.example` (never commit secrets)
- Vercel/Netlify: drop Pages `deploy.yml`, keep `assert:dist` if you still ship Vite `dist/`

## Red team angles for React Pages

Before completion, red-team must poke at:

- Dev HTML accidentally deployed (`/src/main.tsx` in live HTML)
- Wrong `base` breaking assets on project pages
- Deep-link refresh 404s
- XSS via `dangerouslySetInnerHTML` / unsanitized URL params
- Auth tokens in `localStorage` without threat notes
