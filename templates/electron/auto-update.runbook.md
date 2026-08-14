# Auto-update and releases (Electron)

Packaged builds use **electron-updater** with GitHub Releases as the update server (pattern from CapitalGains).

CI builds with `electron-builder --publish never` (artifacts only). The deploy workflow uploads release **files** only (`latest.yml`, installers, blockmaps, `.dmg`) via `gh release create`; unpacked build folders are not uploaded.

## Versioning

Each successful deploy to `main` runs `scripts/bump-minor-version.mjs` before packaging:

- `0.0.1` → `0.1.0` → `0.2.0`
- Release tag: `v0.1.0`
- Version-bump commits use `[skip ci]` so deploy does not loop

## Local / dev

Auto-update is disabled when `app.isPackaged` is false. Set `DISABLE_AUTO_UPDATE=1` to disable in packaged builds.

## Red team

- Confirm GitHub Releases `owner`/`repo` in electron-builder `publish` match this repository
- Confirm Setup (NSIS) vs portable update expectations are documented for users
