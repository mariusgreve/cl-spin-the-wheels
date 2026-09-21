# Spin The Wheels Architecture Decisions

This log records decisions that are easy to lose during implementation. The specifications remain authoritative for product behavior; this file records rationale and implementation direction.

## Project target: React web

The app uses React for the web, not React Native. It must render correctly at mobile viewport sizes and remain usable when opened directly in a browser. No native module, Android/iOS shell, CMS API, or host bridge is part of the app contract.

## Offline content model

Levels are bundled JSON files with local image and audio assets. Runtime gameplay must not require a network connection. The level loader validates schema, spellability, the three-spinner vowel constraint, and referenced media before starting a level.

## Toolchain review: September 2026

The M0 React scaffold is now implemented. The table records the toolchain choices used by the application and the remaining browser-test recommendation:

| Technology | Status in 2026 | Decision |
|---|---|---|
| Node.js LTS | Current and widely used | Use the current LTS release; do not pin a version until the scaffold is created. |
| pnpm | Current and widely used | Use pnpm for dependency installation and package scripts. Commit the generated `pnpm-lock.yaml` with the scaffold. |
| React | Current and widely used | Use the current stable React release for the web app. React Native is not applicable to this host-agnostic browser project. |
| TypeScript | Current and widely used | Use strict TypeScript for level schemas and application code. |
| Vite | Current and widely used | Use Vite for development and production builds. It is the modern choice here; Create React App is maintenance-only and should not be selected for a new app. |
| Playwright | Current and widely used | Prefer Playwright for browser E2E tests because it covers Chromium, Firefox, and WebKit with strong mobile emulation. Cypress remains viable when its interaction model is preferred. |
| Browser Pointer Events API | Stable platform standard | Use it for flick input instead of a React Native gesture library. |
| CSS transitions / Web Animations / `requestAnimationFrame` | Stable platform APIs | Use the simplest browser-native animation mechanism that meets the spinner interaction needs. |
| Bundled JSON and local media | Appropriate for this product | Keep the offline-first content model; a backend or CMS would add complexity without solving an in-scope need. |

Exact dependency versions are recorded in `package.json` and `pnpm-lock.yaml`; update them through the package manager rather than hand-editing the lockfile.

## Spinner state and resolution

Each spinner owns a current letter index, and the displayed letters are derived from those indices. Random spin, manual stepping, and flick gestures all settle through the same event path so word resolution and media behavior stay consistent.

## Tiered delivery

MVP provides random spin, word selection, matching, and image/audio reward. Better adds manual letter control, no-word feedback, and distinct-word progression. Great adds velocity-sensitive flick interaction and N-letter support. Later tiers must not regress earlier-tier behavior.

## Progression threshold

The 50% threshold counts distinct words successfully matched during the current level session. It does not count repeated matches or arbitrary interactions. When there is no next level, the current level remains playable without looping or erroring.

## Audio overlap

Starting a new reward or placeholder clip stops the previous clip first. Audio failure is non-fatal: the visual state remains usable and the error is handled without crashing gameplay.

## Change log

2026-09-21 — GitHub Copilot — Initial architecture decisions adapted from the reference project for Spin The Wheels.
2026-09-21 — GitHub Copilot — Updated toolchain status and dependency-version guidance after M0 scaffold implementation.
