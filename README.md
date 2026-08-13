# BoosterSeat

Quick-start template to copy when spinning up a new CRUD app. Steals the battle-tested process from [CapitalGains](https://github.com/davgor/CapitalGains) and [davgor.github.io](https://github.com/davgor/davgor.github.io): CI/CD, fireguard, board tickets, Cursor/Claude skills, and a replaceable Vite + React + TypeScript CRUD scaffold.

## What you get

| Layer | Contents |
|-------|----------|
| **App scaffold** | Vite + React + TS localStorage CRUD (`Items` + `About`) |
| **Agent process** | `.ai-instructions.md`, `.cursor/` + `.claude/` skills, always-on delivery rule |
| **Board** | `/board/{backlog,in-progress,done}` markdown tickets |
| **Quality gates** | ESLint (0 warnings), Prettier, Vitest, Fireguard, ts-prune deadcode, Playwright |
| **CI** | PR checks, deadcode, security audit, Playwright, auto-revert on main CI failure |
| **Deploy** | GitHub Pages via Actions + production HTML smoke check |

How to fork this into a real product: [`docs/using-this-template.md`](docs/using-this-template.md).

## Engineering process

- **TDD-first.** Tests before implementation for components, pages, stores, and helpers. See `.cursor/skills/delivery-standards/SKILL.md`.
- **Strict lint.** ESLint `--max-warnings 0`. Never relax rules to make code pass — fix the code. After edits: follow [`.ai-instructions.md`](.ai-instructions.md).
- **TypeScript strict.** No `any` escapes.
- **Antagonistic PR review.** Before merge-ready, run `antagonistic-pr-review` and fix every **Blocking** finding — including on agent-authored PRs.
- **Ticket board.** Work under `/board` (`backlog/` → `in-progress/` → `done/`). Epics `NNN-*.md`, sub-tickets `NNN.M-*.md`. Skills: `complete-ticket`, `collapse-epic`.
- **No secrets committed.** `.env` stays gitignored.

## Commands

```bash
npm install
npm run dev          # Vite on :5173
npm run test:unit    # Vitest (app + fireguard + scripts)
npm run fireguard    # Grade new unit tests (A–F); F fails CI
npm run test:e2e     # Playwright
npm run lint         # ESLint (max-warnings 0)
npm run format       # Prettier write
npm run format:check
npm run type-check
npm run deadcode     # ts-prune vs .tsprune-ignore
npm run deadcode:refresh
npm run build
npm run assert:dist  # after build — production HTML shape
```

## CI

`.github/workflows/pr-checks.yml` (**CI Checks**) on every PR to `main` and every push to `main`:

- `test` — `npm run test:unit`
- `fireguard` — grades **new** Vitest unit tests vs `main`; letter **F** fails; sticky PR comment
- `lint` — `npm run lint` + `npm run format:check`
- `build` — `npm run type-check` && `npm run build`

Also included:

- `deadcode.yml` — ts-prune vs `.tsprune-ignore`
- `security-audit.yml` — `npm audit`, fails on moderate+
- `playwright.yml` — e2e
- `auto-revert.yml` — reverts `main` when CI Checks fails
- `deploy.yml` — GitHub Pages from the Vite `dist/` artifact

Commits with `[skip ci]` skip push-triggered CI / deadcode / playwright / deploy gates.

Treat `test`, `fireguard`, `lint`, and `build` as **required status checks** for `main`.

## GitHub Pages

**Required:** repo **Settings → Pages → Build and deployment → Source = GitHub Actions** (not “Deploy from a branch”).

Deploy sets `BASE=/<repo-name>/` for project pages. After deploy, the workflow asserts `dist/index.html` (and the live URL) look like a production Vite build, not the `/src/main.tsx` dev entry.
