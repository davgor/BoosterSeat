# EPIC: Engineering delivery standards

Seed process for this booster-seat template. Mirrored from [davgor.github.io](https://github.com/davgor/davgor.github.io) and [CapitalGains](https://github.com/davgor/CapitalGains).

Agents treat this epic as the standing bar for all implementation work: TDD-first, lint/unit/build/deadcode/fireguard before done, `/board` traceability, and antagonistic PR review before merge-ready.

## Acceptance criteria

- [x] `delivery-standards`, `complete-ticket`, `collapse-epic`, `red-team-review`, and `antagonistic-pr-review` (alias) skills exist under `.cursor/skills/` and `.claude/skills/`
- [x] Skills encode TDD + lint/format/unit/fireguard/type-check/deadcode/build (+ e2e when UI changes) + board updates + **mandatory red-team review before completion**
- [x] `.cursor/rules/delivery-standards.mdc` and `.cursor/rules/red-team-review.mdc` exist with `alwaysApply: true`
- [x] `/board` has `backlog/`, `in-progress/`, and `done/`
- [x] PR CI + deadcode + security-audit + playwright + deploy + auto-revert workflows exist
- [x] README documents the engineering process and how to copy this template
- [x] Stack playbooks exist for React Pages and Electron conversion
