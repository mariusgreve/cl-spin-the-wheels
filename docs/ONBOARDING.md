# Onboarding

This project is currently at the specification stage. The implementation path below becomes executable when the React scaffold is added.

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
3. Once `package.json` exists, run `pnpm install`.
4. Run the verified development command and open the app at a mobile viewport.
5. Run lint, typecheck, unit tests, and browser tests when those scripts exist.

## First implementation milestone

M0 is complete when the React app boots, loads a bundled level JSON file, validates it, and shows a clear blocking error for malformed content. See the PRD, DEVSPEC, and TESTSPEC for exact criteria.

## Where to read next

- [SETUP.md](SETUP.md) for the manual command path and troubleshooting.
- [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md) for level and media content.
- [AI_AGENT_PLAYBOOK.md](AI_AGENT_PLAYBOOK.md) for collaboration and approval boundaries.

## Changelog

2026-09-21 — GitHub Copilot — Initial onboarding guide adapted for the React web project.
