# EPIC: Act testing local-only; cloud draft PR ready-when-green

Clarify CI parity for agents: `act` is for local runs only. Agentic cloud runs open a draft PR and mark it ready for review only after GitHub Actions checks are green.

## Acceptance criteria

- [x] `complete-ticket` (`.cursor` + `.claude`) documents local-only `act` and cloud draft → ready-when-green
- [x] `delivery-standards` skills + `.cursor/rules/delivery-standards.mdc` encode the same split
- [x] `.ai-instructions.md` and README / `docs/using-this-template.md` note the local vs cloud CI path
- [x] Mirrored Cursor/Claude skill copies stay in sync
