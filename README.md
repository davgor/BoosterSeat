# BoosterSeat

Quick-start template to copy when spinning up a new CRUD app. Steals the battle-tested process from [CapitalGains](https://github.com/davgor/CapitalGains) and [davgor.github.io](https://github.com/davgor/davgor.github.io): CI/CD, fireguard, board tickets, Cursor/Claude skills, and a replaceable Vite + React + TypeScript CRUD scaffold.

## What you get

| Layer | Contents |
|-------|----------|
| **App scaffold** | Vite + React + TS localStorage CRUD (`Items` + `About`) |
| **Agent process** | `.ai-instructions.md`, delivery + **red-team** skills/rules (Cursor + Claude) |
| **Board** | `/board/{backlog,in-progress,done}` markdown tickets |
| **Quality gates** | ESLint (0 warnings), Prettier, Vitest, Fireguard, ts-prune deadcode, Playwright |
| **CI** | PR checks, deadcode, security audit, Playwright, auto-revert on main CI failure |
| **Deploy** | GitHub Pages via Actions + production HTML smoke check |
| **Stack playbooks** | React Pages (default) + Electron conversion docs/templates under `templates/` |
| **PR template** | Red-team + verification checklist (`.github/PULL_REQUEST_TEMPLATE.md`) |

How to fork this into a real product: [`docs/using-this-template.md`](docs/using-this-template.md).  
Stack guides: [`docs/stacks/react-pages.md`](docs/stacks/react-pages.md) · [`docs/stacks/electron.md`](docs/stacks/electron.md).  
Copy-ready files: [`templates/`](templates/).

## Engineering process

- **TDD-first.** Tests before implementation for components, pages, stores, and helpers. See `.cursor/skills/delivery-standards/SKILL.md`.
- **Strict lint.** ESLint `--max-warnings 0`. Never relax rules to make code pass — fix the code. After edits: follow [`.ai-instructions.md`](.ai-instructions.md).
- **TypeScript strict.** No `any` escapes.
- **Red team review (mandatory).** Before merge-ready / ticket `done`, run `red-team-review` (alias: `antagonistic-pr-review`), post on the PR, and fix every **Blocking** finding — including on agent-authored PRs. See [`.ai-instructions.md`](.ai-instructions.md) step 11.
- **CI parity.** Local runs use [`nektos/act`](https://github.com/nektos/act) for Actions parity when Docker/`act` are available. Agentic cloud runs skip `act`, open a **draft** PR, and mark it **ready for review** only when CI Checks (`test`, `fireguard`, `lint`, `build`) are green. See [`.ai-instructions.md`](.ai-instructions.md).
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

## Electron

Not the default runtime. Use [`docs/stacks/electron.md`](docs/stacks/electron.md) and copy files from [`templates/electron/`](templates/electron/) (window/preload snippets, scripts, `deploy.yml`, auto-update runbook) when you need Win/Mac releases.
