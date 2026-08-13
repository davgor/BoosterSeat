# Using BoosterSeat as a template

This repo is meant to be copied, renamed, and hollowed out — keep the process, replace the product.

## Fast path

1. **Create the new repo** from this one (GitHub “Use this template”, or clone + `git remote set-url`).
2. **Rename the package** in `package.json` (`name`, `description`, `repository.url`).
3. **Swap branding** in `index.html` title, `src/App.tsx` brand text, and `src/index.css` tokens if you want a new look.
4. **Replace `src/`** with your CRUD domain (keep `src/test/`, or adapt it). Leave `fireguard/`, `.github/`, `.cursor/`, `.claude/`, `board/`, and `scripts/` unless you have a reason.
5. **Reset the board** — archive or delete done tickets; start a new `001-*.md` epic for the product.
6. **Refresh deadcode baseline** after the first real app lands:
   ```bash
   npm run deadcode:refresh
   ```
7. **Enable GitHub settings**
   - Pages → Source = **GitHub Actions**
   - Branch protection on `main` requiring CI Checks jobs: `test`, `fireguard`, `lint`, `build`
8. **Run the gate once**:
   ```bash
   npm install
   npm run lint && npm run format:check && npm run test:unit && npm run type-check && npm run deadcode && npm run build
   ```

## What to keep vs replace

| Keep | Usually replace |
|------|-----------------|
| `.github/workflows/*` | `src/pages/*`, `src/components/*`, `src/lib/*` |
| `.cursor/`, `.claude/`, `.ai-instructions.md` | `e2e/*` specs (rewrite to your flows) |
| `board/` workflow + skills | App-specific CSS / copy |
| `fireguard/` + `.fireguardrc.json` | `.tsprune-ignore` body (refresh) |
| `scripts/deadcode-*.mjs`, `bump-minor-version.mjs` | Deploy host if not GitHub Pages |

## Deploy options

### Default: GitHub Pages (static SPA)

Already wired in `.github/workflows/deploy.yml`. Project sites get `BASE=/<repo>/` automatically.

### Swap to another host

Delete or disable `deploy.yml`, then add your host’s workflow (Vercel/Netlify/Fly/Railway/etc.). Keep `assert:dist` if you still ship a Vite `dist/` static build.

### Electron / desktop

Borrow packaging + release jobs from [CapitalGains](https://github.com/davgor/CapitalGains) (electron-vite, Win/Mac package, GitHub Release, auto-update). Keep this repo’s board/skills/fireguard/deadcode scripts; change `pr-checks` runners if you need Windows for native modules.

## Agent workflow reminder

1. Ticket on `/board` (or update an epic)
2. TDD → implement
3. Full verification gate in `.ai-instructions.md`
4. `antagonistic-pr-review` before merge-ready
5. Check off criteria; move ticket to `done/`

## Optional: Cursor cloud environment

Add `.cursor/environment.json` in the new repo if you want cloud agents to install/start automatically, for example:

```json
{
  "install": "npm ci",
  "start": "npm run dev -- --host 0.0.0.0 --port 5173"
}
```
