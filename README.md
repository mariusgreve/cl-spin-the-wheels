# Spin The Wheels

Spin The Wheels is an offline-first early-literacy game for children. Players arrange letters on independently spinning wheels; when the visible letters form a word, the game presents an image and plays that word's pronunciation.

The project is a standalone React web app designed for mobile viewport sizes. It may eventually be embedded in a host page, but the app itself is host-agnostic and must not depend on CMS, Android, iOS, or native APIs.

## Repository map

- `specs/` — product, behavior, UI, and verification specifications.
- `docs/tasks/` — implementation milestones and task status.
- `docs/` — onboarding, operational workflow, architecture decisions, and AI collaboration guidance.
- `AGENTS.md` — standing rules for coding agents.
- `src/` — Vite React TypeScript app, level loader, and bundled sample content.
- `tests/` — reserved for cross-module and browser acceptance tests; focused unit tests live beside their source modules for now.

The M0 implementation scaffold and loader tests are present. Keep future source paths and commands reflected in this map.

## Read next

| Document | Answers | Read after |
|---|---|---|
| [docs/ONBOARDING.md](docs/ONBOARDING.md) | How do I set up and run the project? | This page |
| [docs/SETUP.md](docs/SETUP.md) | What is the manual setup and troubleshooting path? | Onboarding |
| [docs/CONTENT_PIPELINE.md](docs/CONTENT_PIPELINE.md) | How do levels and media become bundled content? | Setup |
| [docs/tasks/M4-GREAT.md](docs/tasks/M4-GREAT.md) | What Great-tier work is complete and what remains for release sign-off? | Relevant milestone |
| [docs/tasks/M5-COMPLETION.md](docs/tasks/M5-COMPLETION.md) | What remains to make the project fully complete and release-signed-off? | Current completion milestone |
| [specs/README.md](specs/README.md) | How do the living specifications relate? | This page |
| [docs/AI_AGENT_PLAYBOOK.md](docs/AI_AGENT_PLAYBOOK.md) | How should humans and coding agents collaborate? | This page |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Why were important project constraints chosen? | Relevant spec |

## Specification map

Read and update the chain in order:

`PRD -> DEVSPEC -> UISPEC -> TESTSPEC`

- [PRD](specs/PRD.md) defines product intent, users, scope, and goals.
- [DEVSPEC](specs/DEVSPEC.md) defines behavior, schemas, modules, and constraints.
- [UISPEC](specs/UISPEC.md) defines screens, states, and interaction presentation.
- [TESTSPEC](specs/TESTSPEC.md) defines fixtures, tests, and acceptance gates.

When intent changes, reconcile downstream documents in that order. When implementation changes without changing intent, update the earliest affected document and its downstream references.

## Working here

Agents should read `AGENTS.md`, this README, the specs index, and only the operational documents relevant to the request. Inspect current code before assuming the scaffold or docs are complete. Keep external effects and product-policy decisions with a human.

## Current status

The M3 Better implementation and M4 Great gameplay are complete. The app boots with bundled levels, blocks gameplay with visible validation errors when level data is invalid, supports animated random spins, manual letter stepping, and flick-to-spin interaction, recovers cancelled pointer previews, shows no-match feedback, progresses after 50% distinct-word completion, and preserves the image/audio reward loop at both three-spinner and five-spinner levels. Automated checks pass (`pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`), the browser E2E suite passes, and the required Android emulator smoke protocol also passed. M5-01 through M5-07 are complete, and the recorded release evidence in [specs/TESTSPEC.md](specs/TESTSPEC.md) now reflects a successful mobile smoke run.

The browser E2E runner and mobile acceptance checks are configured and passing with the local Playwright flow in [playwright.config.ts](playwright.config.ts). The Android emulator smoke test passed with a valid reward loop, no-match fallback, middle-wheel vowel constraint, and stable portrait layout, so the project records formal release sign-off for the current implementation. No additional M4 gameplay work is pending.
