# Using BoosterSeat as a template

This repo is meant to be copied, renamed, and hollowed out — keep the process, replace the product.

## Pick a stack first

| Target | Start here |
|--------|------------|
| **React pages / SPA** (default) | [`docs/stacks/react-pages.md`](stacks/react-pages.md) + [`templates/react-pages/`](../templates/react-pages/) |
| **Electron desktop** | [`docs/stacks/electron.md`](stacks/electron.md) + [`templates/electron/`](../templates/electron/) |
| **Deep-link 404s on Pages** | [`templates/react-pages/copy-404-fallback.mjs`](../templates/react-pages/copy-404-fallback.mjs) |
| **PR / red-team checklist** | [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) |

## Fast path (React SPA)

1. **Create the new repo** from this one (GitHub “Use this template”, or clone + `git remote set-url`).
2. **Rename the package** in `package.json` (`name`, `description`, `repository.url`).
3. **Swap branding** in `index.html` title, `src/App.tsx` brand text, and `src/index.css` tokens if you want a new look.
4. **Replace `src/`** with your CRUD domain (keep `src/test/`, or adapt it). Leave `fireguard/`, `.github/`, `.cursor/`, `.claude/`, `.boosterseatrc.json`, and `scripts/` unless you have a reason.
5. **Set up Dark Mechanicus** (required; everything warns until you do). Follow [`docs/dark-mechanicus.md`](dark-mechanicus.md): track the folder in the desktop app, initialize, commit `.darkmechanicus/`, connect your agent over MCP, and install the agent skills. Then plan the product's first epic there. Delete the template's `board/` directory, since its tickets are BoosterSeat history.
   - Opting out instead: set `"board": "markdown"` in `.boosterseatrc.json`, delete the done tickets in `board/done/`, and start a new `001-*.md` epic.
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
   npm run board:check && npm run lint && npm run format:check && npm run test:unit && npm run type-check && npm run deadcode && npm run build
   ```

## What to keep vs replace

| Keep | Usually replace |
|------|-----------------|
| `.github/workflows/*` (or Electron template) | `src/pages/*`, `src/components/*`, `src/lib/*` |
| `.cursor/`, `.claude/`, `.ai-instructions.md` | `e2e/*` specs (rewrite to your flows) |
| Board skills + `.boosterseatrc.json` + board check (incl. **red-team-review**) | App-specific CSS / copy |
| `fireguard/` + `.fireguardrc.json` | `.tsprune-ignore` body (refresh) |
| `scripts/deadcode-*.mjs`, `bump-minor-version.mjs` | Deploy host if not GitHub Pages / Electron |

## Deploy options

### Default: GitHub Pages (static SPA)

Already wired in `.github/workflows/deploy.yml`. Project sites get `BASE=/<repo>/` automatically.

### Swap to another host

Delete or disable `deploy.yml`, then add your host’s workflow (Vercel/Netlify/Fly/Railway/etc.). Keep `assert:dist` if you still ship a Vite `dist/` static build.

### Electron / desktop

Follow [`docs/stacks/electron.md`](stacks/electron.md). Replace Pages deploy with the Electron release template; keep the board check, skills, fireguard, and deadcode.

## Agent workflow reminder

1. `npm run board:check` — if Dark Mechanicus is not set up, the agent stops and tells you
2. Ticket on the Dark Mechanicus board (or update an epic draft; a person presses **Save**)
3. Claim → TDD → implement
4. Full verification gate in `.ai-instructions.md` (steps 1–10)
5. **Red team review** (`.ai-instructions.md` step 11 / `red-team-review` skill) before merge-ready — fix Blocking findings
6. Submit with evidence; accept only when every criterion is verified; a person approves sprint checkpoints in the desktop app

(Markdown opt-out: ticket on `/board`, check off criteria, move it to `done/`.)

## Optional: Cursor cloud environment

`.cursor/environment.json` is already present for install/start. For Electron, change `start` to your `electron-vite` / `npm run dev` desktop command and ensure the cloud image has any native build tooling you need.
