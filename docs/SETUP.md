# Setup Reference

The repository contains a Vite React TypeScript app with bundled level content. This page records the verified manual path and keeps setup commands aligned with `package.json`.

## Manual path after the scaffold exists

Run commands from the repository root:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

`pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` are verified for the M0 scaffold. `pnpm dev` starts the local Vite server. Browser-based acceptance checks should use a mobile viewport and cover the random spin, reward, vowel constraint, and any implemented Better/Great tier.

## Troubleshooting principles

- If there is no `package.json`, the React scaffold has not been created yet.
- If a level fails to load, inspect the JSON schema, spinner letter sets, word spellability, and media paths before changing gameplay code.
- If a build or test fails, record the exact command and failure rather than declaring the check passed.
- If a runtime asset is missing, fix the bundled content source and regenerate it when a content-generation workflow exists.
- Do not introduce a network service to work around a local asset or loader problem; offline gameplay is a project requirement.

## What is not needed

No credentials, CMS access, native SDK, Android/iOS project, external database, or hosted backend is needed for local development or gameplay.

## Changelog

2026-09-21 — GitHub Copilot — Initial setup and troubleshooting reference adapted for the current project stage.
