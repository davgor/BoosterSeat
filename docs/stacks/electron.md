# Electron / desktop stack

BoosterSeat defaults to a **web SPA**. For a desktop app, keep the process layer (board, skills, fireguard, CI quality gates) and swap the app/runtime toward the [CapitalGains](https://github.com/davgor/CapitalGains) shape.

## What to keep from BoosterSeat

- `.cursor/`, `.claude/`, `.ai-instructions.md`, red-team + delivery skills
- `/board` ticket workflow
- `fireguard/` + `.fireguardrc.json`
- `scripts/deadcode-*.mjs`, `scripts/bump-minor-version.mjs`
- PR checks / deadcode / security-audit / auto-revert *ideas* (adjust runners)

## What to add / replace

| Need | Steal from CapitalGains |
|------|-------------------------|
| Bundler | `electron-vite` + `electron.vite.config.ts` |
| Layout | `src/main`, `src/preload`, `src/renderer` |
| Packaging | `electron-builder` (`package:win`, `package:mac`) |
| Releases | Deploy after CI Checks → bump minor → package Win/Mac → GitHub Release |
| Auto-update | `electron-updater` + `docs/runbooks/auto-update.md` pattern |
| Deadcode projects | Dual `tsconfig.node.json` + `tsconfig.web.json` in deadcode scripts |

Starter files (copy-ready): [`templates/electron/`](../../templates/electron/)  
Deploy workflow stub: [`templates/electron/deploy.yml`](../../templates/electron/deploy.yml) (also under `.github/workflow-templates/`)

## Conversion checklist

1. Add Electron deps (`electron`, `electron-vite`, `electron-builder`, `electron-updater`, `electron-log` as needed).
2. Split code into main / preload / renderer; **never** enable `nodeIntegration` in the renderer.
3. Keep `contextIsolation: true` and expose APIs only via a typed preload bridge.
4. Point Vitest / fireguard `include` at renderer + shared + main test globs.
5. **Update deadcode `PROJECTS`** in `scripts/deadcode-check.mjs` and `scripts/deadcode-refresh.mjs` to both Electron tsconfigs (`tsconfig.node.json` + `tsconfig.web.json`, as in CapitalGains). Leaving the SPA-only `tsconfig.json` entry is a silent false sense of coverage.
6. Replace Pages `deploy.yml` with the Electron release workflow template; keep `[skip ci]` on version bumps.
7. Move `pr-checks` `test`/`build` to `windows-latest` if native modules (e.g. `better-sqlite3`) require it; keep fireguard on Ubuntu.
8. Drop Playwright *or* keep it only for renderer flows you can drive headlessly; CapitalGains relies more on Vitest for engine code.
9. Document auto-update behavior in `docs/runbooks/auto-update.md`.
10. Red-team must review Electron security (preload surface, shell opens, remote content).

## Security baseline (do not waive)

- `contextIsolation: true`
- `nodeIntegration: false` in BrowserWindow webPreferences
- No raw `remote` module
- Validate any path / URL before `shell.openExternal`
- Secrets only via OS keychain / env at runtime — never bake into the asar for production credentials

## Red team angles for Electron

Before completion, red-team must poke at:

- Privileged APIs leaking through preload
- `shell.openExternal` / navigation to untrusted URLs
- Auto-update authenticity (GitHub Releases owner/repo mismatch)
- Native module ABI / packaging only tested on one OS
- Devtools or debug flags left enabled in production builds
