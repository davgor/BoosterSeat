# Dark Mechanicus board

Repos made from BoosterSeat track work on the [Dark Mechanicus](https://github.com/davgor/DarkMechanicus) board by default. Epics break down into tickets with acceptance criteria, dependencies, and sprint checkpoints. Agents claim and submit tickets over MCP, and you review plans and approve checkpoints in the desktop app. The state lives in the repository under `.darkmechanicus/` and travels with Git.

Until a repo is set up, BoosterSeat is loud about it (see [Where it gets noisy](#where-it-gets-noisy)). The legacy markdown `/board` is still available as an [explicit opt-out](#opting-out).

## Set it up (once per repo)

1. **Install the desktop app** from the [Dark Mechanicus releases](https://github.com/davgor/DarkMechanicus/releases). macOS builds are ad-hoc signed; see [first launch on macOS](https://github.com/davgor/DarkMechanicus/blob/main/docs/runbooks/auto-update.md#first-launch-on-macos).
2. **Track the folder.** Press **+** in the sidebar and pick this repository.
3. **Initialize.** Press **Initialize folder** on the setup screen. It creates `.darkmechanicus/` (`project.json`, `epics/`, `history/`, `profiles/`, and a `.gitignore` that ignores `local/`). Nothing is committed for you: commit `.darkmechanicus/` yourself. The `local/` working database stays out of Git. Ticket keys use the project's key prefix, derived from the folder name (`booster-seat` → `BS-12`).
4. **Connect your agent over MCP.** Copy the snippet from the setup screen into your agent host. It contains machine-specific paths, so keep it in your personal config rather than committing it:
   - **Claude Code** (macOS, packaged app), from the repo root:

     ```bash
     claude mcp add darkmechanicus --env ELECTRON_RUN_AS_NODE=1 -- /Applications/DarkMechanicus.app/Contents/MacOS/DarkMechanicus /Applications/DarkMechanicus.app/Contents/Resources/app.asar/out/main/mcp.js --repo "$PWD"
     ```

   - **Cursor:** add the snippet to the project's `.cursor/mcp.json` (gitignored in this template). Not the global `~/.cursor/mcp.json`: the snippet pins `--repo` to one path, so a global entry would point every other repo at this one.
   - **Roles:** the default `orchestrator` role can plan and run tickets. Use `--role planner` for planning-only sessions. Add `--allow-save` only if agents should save plans without you pressing **Save**.

   Full reference (Windows paths, roles, tools per role, troubleshooting): [Dark Mechanicus MCP setup](https://github.com/davgor/DarkMechanicus/blob/main/docs/runbooks/mcp-setup.md).
5. **Install the agent skills.** Press **Install agent skills** on the MCP card. It writes `.claude/skills/darkmechanicus-*/SKILL.md` (planner, graph planner, orchestrator, worker, reviewer, sprint reporter). Commit them. The same skills are also served as MCP prompts.
6. **Verify.**

   ```bash
   npm run board:check
   ```

   It should print `Dark Mechanicus board: ready`. Then ask your agent to call `get_capabilities`: it must report this repository's root and `initialized: true`.

Never copy another repository's `.darkmechanicus/` into a new repo: it would share that repo's project id. BoosterSeat ships without one for exactly this reason. Initialize fresh.

## Where it gets noisy

Every touchpoint warns. None of them fail by default.

| Touchpoint | When Dark Mechanicus is not set up |
|------------|------------------------------------|
| Claude Code session start | `.claude/settings.json` SessionStart hook shows you a warning and tells the agent to stop board work and tell you |
| Cursor | `.cursor/rules/delivery-standards.mdc` (always applied) makes the agent run `npm run board:check` first |
| Agent skills | `delivery-standards` and `complete-ticket` run a preflight and stop with a warning instead of falling back to `/board` |
| `npm install` / `npm ci` | `prepare` prints the banner |
| `npm run dev` | `predev` prints the banner |
| `git commit` | `.husky/pre-commit` prints the banner |
| CI | The `board` job in `pr-checks.yml` adds warning annotations and a job summary |

Agents are told that only you opt the repo out or set it up. They should offer, never flip `.boosterseatrc.json` or call `initialize_repository` on their own.

Remote and cloud agents (Cursor cloud, Claude Code on the web) usually cannot reach the Dark Mechanicus MCP server on your machine, so they stop at the preflight. Do board work in a local session, or waive board tracking for that task.

To make it fail instead of warn, pass `--strict`. For example, change the CI step to `node scripts/check-darkmechanicus.mjs --github --strict` and add `board` to the required status checks for `main`.

## What the check looks at

`scripts/check-darkmechanicus.mjs` (`npm run board:check`):

- Reads the board mode from `.boosterseatrc.json` (`"board": "darkmechanicus"` is the default; an unknown value falls back to it with a warning).
- Requires `.darkmechanicus/` to be a real directory, and `project.json` to be a real file that passes the rules Dark Mechanicus applies when it reads it: format, version, project id, name, key prefix, and created date; no unknown keys; no merge-conflict markers.
- Requires `local/` (the working database) to be ignored. Inside a git repository it asks git, so every ignore file and negation counts. It also flags `local/` files that are already committed, and a rule that ignores `.darkmechanicus/` itself. Without git, it reads `.darkmechanicus/.gitignore`.
- Warns about markdown tickets still open in `board/backlog/` or `board/in-progress/`, because Dark Mechanicus does not see them.

It cannot tell whether your agent's MCP connection works. The skills check that with `get_capabilities`.

Options: `--hook` (Claude Code SessionStart JSON), `--github` (annotations and step summary), `--strict` (exit 1 when not set up).

## How work flows

1. **Plan.** An agent (planner skill) or you create an epic and its tickets in a draft. A person reviews the plan graph and presses **Save**, unless the session has `--allow-save`.
2. **Run.** The orchestrator starts a run on the saved revision and claims ready tickets. Readiness comes from dependencies and is computed by the server.
3. **Implement.** TDD, the full verification gate, and the red-team review, exactly as before (`.ai-instructions.md`).
4. **Submit and accept.** The attempt is submitted with evidence (one check result per gate, one result per acceptance criterion). It is then accepted or rejected by the orchestrator or a reviewer session.
5. **Checkpoint.** At the end of each sprint the orchestrator files a report and waits. Only a person can approve it, in the desktop app.

The agent-side details are in the [`complete-ticket`](../.claude/skills/complete-ticket/SKILL.md) skill.

## Opting out

Set the markdown board in `.boosterseatrc.json`:

```json
{
  "board": "markdown"
}
```

Every check then goes quiet, and the skills use the markdown `/board` flow (`backlog/` → `in-progress/` → `done/`, including `collapse-epic`).

Keep `scripts/check-darkmechanicus.mjs` either way. `prepare`, `predev`, `.husky/pre-commit`, the `board` CI job, and the SessionStart hook in `.claude/settings.json` all call it. If you delete it, remove those calls too.
