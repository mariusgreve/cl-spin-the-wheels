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
6. Run browser tests when the browser-test script is added.

## First implementation milestone

M0 is complete and verified: the React app boots, loads `src/assets/levels/level-1.json`, validates it with the level loader, and has focused tests for malformed content. M1 adds interactive spinning and media playback. See the PRD, DEVSPEC, and TESTSPEC for exact criteria.

## Where to read next

- [SETUP.md](SETUP.md) for the manual command path and troubleshooting.
- [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md) for level and media content.
- [AI_AGENT_PLAYBOOK.md](AI_AGENT_PLAYBOOK.md) for collaboration and approval boundaries.

## Changelog

2026-09-21 — GitHub Copilot — Initial onboarding guide adapted for the React web project.
2026-09-21 — GitHub Copilot — Updated setup steps and milestone status after implementing the M0 scaffold.
