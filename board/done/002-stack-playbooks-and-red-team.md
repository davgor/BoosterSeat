# EPIC: Stack playbooks + mandatory red-team gate

Add Electron / React Pages spin-up docs and make red-team review a hard AI completion requirement (not optional polish).

## Acceptance criteria

- [x] `docs/stacks/react-pages.md` documents SPA/Pages checklist and red-team angles
- [x] `docs/stacks/electron.md` documents conversion checklist + security baseline
- [x] `.github/workflow-templates/electron-deploy.yml` provides a copy-paste Electron release workflow
- [x] `templates/react-pages/` and `templates/electron/` copy kits exist (404 fallback, env example, Electron window/preload/scripts/deploy/runbook)
- [x] `.github/PULL_REQUEST_TEMPLATE.md` includes verification + red-team checklist
- [x] `.ai-instructions.md` step 11 requires red-team review before completion
- [x] `red-team-review` skill + alwaysApply Cursor rule exist (Cursor + Claude); antagonistic skill aliases it
- [x] `delivery-standards` / `complete-ticket` / README / template docs reference the red-team gate
