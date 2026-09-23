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

The M3 Better implementation is complete, and the Great-tier five-spinner reward flow is now verified. The app boots with bundled levels, blocks gameplay with visible validation errors when level data is invalid, supports animated random spins, manual letter stepping, and flick-to-spin interaction, shows no-match feedback, progresses after 50% distinct-word completion, and preserves the image/audio reward loop at both three-spinner and five-spinner levels. Automated checks pass (`pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`); browser checks pass at a 390x844 viewport. Physical-device smoke testing remains a release-signoff gate because no physical mobile device/browser was available.

Formal release sign-off still requires the physical-device smoke check listed in [TESTSPEC.md](specs/TESTSPEC.md). The remaining M4 sign-off items are tracker and release documentation follow-through rather than new gameplay work.
