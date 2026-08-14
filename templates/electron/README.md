# Electron templates

Copy these when converting BoosterSeat into a desktop app. Full checklist: [`docs/stacks/electron.md`](../../docs/stacks/electron.md).

## Files

| File | Copy / merge to | Purpose |
|------|-----------------|---------|
| `main-window.snippet.ts` | `src/main/` (adapt) | Secure `BrowserWindow` defaults |
| `preload-bridge.snippet.ts` | `src/preload/index.ts` | Minimal typed `contextBridge` |
| `package-scripts.snippet.json` | `package.json` `scripts` + deps notes | `dev` / `package:win` / `package:mac` |
| `deadcode-projects.snippet.mjs` | replace `PROJECTS` in deadcode scripts | Dual Electron tsconfigs |
| `auto-update.runbook.md` | `docs/runbooks/auto-update.md` | Release / updater notes |
| `../../.github/workflow-templates/electron-deploy.yml` | `.github/workflows/deploy.yml` | Win/Mac release after CI |

## Order of operations

1. Add Electron toolchain (`electron`, `electron-vite`, `electron-builder`, …).
2. Restructure to `main` / `preload` / `renderer`; paste security snippets.
3. Update deadcode `PROJECTS` from the snippet.
4. Replace Pages deploy with the Electron workflow template.
5. Red-team preload surface + `shell.openExternal` before first release.
