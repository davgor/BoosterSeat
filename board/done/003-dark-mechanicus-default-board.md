# EPIC: Dark Mechanicus as the default board

BoosterSeat used the markdown `/board` (`backlog/` → `in-progress/` → `done/`) as its ticket board. New repos made from this template now track work on the [Dark Mechanicus](https://github.com/davgor/DarkMechanicus) board by default: the repo must be initialized (`.darkmechanicus/project.json`) and the agent connected over MCP. When it is not set up, the template is loud about it everywhere a person or agent works: agent session start, `npm install`, `npm run dev`, pre-commit, and CI. The warnings never block a build. The markdown board stays available as an explicit opt-out (`"board": "markdown"` in `.boosterseatrc.json`).

The template itself ships uninitialized on purpose. A copied `.darkmechanicus/project.json` would hand every new repo the template's project id.

## Acceptance criteria

- [x] `scripts/check-darkmechanicus.mjs` reports the board mode from `.boosterseatrc.json` (default `darkmechanicus`; an invalid value falls back to `darkmechanicus` and is reported)
- [x] The check flags a missing `.darkmechanicus/`, a symlinked `.darkmechanicus/`, a missing/unparseable/merge-conflicted/invalid `project.json` (format, version, project id, name, key prefix), and a `.gitignore` that does not ignore `local/`
- [x] The check warns about markdown tickets left in `board/backlog` or `board/in-progress` while in Dark Mechanicus mode
- [x] Output modes: loud text banner (default), Claude Code SessionStart hook JSON (`--hook`), GitHub annotations + step summary (`--github`); exit 0 unless `--strict`. All covered by `scripts/check-darkmechanicus.test.mjs`
- [x] Noise wired in: `.claude/settings.json` SessionStart hook, `prepare` (npm install), `predev`, `.husky/pre-commit`, and a `board` job in `pr-checks.yml`
- [x] Skills updated (Claude + Cursor mirrors): `delivery-standards` and `complete-ticket` require Dark Mechanicus by default, stop loudly when it is missing, and keep the markdown flow as opt-out; `collapse-epic` is scoped to markdown mode; `red-team-review` covers Dark Mechanicus acceptance and claim-token leaks
- [x] Docs updated: `docs/dark-mechanicus.md` (setup, noise points, opt-out), README, `docs/using-this-template.md`, `.ai-instructions.md`, Cursor rules, PR template
- [x] Gate: lint, format:check, test:unit, type-check, deadcode, build pass
- [x] Red team review run; Blocking findings fixed

## Notes

- Red team review (independent subagent): first pass REQUEST CHANGES. One Blocking item: a symlinked script path silently skipped the check, even with `--strict`. There were also should-fixes: mirror cross-references, a commit-rule contradiction, the project.json schema drift, workflow-command injection, agent self-opt-out, and Cursor MCP scope. All were fixed with tests. The follow-up pass found no Blocking items. Its remaining should-fixes (the Cursor commit rule and the null epic branch) and nits (exact `createdAt` validation, the git `rev-parse` guard, a symlink test `skipIf`) are fixed too. There was no PR, so the review was not posted to GitHub.
- Fireguard excludes `scripts/**`, so the board-check tests were hand-mutation-tested instead (28 mutants, all killed).
- Open decision for the owner: a local, non-shipping opt-out for working on BoosterSeat itself, which stays noisy because the template ships uninitialized.
