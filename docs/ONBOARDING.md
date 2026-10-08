# Onboarding

The M0 React web scaffold is implemented. The app currently boots a bundled sample level and validates its schema and local asset references before showing the ready screen.

## Supported environment

Use the local repository in VS Code or a terminal on macOS, Linux, or Windows. The project is a normal React web app; no native mobile toolchain, emulator, CMS account, or host application is required.

## Prerequisites

- Git
- Node.js LTS
- pnpm
- A modern browser with responsive/mobile viewport emulation

## Get started

1. Open the repository root.
2. Read [AGENTS.md](../AGENTS.md), [README.md](../README.md), and [specs/README.md](../specs/README.md).
3. Run `pnpm install`.
4. Run `pnpm dev` and open the printed local URL at a mobile viewport.
5. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
6. Run `pnpm test:e2e` for the Playwright browser acceptance suite.

## Current project state

The app has completed the M3 Better and M4 Great gameplay tiers, and M5 release sign-off is recorded, including browser E2E coverage and an Android emulator smoke run. M6 has improved the standalone mobile UX and added a provisional learning-target sequence, but its word lists and sequence have not been reviewed by a literacy expert. M6-06 is blocked on that input; visual-family review and human accessibility/comprehension checks also remain open. See the [M6 tracker](tasks/M6-UX-IMPROVEMENT.md) for evidence and limits. Treat the app and its content as an implementation example, not as approved curriculum or official brand guidance.

For the product intent and constraints, follow the [specification chain](../specs/README.md): PRD -> DEVSPEC -> UISPEC -> TESTSPEC. M6 is the current improvement work; M3-M5 records explain how the gameplay and release gates were built and verified.

## Where to read next

- [SETUP.md](SETUP.md) for the manual command path and troubleshooting.
- [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md) for level and media content.
- [tasks/M6-UX-IMPROVEMENT.md](tasks/M6-UX-IMPROVEMENT.md) for current status, verification evidence, and open review gates.
- [AI_AGENT_PLAYBOOK.md](AI_AGENT_PLAYBOOK.md) for collaboration and approval boundaries.

## Changelog

2026-10-08 — GitHub Copilot — Reconciled onboarding status and verification steps with completed M5 release evidence and current M6 gates.
2026-09-21 — GitHub Copilot — Initial onboarding guide adapted for the React web project.
2026-09-21 — GitHub Copilot — Updated setup steps and milestone status after implementing the M0 scaffold.
