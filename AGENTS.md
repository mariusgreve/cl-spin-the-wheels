# Agent Instructions

Spin The Wheels is an offline-first early-literacy game for children, implemented as a React web app for mobile-sized viewports. Read [README.md](README.md) for the repository map, then read the relevant specs before changing behavior.

## Non-negotiables

- The app is a React web app, not React Native and not a native Android/iOS app.
- Gameplay must work from bundled JSON and media without a network dependency.
- Keep the app host-agnostic. Do not add CMS, Android webview, or native bridge assumptions.
- English-language content is in scope; localization, accounts, analytics, and multiplayer are not.
- The middle spinner contains vowels only when a level has exactly three spinners.
- Prefer the simplest implementation appropriate for a beginner/intermediate workshop project.
- Do not commit secrets, generated build output, dependency directories, or coverage artifacts.

## Do not hand-edit

- Build output such as `dist/` or `build/`.
- Generated coverage reports.
- Generated level or media artifacts once a content-generation workflow exists; update their source and regenerate instead.

## Specification chain

The living source of truth is:

`PRD -> DEVSPEC -> UISPEC -> TESTSPEC`

Read [specs/README.md](specs/README.md) for the authoring rules. DEVSPEC is authoritative for behavior; UISPEC defines the user-facing presentation and interaction contract; TESTSPEC defines verification.

## Commands worth knowing

The M0 React scaffold exists. Verified commands are:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test:e2e` remains a planned command for a later browser-test milestone.

Do not claim a command passed unless it was run and its result is known.

## Architecture notes

- Levels are JSON-defined and must be validated before gameplay starts.
- Spinner state is the source of truth for the letters currently shown.
- Word resolution occurs after each settle or manual step.
- Media playback must stop the previous clip before starting a new one.
- MVP random spin, Better manual controls/progression, and Great flick/N-letter support are cumulative tiers from the specs.

## Working agreements

- Inspect current code before trusting a document; specs are living documents and may lag implementation.
- Separate verified repository facts, open questions, and recommendations.
- Keep changes within the requested scope and update downstream specs when product behavior changes.
- A task is not complete until its status is updated in the relevant milestone tracker and the verification evidence for that task is recorded.
- Pause for human confirmation before credentials, destructive actions, external writes, publishing, or a material change in product intent.
- Validate focused behavior first, then broaden to typecheck, tests, build, and browser checks as the project supports them.
